// Where the offline copy lives. Public data (weather, product and crop lists) shares one storage key; private data
// (orders) gets one key per user id, so one person's copy can never be read back for another. Keys carry a version
// so a future format change just starts afresh.

export const CACHE_STORAGE_VERSION = 1;
const BASE = `sgkrashi.cache.v${CACHE_STORAGE_VERSION}`;

export const PUBLIC_CACHE_KEY = `${BASE}.public`;
export const PRIVATE_CACHE_PREFIX = `${BASE}.user.`;

export const userCacheKey = (userId: number): string => `${PRIVATE_CACHE_PREFIX}${userId}`;

/** Any stored private cache key (of any user, of this or an older format version). */
export const isPrivateCacheKey = (key: string): boolean => key.startsWith("sgkrashi.cache.") && key.includes(".user.");
