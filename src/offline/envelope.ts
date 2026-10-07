// The stored format: one JSON envelope per storage key. Reading it back NEVER throws and never trusts it:
// a different version, corrupt JSON, the wrong scope or user, an entry with no matching rule, or an entry older than
// its rule's max age is dropped silently.
import { ruleFor, type CacheScope, type QueryKeyLike } from "./cacheConfig.ts";

export const ENVELOPE_VERSION = 1;
/** Entries stamped further in the future than this (a wrong clock) are not trusted. */
const CLOCK_SKEW_MS = 5 * 60 * 1000;

export interface StoredEntry {
  /** query key */
  k: QueryKeyLike;
  /** data (already sanitized) */
  d: unknown;
  /** dataUpdatedAt, ms since epoch */
  u: number;
  /** rule id */
  r: string;
}

export interface Envelope {
  v: number;
  savedAt: number;
  scope: CacheScope;
  /** Owner of a private envelope; null for public. */
  userId: number | null;
  entries: StoredEntry[];
}

export const buildEnvelope = (scope: CacheScope, userId: number | null, entries: StoredEntry[], now: number): string =>
  JSON.stringify({ v: ENVELOPE_VERSION, savedAt: now, scope, userId, entries } satisfies Envelope);

export interface ParseOptions {
  now: number;
  scope: CacheScope;
  /** Required for private envelopes: only this user's envelope is accepted. */
  userId?: number | null;
}

export const parseEnvelope = (raw: string | null | undefined, options: ParseOptions): StoredEntry[] => {
  try {
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<Envelope> | null;
    if (!parsed || typeof parsed !== "object" || parsed.v !== ENVELOPE_VERSION) return [];
    if (parsed.scope !== options.scope || !Array.isArray(parsed.entries)) return [];
    if (options.scope === "private" && (options.userId == null || parsed.userId !== options.userId)) return [];
    if (options.scope === "public" && parsed.userId !== null) return [];

    const kept: StoredEntry[] = [];
    for (const entry of parsed.entries) {
      if (!entry || typeof entry !== "object" || !Array.isArray(entry.k) || typeof entry.u !== "number") continue;
      if (entry.d === undefined || entry.d === null) continue;
      const rule = ruleFor(entry.k);
      if (!rule || rule.id !== entry.r || rule.scope !== options.scope) continue;
      if (options.now - entry.u > rule.maxAgeMs || entry.u - options.now > CLOCK_SKEW_MS) continue;
      kept.push({ k: entry.k, d: rule.sanitize ? rule.sanitize(entry.d) : entry.d, u: entry.u, r: entry.r });
    }
    return kept;
  } catch {
    return [];
  }
};

/** Age of a stored envelope without trusting its contents; null if unreadable. Used to sweep leftovers. */
export const envelopeSavedAt = (raw: string | null | undefined): number | null => {
  try {
    const parsed = raw ? (JSON.parse(raw) as Partial<Envelope>) : null;
    return parsed && typeof parsed.savedAt === "number" ? parsed.savedAt : null;
  } catch {
    return null;
  }
};
