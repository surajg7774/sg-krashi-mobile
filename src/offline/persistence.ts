// Saves the whitelisted, successful queries to storage (debounced) and puts them back into the query cache on start.
// Read-only offline: only query results are stored - never mutations, tokens or anything outside cacheConfig's allow-list.
//
// Pure of React Native and React Query imports: the client and the storage are passed in (see the small interfaces
// below), so every rule here is unit-tested with fakes (tests/offlinePersistence.test.ts). A failure anywhere is
// swallowed: the offline copy is a convenience and must never block or crash the app.
import { ruleFor, type QueryKeyLike } from "./cacheConfig.ts";
import { buildEnvelope, envelopeSavedAt, parseEnvelope, type StoredEntry } from "./envelope.ts";
import { PRIVATE_CACHE_MAX_BYTES, PUBLIC_CACHE_MAX_BYTES, evictEntries } from "./eviction.ts";
import { PUBLIC_CACHE_KEY, isPrivateCacheKey, userCacheKey } from "./scoping.ts";
import { DAY_MS } from "./cacheConfig.ts";

export interface CachedQueryLike {
  queryKey: QueryKeyLike;
  state: { status: string; data: unknown; dataUpdatedAt: number };
}

export interface PersistableClient {
  getQueryCache: () => {
    getAll: () => CachedQueryLike[];
    subscribe: (listener: (event: unknown) => void) => () => void;
  };
  getQueryState: (key: QueryKeyLike) => { dataUpdatedAt: number } | undefined;
  setQueryData: (key: QueryKeyLike, data: unknown, options?: { updatedAt?: number }) => unknown;
}

export interface OfflineStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  getAllKeys?: () => Promise<readonly string[]>;
}

export interface OfflineCacheOptions {
  client: PersistableClient;
  storage: OfflineStorage;
  now?: () => number;
  debounceMs?: number;
}

/** A private copy nobody has opened for this long is a leftover (e.g. the app was killed during logout) and is swept. */
const LEFTOVER_PRIVATE_COPY_MS = 7 * DAY_MS;

export const createOfflineCache = (options: OfflineCacheOptions) => {
  const { client, storage } = options;
  const now = options.now ?? (() => Date.now());
  const debounceMs = options.debounceMs ?? 2000;

  let activeUserId: number | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  // Bumped whenever private data must stop being written (user change / clear); a queued save that started under
  // an older epoch writes nothing.
  let epoch = 0;
  // Storage operations run one after another, so a removal can never be overtaken by an older, slower write.
  let queue: Promise<unknown> = Promise.resolve();
  const enqueue = <T>(operation: () => Promise<T>): Promise<T | undefined> => {
    const next = queue.then(operation, operation).catch(() => undefined) as Promise<T | undefined>;
    queue = next;
    return next;
  };

  const collect = (): { publicEntries: StoredEntry[]; privateEntries: StoredEntry[] } => {
    const publicEntries: StoredEntry[] = [];
    const privateEntries: StoredEntry[] = [];
    for (const query of client.getQueryCache().getAll()) {
      const { status, data, dataUpdatedAt } = query.state;
      if (status !== "success" || data === undefined || data === null || !(dataUpdatedAt > 0)) continue;
      const rule = ruleFor(query.queryKey);
      if (!rule) continue; // not on the allow-list: never persisted
      const entry: StoredEntry = {
        k: query.queryKey,
        d: rule.sanitize ? rule.sanitize(data) : data,
        u: dataUpdatedAt,
        r: rule.id,
      };
      (rule.scope === "public" ? publicEntries : privateEntries).push(entry);
    }
    return { publicEntries, privateEntries };
  };

  const writeNow = async (): Promise<void> => {
    const startedUnder = epoch;
    const userId = activeUserId;
    const { publicEntries, privateEntries } = collect();
    const when = now();

    // An empty set is never written: after a logout clear the cache is empty and must not erase the public copy.
    const publicKept = evictEntries(publicEntries, PUBLIC_CACHE_MAX_BYTES);
    if (publicKept.length > 0) {
      await storage.setItem(PUBLIC_CACHE_KEY, buildEnvelope("public", null, publicKept, when));
    }
    if (userId !== null && epoch === startedUnder) {
      const privateKept = evictEntries(privateEntries, PRIVATE_CACHE_MAX_BYTES);
      if (privateKept.length > 0 && epoch === startedUnder && activeUserId === userId) {
        await storage.setItem(userCacheKey(userId), buildEnvelope("private", userId, privateKept, when));
      }
    }
  };

  const restoreEntries = (entries: StoredEntry[]): number => {
    let restored = 0;
    for (const entry of entries) {
      const existing = client.getQueryState(entry.k);
      if (existing && existing.dataUpdatedAt >= entry.u) continue; // fresher data is already in memory
      client.setQueryData(entry.k, entry.d, { updatedAt: entry.u });
      restored++;
    }
    return restored;
  };

  const api = {
    /** Starts saving whenever the query cache changes. Returns the unsubscribe function. */
    start: (): (() => void) => {
      const unsubscribe = client.getQueryCache().subscribe(() => api.scheduleSave());
      return () => {
        unsubscribe();
        if (timer) clearTimeout(timer);
        timer = null;
      };
    },

    scheduleSave: (): void => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        void api.saveNow();
      }, debounceMs);
    },

    saveNow: async (): Promise<void> => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      await enqueue(writeNow);
    },

    /** The signed-in user (or null). Private data is only ever written for this id. */
    setActiveUser: (userId: number | null): void => {
      if (userId !== activeUserId) epoch++;
      activeUserId = userId;
    },

    getActiveUser: (): number | null => activeUserId,

    /** Public copy (weather, product and crop lists). Never throws; returns how many entries were restored. */
    restorePublic: async (): Promise<number> => {
      try {
        const raw = await storage.getItem(PUBLIC_CACHE_KEY);
        return restoreEntries(parseEnvelope(raw, { now: now(), scope: "public" }));
      } catch {
        return 0;
      }
    },

    /** This user's private copy, and removal of any other user's leftover copy. Never throws. */
    restorePrivate: async (userId: number): Promise<number> => {
      let restored = 0;
      try {
        const raw = await storage.getItem(userCacheKey(userId));
        if (activeUserId === userId) {
          restored = restoreEntries(parseEnvelope(raw, { now: now(), scope: "private", userId }));
        }
      } catch {
        // unreadable copy: just start empty
      }
      try {
        await api.sweepLeftovers(userId);
      } catch {
        // sweeping is best-effort
      }
      return restored;
    },

    /** Removes private copies that belong to someone else (a logout that never finished) or are long expired. */
    sweepLeftovers: async (currentUserId: number | null): Promise<void> => {
      if (!storage.getAllKeys) return;
      const keys = (await storage.getAllKeys()).filter(isPrivateCacheKey);
      for (const key of keys) {
        const isCurrent = currentUserId !== null && key === userCacheKey(currentUserId);
        if (!isCurrent) {
          await enqueue(() => storage.removeItem(key));
          continue;
        }
        const savedAt = envelopeSavedAt(await storage.getItem(key));
        if (savedAt === null || now() - savedAt > LEFTOVER_PRIVATE_COPY_MS) {
          await enqueue(() => storage.removeItem(key));
        }
      }
    },

    /**
     * Removes the signed-in user's stored private copy (logout, account deletion, forced logout) and stops any
     * pending or in-flight save from writing it back. The public copy and any other user's copy are left alone
     * (another user's leftover is swept when someone logs in, see restorePrivate).
     */
    clearPrivate: async (): Promise<void> => {
      const userId = activeUserId;
      epoch++;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (userId !== null) {
        await enqueue(() => storage.removeItem(userCacheKey(userId)));
      }
    },
  };
  return api;
};

export type OfflineCache = ReturnType<typeof createOfflineCache>;
