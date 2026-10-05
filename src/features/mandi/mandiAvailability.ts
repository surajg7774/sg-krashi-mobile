import type { MandiFilterOptions, MandiSyncMeta } from "./types";

// The screen-level answer to "is there anything to show yet?", kept pure so
// the one rule that matters — a failed request is an error, never "awaiting
// data" — can be checked without rendering. Mirrors the web page's
// features/mandi/availability.ts exactly.
//
//   loading  — sync metadata hasn't answered yet (undecided; show skeletons)
//   error    — a request failed and there's nothing on screen to fall back on
//   awaiting — the server answered, and says nothing has been synced yet
//   ready    — real data exists (or a filter simply matched nothing)

export type MandiAvailability = "loading" | "error" | "awaiting" | "ready";

interface Probe<T> {
  isLoading: boolean;
  isError: boolean;
  data: T | undefined;
}

export interface MandiAvailabilityInput {
  meta: Probe<MandiSyncMeta>;
  filters: Probe<MandiFilterOptions>;
  /** The price list's own request state, plus how many rows it currently holds. */
  prices: { isError: boolean; itemCount: number };
  /** The selected state filter, if any — an empty commodity list under a state filter is a filtered-empty result, not "no data". */
  state: string | undefined;
}

export const resolveMandiAvailability = ({ meta, filters, prices, state }: MandiAvailabilityInput): MandiAvailability => {
  if (meta.isLoading) {
    return "loading";
  }

  const hasItems = prices.itemCount > 0;
  if (!hasItems && (prices.isError || meta.isError || filters.isError)) {
    return "error";
  }

  const neverSynced = meta.data !== undefined && (meta.data.totalRows === 0 || meta.data.lastSyncedAt === null);
  const noCommodities = state === undefined && filters.data !== undefined && filters.data.commodities.length === 0;
  if (!hasItems && (neverSynced || noCommodities)) {
    return "awaiting";
  }

  return "ready";
};
