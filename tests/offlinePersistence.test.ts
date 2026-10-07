import assert from "node:assert/strict";
import { test } from "node:test";
import { createOfflineCache, type CachedQueryLike, type OfflineStorage, type PersistableClient } from "../src/offline/persistence.ts";
import { PUBLIC_CACHE_KEY, userCacheKey } from "../src/offline/scoping.ts";
import { buildEnvelope } from "../src/offline/envelope.ts";
import { clearLocalUserData } from "../src/shared/sessionCleanup.ts";
import { WEATHER_LOCATION_KEY, ONBOARDING_SEEN_KEY } from "../src/shared/storageKeys.ts";

const NOW = 1_800_000_000_000;

const fakeClient = (queries: CachedQueryLike[] = []) => {
  const state = new Map<string, { data: unknown; dataUpdatedAt: number }>();
  const listeners: Array<(event: unknown) => void> = [];
  const client: PersistableClient & { queries: CachedQueryLike[]; set: typeof state; emit: () => void } = {
    queries,
    set: state,
    emit: () => listeners.forEach((l) => l({})),
    getQueryCache: () => ({
      getAll: () => client.queries,
      subscribe: (listener) => {
        listeners.push(listener);
        return () => listeners.splice(listeners.indexOf(listener), 1);
      },
    }),
    getQueryState: (key) => {
      const entry = state.get(JSON.stringify(key));
      return entry ? { dataUpdatedAt: entry.dataUpdatedAt } : undefined;
    },
    setQueryData: (key, data, options) => {
      state.set(JSON.stringify(key), { data, dataUpdatedAt: options?.updatedAt ?? NOW });
    },
  };
  return client;
};

const fakeStorage = (initial: Record<string, string> = {}, opts: { failReads?: boolean; failWrites?: boolean; writeDelayMs?: number } = {}) => {
  const data = new Map(Object.entries(initial));
  const storage: OfflineStorage & { data: Map<string, string> } = {
    data,
    getItem: async (key) => {
      if (opts.failReads) throw new Error("read failed");
      return data.get(key) ?? null;
    },
    setItem: async (key, value) => {
      if (opts.writeDelayMs) await new Promise((r) => setTimeout(r, opts.writeDelayMs));
      if (opts.failWrites) throw new Error("write failed");
      data.set(key, value);
    },
    removeItem: async (key) => {
      data.delete(key);
    },
    getAllKeys: async () => [...data.keys()],
  };
  return storage;
};

const q = (queryKey: unknown[], data: unknown, dataUpdatedAt = NOW - 1000, status = "success"): CachedQueryLike => ({
  queryKey,
  state: { status, data, dataUpdatedAt },
});

const orderDetail = { id: 7, orderNumber: "SK-7", shippingLine1: "12 Secret Lane", shippingLine2: "Grove", shippingCity: "Indore", shippingState: "MP", shippingPincode: "452001" };

const make = (queries: CachedQueryLike[], storage = fakeStorage()) => {
  const client = fakeClient(queries);
  const cache = createOfflineCache({ client, storage, now: () => NOW, debounceMs: 5 });
  return { client, storage, cache };
};

// ---------------------------------------------------------------- what is saved
test("only whitelisted, successful queries are saved; everything else is never written", async () => {
  const { cache, storage } = make([
    q(["weather-current", 22.7, 75.8], { t: 30 }),
    q(["crop-listings", "home"], { items: [] }),
    q(["mandi-prices", "Wheat"], { secret: "mandi" }),
    q(["recommendations", "for-you"], { secret: "reco" }),
    q(["crop-doctor-history"], { secret: "scan" }),
    q(["notifications-unread-count"], 3),
    q(["weather-current", 1, 2], { t: 1 }, NOW - 1000, "error"),
    q(["weather-current", 3, 4], undefined),
    q(["weather-current", 5, 6], { t: 2 }, NOW - 1000, "pending"),
  ]);
  cache.setActiveUser(1);
  await cache.saveNow();
  const written = JSON.stringify([...storage.data.values()]);
  assert.ok(storage.data.has(PUBLIC_CACHE_KEY));
  assert.ok(written.includes("22.7") && written.includes("crop-listings"));
  for (const forbidden of ["mandi", "reco", "scan", "notifications-unread-count"]) assert.equal(written.includes(forbidden), false, forbidden);
  const keys = JSON.parse(storage.data.get(PUBLIC_CACHE_KEY)!).entries.map((e: { k: unknown[] }) => e.k[0]);
  assert.deepEqual(keys.sort(), ["crop-listings", "weather-current"]);
});

test("mutations and tokens are not even visible to the saver: it reads only the query cache", async () => {
  const { cache, storage } = make([q(["weather-current", 1, 2], { t: 1 })]);
  await cache.saveNow();
  assert.equal([...storage.data.keys()].every((k) => k.startsWith("sgkrashi.cache.")), true);
  assert.equal(JSON.stringify([...storage.data.values()]).toLowerCase().includes("token"), false);
});

test("private data goes under the signed-in user's key only, with the delivery address stripped", async () => {
  const { cache, storage } = make([q(["orders", "my"], { pages: [{ items: [{ id: 7 }] }] }), q(["order", 7], orderDetail), q(["weather-current", 1, 2], { t: 1 })]);
  cache.setActiveUser(42);
  await cache.saveNow();
  assert.ok(storage.data.has(userCacheKey(42)));
  assert.ok(!storage.data.has(userCacheKey(43)));
  const privateRaw = storage.data.get(userCacheKey(42))!;
  assert.equal(privateRaw.includes("Secret"), false);
  assert.equal(privateRaw.includes("452001"), false);
  assert.equal(privateRaw.includes("Indore"), false);
  assert.ok(privateRaw.includes("SK-7"));
  // and nothing private leaks into the shared public copy
  const publicRaw = storage.data.get(PUBLIC_CACHE_KEY)!;
  assert.equal(publicRaw.includes("SK-7"), false);
  assert.equal(publicRaw.includes("orders"), false);
});

test("with nobody signed in, private data is not written anywhere", async () => {
  const { cache, storage } = make([q(["orders", "my"], { pages: [] }), q(["order", 7], orderDetail)]);
  cache.setActiveUser(null);
  await cache.saveNow();
  assert.equal(storage.data.size, 0);
});

test("an empty cache never overwrites an existing public copy (e.g. right after a logout clear)", async () => {
  const existing = buildEnvelope("public", null, [{ k: ["weather-current", 1, 2], d: { t: 1 }, u: NOW - 1000, r: "weather-current" }], NOW - 5000);
  const { cache, storage } = make([], fakeStorage({ [PUBLIC_CACHE_KEY]: existing }));
  await cache.saveNow();
  assert.equal(storage.data.get(PUBLIC_CACHE_KEY), existing);
});

test("a storage write failure never throws out of saveNow", async () => {
  const { cache } = make([q(["weather-current", 1, 2], { t: 1 })], fakeStorage({}, { failWrites: true }));
  await assert.doesNotReject(cache.saveNow());
});

test("the debounced save fires after the cache changes", async () => {
  const { cache, client, storage } = make([q(["weather-current", 1, 2], { t: 1 })]);
  const stop = cache.start();
  client.emit();
  client.emit();
  assert.equal(storage.data.size, 0, "not yet");
  await new Promise((r) => setTimeout(r, 40));
  assert.ok(storage.data.has(PUBLIC_CACHE_KEY));
  stop();
});

// ---------------------------------------------------------------- restore
test("restorePublic puts saved entries back with their original update time, so staleness is preserved", async () => {
  const raw = buildEnvelope("public", null, [{ k: ["weather-current", 22.7, 75.8], d: { t: 30 }, u: NOW - 3 * 3_600_000, r: "weather-current" }], NOW - 1000);
  const { cache, client } = make([], fakeStorage({ [PUBLIC_CACHE_KEY]: raw }));
  assert.equal(await cache.restorePublic(), 1);
  assert.deepEqual(client.set.get(JSON.stringify(["weather-current", 22.7, 75.8])), { data: { t: 30 }, dataUpdatedAt: NOW - 3 * 3_600_000 });
});

test("restore failure (unreadable or corrupt storage) never throws and restores nothing", async () => {
  const failing = make([], fakeStorage({}, { failReads: true }));
  await assert.doesNotReject(failing.cache.restorePublic());
  assert.equal(await failing.cache.restorePublic(), 0);
  failing.cache.setActiveUser(1);
  assert.equal(await failing.cache.restorePrivate(1), 0);

  const corrupt = make([], fakeStorage({ [PUBLIC_CACHE_KEY]: "{definitely not json", [userCacheKey(1)]: "\u0000\u0000" }));
  corrupt.cache.setActiveUser(1);
  assert.equal(await corrupt.cache.restorePublic(), 0);
  assert.equal(await corrupt.cache.restorePrivate(1), 0);
});

test("fresher data already in memory is not overwritten by an older stored copy", async () => {
  const raw = buildEnvelope("public", null, [{ k: ["weather-current", 1, 2], d: { t: "old" }, u: NOW - 5000, r: "weather-current" }], NOW);
  const { cache, client } = make([], fakeStorage({ [PUBLIC_CACHE_KEY]: raw }));
  client.setQueryData(["weather-current", 1, 2], { t: "new" }, { updatedAt: NOW - 100 });
  assert.equal(await cache.restorePublic(), 0);
  assert.deepEqual(client.set.get(JSON.stringify(["weather-current", 1, 2]))?.data, { t: "new" });
});

// ---------------------------------------------------------------- scoping between users
test("a user only ever gets their own private copy back; another user's copy is never read and is swept", async () => {
  const mine = buildEnvelope("private", 1, [{ k: ["orders", "my"], d: { pages: ["mine"] }, u: NOW - 1000, r: "orders-list" }], NOW);
  const theirs = buildEnvelope("private", 2, [{ k: ["orders", "my"], d: { pages: ["theirs"] }, u: NOW - 1000, r: "orders-list" }], NOW);
  const storage = fakeStorage({ [userCacheKey(1)]: mine, [userCacheKey(2)]: theirs, [PUBLIC_CACHE_KEY]: "{}" });
  const { cache, client } = make([], storage);
  cache.setActiveUser(1);
  assert.equal(await cache.restorePrivate(1), 1);
  assert.deepEqual(client.set.get(JSON.stringify(["orders", "my"]))?.data, { pages: ["mine"] });
  assert.equal(storage.data.has(userCacheKey(2)), false, "the other user's leftover copy is removed");
  assert.equal(storage.data.has(userCacheKey(1)), true);
  assert.equal(storage.data.has(PUBLIC_CACHE_KEY), true, "the public copy is untouched");
});

test("a copy stored under user 2's key but claiming user 1 is rejected (no mis-read)", async () => {
  const forged = buildEnvelope("private", 1, [{ k: ["orders", "my"], d: { pages: ["x"] }, u: NOW - 1000, r: "orders-list" }], NOW);
  const { cache, client } = make([], fakeStorage({ [userCacheKey(2)]: forged }));
  cache.setActiveUser(2);
  assert.equal(await cache.restorePrivate(2), 0);
  assert.equal(client.set.size, 0);
});

test("restorePrivate does nothing if the active user changed meanwhile", async () => {
  const raw = buildEnvelope("private", 1, [{ k: ["orders", "my"], d: { pages: [] }, u: NOW - 1000, r: "orders-list" }], NOW);
  const { cache, client } = make([], fakeStorage({ [userCacheKey(1)]: raw }));
  cache.setActiveUser(2);
  assert.equal(await cache.restorePrivate(1), 0);
  assert.equal(client.set.size, 0);
});

// ---------------------------------------------------------------- clear on logout / deletion / forced logout
const seeded = () => {
  const storage = fakeStorage({
    [userCacheKey(1)]: buildEnvelope("private", 1, [{ k: ["orders", "my"], d: { p: 1 }, u: NOW - 1000, r: "orders-list" }], NOW),
    [userCacheKey(2)]: buildEnvelope("private", 2, [{ k: ["orders", "my"], d: { p: 2 }, u: NOW - 1000, r: "orders-list" }], NOW),
    [PUBLIC_CACHE_KEY]: buildEnvelope("public", null, [{ k: ["weather-current", 1, 2], d: { t: 1 }, u: NOW - 1000, r: "weather-current" }], NOW),
    [WEATHER_LOCATION_KEY]: '{"latitude":1,"longitude":2,"label":"x"}',
    [ONBOARDING_SEEN_KEY]: "true",
  });
  return storage;
};

for (const path of ["logout", "account deletion", "forced logout"]) {
  test(`${path}: clearLocalUserData removes only that user's private copy (all three paths end in this one call)`, async () => {
    const storage = seeded();
    const { cache } = make([q(["orders", "my"], { pages: [] })], storage);
    cache.setActiveUser(1);
    const queryClient = { cancelQueries: async () => undefined, clear: () => undefined };
    await clearLocalUserData({ queryClient, storage, offlineCache: cache });
    assert.equal(storage.data.has(userCacheKey(1)), false, "the leaving user's private copy is gone");
    assert.equal(storage.data.has(userCacheKey(2)), true, "no other user's copy is touched");
    assert.equal(storage.data.has(PUBLIC_CACHE_KEY), true, "the public copy stays");
    assert.equal(storage.data.has(WEATHER_LOCATION_KEY), false);
    assert.equal(storage.data.has(ONBOARDING_SEEN_KEY), true, "the onboarding flag stays");
  });
}

test("a save in flight when the user logs out cannot write the private copy back afterwards", async () => {
  const storage = fakeStorage({}, { writeDelayMs: 30 });
  const { cache } = make([q(["orders", "my"], { pages: [] }), q(["weather-current", 1, 2], { t: 1 })], storage);
  cache.setActiveUser(1);
  const saving = cache.saveNow(); // slow write starts
  await new Promise((r) => setTimeout(r, 5));
  const queryClient = { cancelQueries: async () => undefined, clear: () => undefined };
  await clearLocalUserData({ queryClient, storage, offlineCache: cache });
  await saving;
  assert.equal(storage.data.has(userCacheKey(1)), false, "no resurrection of the logged-out user's data");
});

test("a pending debounced save is cancelled by the clear", async () => {
  const storage = fakeStorage();
  const { cache } = make([q(["orders", "my"], { pages: [] })], storage);
  cache.setActiveUser(1);
  cache.scheduleSave();
  await cache.clearPrivate();
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(storage.data.has(userCacheKey(1)), false);
});

test("after logout the next user gets a clean slate: their save writes only their own key", async () => {
  const storage = seeded();
  const { cache } = make([q(["orders", "my"], { pages: ["b"] })], storage);
  cache.setActiveUser(1);
  await cache.clearPrivate();
  cache.setActiveUser(2);
  await cache.saveNow();
  assert.ok(JSON.parse(storage.data.get(userCacheKey(2))!).entries[0].d.pages[0] === "b");
  assert.equal(storage.data.has(userCacheKey(1)), false);
});
