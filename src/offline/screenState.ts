// The small decisions the screens make about offline data. Pure (no React Native / React Query imports) so they can
// be unit-tested with Node (tests/offlineScreenState.test.ts); the screens and components only call these.
import { translate, type Lang } from "../i18n/index.ts";
import { isOfflineError } from "./offlineError.ts";
import { formatClock, formatDayMonth } from "../i18n/format.ts";

const MINUTE_MS = 60 * 1000;
/** Data older than this is labelled "Last updated ..." even when the app is online (e.g. a restored copy still refreshing). */
export const STALE_LABEL_AFTER_MS = 10 * MINUTE_MS;

const hasData = (data: unknown): boolean => data !== undefined && data !== null;

/**
 * The full-screen error / "Retry" box is for when there is NOTHING to show. If data exists (cached or fresh) and a
 * refresh failed, the data stays on screen. (A failed refresh keeps `data` and sets `isError`, which is why screens
 * that tested `isError` alone used to hide their data.)
 */
export const shouldShowFullError = (query: { isError: boolean; data: unknown }): boolean => query.isError && !hasData(query.data);

/**
 * Several cached queries on one screen (Home shows products and crops): the banner appears if ANY of them is showing
 * a saved copy, and "last updated" is the OLDEST of the saved times, so the label never claims the screen is fresher
 * than its stalest part.
 */
export const combineOfflineStates = (
  states: { isShowingOfflineData: boolean; lastUpdatedAt: number | null }[]
): { isShowingOfflineData: boolean; lastUpdatedAt: number | null } => {
  const times = states.map((s) => s.lastUpdatedAt).filter((t): t is number => t !== null);
  return {
    isShowingOfflineData: states.some((s) => s.isShowingOfflineData),
    lastUpdatedAt: times.length > 0 ? Math.min(...times) : null,
  };
};

/** What a paged list knows about fetching its next page (the fields React Query's infinite queries expose). */
export interface PagedQueryState {
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  error: unknown;
}

/**
 * Fetch the next page when the end is reached - but not again straight after one failed (that would retry in a tight
 * loop while offline); the person taps the "Connect to the internet to load more." line, or pulls to refresh.
 */
export const shouldFetchNextPage = (q: PagedQueryState): boolean => !!q.hasNextPage && !q.isFetchingNextPage && !q.isFetchNextPageError;

/** True when the next page failed because there is no connection: the list shows a small "connect to load more" line. */
export const showLoadMoreOfflineNote = (q: PagedQueryState): boolean => q.isFetchNextPageError && isOfflineError(q.error);

/** The slim offline banner: only when the latest refresh failed for lack of connection AND saved data is on screen. */
export const shouldShowOfflineBanner = (state: { isShowingOfflineData: boolean }): boolean => state.isShowingOfflineData;

/** "Last updated" label: always for screens that ask for it, otherwise only when offline or the data is old. */
export const shouldShowLastUpdated = (input: {
  isShowingOfflineData: boolean;
  lastUpdatedAt: number | null;
  now: number;
  always?: boolean;
}): boolean => {
  if (input.lastUpdatedAt === null) return false;
  if (input.always || input.isShowingOfflineData) return true;
  return input.now - input.lastUpdatedAt > STALE_LABEL_AFTER_MS;
};

const startOfDay = (date: Date): number => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/**
 * "Last updated 3:42 PM" / "... yesterday, 3:42 PM" / "... 5 Oct, 3:42 PM" / "... just now"; null when unknown.
 * In Hindi the sentence is built the Hindi way round ("3:42 PM पर अपडेट हुआ"), so each case is a whole template.
 */
export const formatLastUpdated = (timestamp: number | null | undefined, now: number, lang: Lang = "en"): string | null => {
  if (timestamp === null || timestamp === undefined || !Number.isFinite(timestamp) || timestamp <= 0) return null;
  if (now - timestamp < MINUTE_MS) return translate(lang, "offline.lastUpdatedJustNow");

  const then = new Date(timestamp);
  const today = startOfDay(new Date(now));
  const thenDay = startOfDay(then);
  const dayMs = 24 * 60 * MINUTE_MS;
  const time = formatClock(then);
  if (thenDay === today) return translate(lang, "offline.lastUpdatedAt", { time });
  if (thenDay === today - dayMs) return translate(lang, "offline.lastUpdatedYesterday", { time });
  const sameYear = then.getFullYear() === new Date(now).getFullYear();
  const date = formatDayMonth(then.getDate(), then.getMonth(), sameYear ? null : then.getFullYear(), lang);
  return translate(lang, "offline.lastUpdatedOn", { date, time });
};

/**
 * Paying is never offered from a saved copy: the status shown offline may be out of date (the order may already be
 * paid or cancelled), and starting a payment needs the connection anyway.
 */
export const canOfferPayment = (input: { status: string | undefined; isShowingOfflineData: boolean }): boolean =>
  input.status === "PENDING_PAYMENT" && !input.isShowingOfflineData;

/** Adding to the cart is a write: not from a saved copy of a product (its price and stock may have changed). */
export const canAddToCart = (input: { isShowingOfflineData: boolean }): boolean => !input.isShowingOfflineData;

export interface OrderAddressFields {
  shippingLine1?: string | null;
  shippingLine2?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPincode?: string | null;
}

const text = (value: string | null | undefined): string => (typeof value === "string" ? value.trim() : "");

/**
 * What to show where an order's delivery address goes. The stored offline copy has every address field removed
 * (empty strings / null), and a malformed copy may have them missing altogether: all of that must render safely.
 */
export const orderAddressView = (
  order: OrderAddressFields | null | undefined,
  lang: Lang = "en"
): { kind: "address"; lines: string[] } | { kind: "online-only"; note: string } => {
  const line1 = text(order?.shippingLine1);
  const line2 = text(order?.shippingLine2);
  const cityState = [text(order?.shippingCity), text(order?.shippingState)].filter(Boolean).join(", ");
  const pincode = text(order?.shippingPincode);
  const lines = [line1, line2, [cityState, pincode].filter(Boolean).join(" - ")].filter(Boolean);
  if (line1 === "" && pincode === "") {
    return { kind: "online-only", note: translate(lang, "offline.addressOnlineOnly") };
  }
  return { kind: "address", lines };
};
