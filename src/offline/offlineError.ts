// "Offline" is detected from the failed request itself - no NetInfo. The API client turns any failure that had no
// HTTP response (no connection, DNS failure, timeout, aborted) into an error with code NETWORK_ERROR
// (src/api/client.ts); an HTTP error (401, 404, 500...) has a status and is NOT offline.

export const isOfflineError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && (error as { code?: unknown }).code === "NETWORK_ERROR";

export interface OfflineDataInput {
  data: unknown;
  dataUpdatedAt: number;
  error: unknown;
  isError: boolean;
}

export interface OfflineDataState {
  /** True when the screen is showing data it already had because the latest refresh failed for lack of connection. */
  isShowingOfflineData: boolean;
  /** When the data shown was last fetched (ms since epoch), or null if there is none. */
  lastUpdatedAt: number | null;
}

/** For the offline banner / "last updated" label (wired in a later step). */
export const describeOfflineData = (query: OfflineDataInput): OfflineDataState => {
  const hasData = query.data !== undefined && query.data !== null;
  return {
    isShowingOfflineData: hasData && query.isError && isOfflineError(query.error),
    lastUpdatedAt: hasData && query.dataUpdatedAt > 0 ? query.dataUpdatedAt : null,
  };
};
