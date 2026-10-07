// When the app comes back to the foreground, refresh ONLY the queries that are on screen showing an offline error,
// so the offline banner clears itself once the connection is back. No polling, no NetInfo: one pass per return to
// the app. Pure (the client is passed in) so the decision is unit-tested with Node (tests/offlineForeground.test.ts).
import { ruleFor, type QueryKeyLike } from "./cacheConfig.ts";
import { isOfflineError } from "./offlineError.ts";

export interface ForegroundQueryLike {
  queryKey: QueryKeyLike;
  state: { status: string; fetchStatus?: string; error?: unknown };
  /** Number of mounted screens observing this query. */
  getObserversCount?: () => number;
}

export interface ForegroundClient {
  getQueryCache: () => { getAll: () => ForegroundQueryLike[] };
  refetchQueries: (filters: { queryKey: QueryKeyLike; exact: true; type: "active" }) => Promise<unknown>;
}

/** Whitelisted (offline-cached) queries, currently failed for lack of connection, not already refetching, and on screen. */
export const queriesToRefetchOnForeground = (queries: ForegroundQueryLike[]): QueryKeyLike[] =>
  queries
    .filter(
      (query) =>
        ruleFor(query.queryKey) !== undefined &&
        query.state.status === "error" &&
        isOfflineError(query.state.error) &&
        query.state.fetchStatus !== "fetching" &&
        (query.getObserversCount ? query.getObserversCount() > 0 : true),
    )
    .map((query) => query.queryKey);

export const refetchOfflineErrors = async (client: ForegroundClient): Promise<number> => {
  try {
    const keys = queriesToRefetchOnForeground(client.getQueryCache().getAll());
    await Promise.allSettled(keys.map((queryKey) => client.refetchQueries({ queryKey, exact: true, type: "active" })));
    return keys.length;
  } catch {
    return 0; // best-effort: never throws into the app
  }
};
