// Keeps the stored copy small: newest N entries per rule, then oldest-first removal until the whole envelope fits.
import { ruleById } from "./cacheConfig.ts";
import type { StoredEntry } from "./envelope.ts";

/** Total budget for everything stored by the offline cache: 1.5 MB, split between the shared and the per-user copy. */
export const PUBLIC_CACHE_MAX_BYTES = 1_000_000;
export const PRIVATE_CACHE_MAX_BYTES = 500_000;

/** Bytes a string takes as UTF-8 (JSON.stringify length counts UTF-16 units, which understates non-Latin text). */
export const utf8Length = (text: string): number => {
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff) {
      bytes += 4; // surrogate pair: 4 bytes for the two units together
      i++;
    } else bytes += 3;
  }
  return bytes;
};

const entryBytes = (entry: StoredEntry): number => utf8Length(JSON.stringify(entry)) + 1;

/** Returns the entries to keep (newest first). An entry larger than the whole budget is never kept. */
export const evictEntries = (entries: StoredEntry[], maxBytes: number): StoredEntry[] => {
  const newestFirst = [...entries].sort((a, b) => b.u - a.u);

  // 1. per-rule entry limit
  const perRule = new Map<string, number>();
  const limited = newestFirst.filter((entry) => {
    const limit = ruleById(entry.r)?.maxEntries ?? 0;
    const used = perRule.get(entry.r) ?? 0;
    if (used >= limit) return false;
    perRule.set(entry.r, used + 1);
    return true;
  });

  // 2. byte budget, oldest dropped first (we walk newest to oldest and stop adding once full)
  const kept: StoredEntry[] = [];
  let total = 200; // envelope overhead
  for (const entry of limited) {
    const bytes = entryBytes(entry);
    if (total + bytes > maxBytes) continue; // too big to fit: skip it but still try smaller, older ones
    kept.push(entry);
    total += bytes;
  }
  return kept;
};
