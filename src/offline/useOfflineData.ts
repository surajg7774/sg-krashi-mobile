import { describeOfflineData, type OfflineDataInput, type OfflineDataState } from "./offlineError.ts";

/**
 * For a screen (wired in a later step): pass the result of useQuery / useInfiniteQuery.
 *   isShowingOfflineData -> show the "you're offline" banner while keeping the data on screen
 *   lastUpdatedAt        -> "Last updated ..." label
 * Note a failed refresh leaves `data` in place with `isError` true, so a screen must keep rendering its data when
 * data exists and only show its full-screen error when there is none.
 */
export const useOfflineData = (query: OfflineDataInput): OfflineDataState => describeOfflineData(query);
