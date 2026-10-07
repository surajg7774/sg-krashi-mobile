// Per-query behaviour for the cached screens ONLY (not a global axios timeout and not a global retry change):
//  - a request timeout, applied by URL to the GET endpoints behind the whitelisted queries;
//  - fewer retries: when the failure is "no connection" don't retry (the cached data is already on screen and the
//    error appears at once instead of after several backoff delays), other failures retry once.
import { CACHE_RULES, type QueryKeyLike } from "./cacheConfig.ts";
import { isOfflineError } from "./offlineError.ts";

/** Long enough for a slow rural connection, short enough that a dead one fails over to the cached copy. */
export const CACHED_REQUEST_TIMEOUT_MS = 15_000;

// GET endpoints behind the whitelisted queries (paths are relative to the API base URL).
const CACHED_GET_PATHS: readonly RegExp[] = [
  /^\/orders\/(my|\d+)$/,
  /^\/weather\/current$/,
  /^\/crop-listings(\/[^/]+)?$/,
  /^\/crop-categories$/,
  /^\/products(\/[^/]+)?$/,
  /^\/product-categories$/,
];

/** The timeout to apply to a request, or undefined to leave axios's default (none) untouched. */
export const timeoutForRequest = (method: string | undefined, url: string | undefined): number | undefined => {
  if (!url || (method ?? "get").toLowerCase() !== "get") return undefined;
  const path = url.split("?")[0];
  return CACHED_GET_PATHS.some((pattern) => pattern.test(path)) ? CACHED_REQUEST_TIMEOUT_MS : undefined;
};

export const cachedQueryRetry = (failureCount: number, error: unknown): boolean => {
  if (isOfflineError(error)) return false;
  const status = (error as { status?: unknown } | null)?.status;
  if (typeof status === "number" && status >= 400 && status < 500) return false; // a client error will not fix itself
  return failureCount < 1;
};

export interface DefaultsClient {
  setQueryDefaults: (key: QueryKeyLike, options: { retry: typeof cachedQueryRetry }) => unknown;
}

/** Registers the retry policy for each whitelisted query family. Screens that set their own `retry` still win. */
export const applyCachedQueryDefaults = (client: DefaultsClient): void => {
  for (const rule of CACHE_RULES) {
    client.setQueryDefaults(rule.defaultsKey, { retry: cachedQueryRetry });
  }
};
