import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  STALE_LABEL_AFTER_MS,
  canOfferPayment,
  combineOfflineStates,
  shouldFetchNextPage,
  showLoadMoreOfflineNote,
  formatLastUpdated,
  orderAddressView,
  shouldShowFullError,
  shouldShowLastUpdated,
  shouldShowOfflineBanner,
} from "../src/offline/screenState.ts";
import { describeOfflineData } from "../src/offline/offlineError.ts";
import { translate } from "../src/i18n/index.ts";
import { roundCoordinate } from "../src/features/weather/coordinates.ts";
import { stripOrderAddress } from "../src/offline/sanitize.ts";

// ---- the "show the error only when there is nothing to show" decision ----
test("full-screen error only when the query failed AND there is no data", () => {
  assert.equal(shouldShowFullError({ isError: true, data: undefined }), true);
  assert.equal(shouldShowFullError({ isError: true, data: null }), true);
  assert.equal(shouldShowFullError({ isError: true, data: { pages: [] } }), false, "cached data present: keep it");
  assert.equal(shouldShowFullError({ isError: true, data: 0 }), false, "falsy but real data (0, empty array, empty string)");
  assert.equal(shouldShowFullError({ isError: true, data: [] }), false);
  assert.equal(shouldShowFullError({ isError: false, data: undefined }), false, "still loading, not an error");
  assert.equal(shouldShowFullError({ isError: false, data: { a: 1 } }), false);
});

// ---- banner visibility ----
const offlineWithData = describeOfflineData({ data: { a: 1 }, dataUpdatedAt: 1000, isError: true, error: { code: "NETWORK_ERROR" } });

test("the offline banner shows only for an offline failure with data on screen", () => {
  assert.equal(shouldShowOfflineBanner(offlineWithData), true);
  // fresh data, online: no banner (nothing flashes)
  assert.equal(shouldShowOfflineBanner(describeOfflineData({ data: { a: 1 }, dataUpdatedAt: 1000, isError: false, error: null })), false);
  // a server error with data: data stays, but it is not an offline situation
  assert.equal(shouldShowOfflineBanner(describeOfflineData({ data: { a: 1 }, dataUpdatedAt: 1000, isError: true, error: { status: 500 } })), false);
  // offline with nothing to show: the full error box handles it, not the banner
  assert.equal(shouldShowOfflineBanner(describeOfflineData({ data: undefined, dataUpdatedAt: 0, isError: true, error: { code: "NETWORK_ERROR" } })), false);
  // still loading
  assert.equal(shouldShowOfflineBanner(describeOfflineData({ data: undefined, dataUpdatedAt: 0, isError: false, error: null })), false);
});

test("banner and full error are never both shown, and cached data is never hidden by either", () => {
  const cases = [
    { data: { a: 1 }, isError: true, error: { code: "NETWORK_ERROR" } },
    { data: undefined, isError: true, error: { code: "NETWORK_ERROR" } },
    { data: { a: 1 }, isError: true, error: { status: 500 } },
    { data: { a: 1 }, isError: false, error: null },
  ];
  for (const c of cases) {
    const banner = shouldShowOfflineBanner(describeOfflineData({ ...c, dataUpdatedAt: 5 }));
    const fullError = shouldShowFullError(c);
    assert.ok(!(banner && fullError), JSON.stringify(c));
    if (c.data !== undefined) assert.equal(fullError, false, "data present -> never the full-screen error");
  }
});

// ---- Last updated ----
const at = (y: number, mo: number, d: number, h: number, mi: number) => new Date(y, mo, d, h, mi, 0).getTime();

test("LastUpdated formatting: just now, today, yesterday, older, other year", () => {
  const now = at(2026, 9, 7, 16, 30);
  assert.equal(formatLastUpdated(now - 20_000, now), "Last updated just now");
  assert.equal(formatLastUpdated(at(2026, 9, 7, 15, 42), now), "Last updated 3:42 PM");
  assert.equal(formatLastUpdated(at(2026, 9, 7, 0, 5), now), "Last updated 12:05 AM");
  assert.equal(formatLastUpdated(at(2026, 9, 7, 12, 0), now), "Last updated 12:00 PM");
  assert.equal(formatLastUpdated(at(2026, 9, 6, 21, 9), now), "Last updated yesterday, 9:09 PM");
  assert.equal(formatLastUpdated(at(2026, 9, 1, 8, 0), now), "Last updated 1 Oct, 8:00 AM");
  assert.equal(formatLastUpdated(at(2025, 11, 25, 18, 30), now), "Last updated 25 Dec 2025, 6:30 PM");
});

test("LastUpdated: unknown or invalid timestamps give no label, and a clock slightly ahead is 'just now'", () => {
  const now = at(2026, 9, 7, 16, 30);
  for (const bad of [null, undefined, 0, -5, NaN]) assert.equal(formatLastUpdated(bad as number, now), null);
  assert.equal(formatLastUpdated(now + 5_000, now), "Last updated just now");
});

test("LastUpdated visibility: always for weather, otherwise only offline or when the data is old", () => {
  const now = 10_000_000;
  const fresh = { lastUpdatedAt: now - 30_000, now, isShowingOfflineData: false };
  assert.equal(shouldShowLastUpdated(fresh), false, "fresh data, online: nothing extra on screen");
  assert.equal(shouldShowLastUpdated({ ...fresh, always: true }), true, "weather");
  assert.equal(shouldShowLastUpdated({ ...fresh, isShowingOfflineData: true }), true);
  assert.equal(shouldShowLastUpdated({ ...fresh, lastUpdatedAt: now - STALE_LABEL_AFTER_MS - 1 }), true, "old restored copy still refreshing");
  assert.equal(shouldShowLastUpdated({ ...fresh, lastUpdatedAt: null, always: true }), false);
});

// ---- order detail offline ----
const order = {
  id: 7, orderNumber: "SK-7", status: "PENDING_PAYMENT", totalAmount: 120, items: [], statusHistory: [], createdAt: "2026-10-01T00:00:00Z",
  shippingLine1: "12 Secret Lane", shippingLine2: "Grove", shippingCity: "Indore", shippingState: "MP", shippingPincode: "452001",
};

test("an order with its address shows it; the stripped offline copy says 'Address shown when online'", () => {
  assert.deepEqual(orderAddressView(order), { kind: "address", lines: ["12 Secret Lane", "Grove", "Indore, MP - 452001"] });
  const stripped = stripOrderAddress(order) as typeof order;
  assert.deepEqual(orderAddressView(stripped), { kind: "online-only", note: "Address shown when online" });
});

test("null, missing and blank address fields never crash and never show 'null' or 'undefined'", () => {
  for (const o of [
    { shippingLine1: null, shippingLine2: null, shippingCity: null, shippingState: null, shippingPincode: null },
    { shippingLine1: "", shippingLine2: null, shippingCity: "", shippingState: "", shippingPincode: "" },
    {}, null, undefined, { shippingLine1: "   ", shippingPincode: " " },
  ]) {
    const view = orderAddressView(o as never);
    assert.equal(view.kind, "online-only", JSON.stringify(o));
    assert.equal(JSON.stringify(view).includes("null"), false);
    assert.equal(JSON.stringify(view).includes("undefined"), false);
  }
  // partial real data still renders without junk
  const partial = orderAddressView({ shippingLine1: "Plot 4", shippingLine2: null, shippingCity: "Dewas", shippingState: null, shippingPincode: null });
  assert.deepEqual(partial, { kind: "address", lines: ["Plot 4", "Dewas"] });
});

test("payment is never offered from a saved copy of an order", () => {
  assert.equal(canOfferPayment({ status: "PENDING_PAYMENT", isShowingOfflineData: false }), true);
  assert.equal(canOfferPayment({ status: "PENDING_PAYMENT", isShowingOfflineData: true }), false);
  assert.equal(canOfferPayment({ status: "CONFIRMED", isShowingOfflineData: false }), false);
  assert.equal(canOfferPayment({ status: undefined, isShowingOfflineData: false }), false);
});

// ---- weather key ----
test("GPS fixes a few metres apart resolve to the same weather cache key", () => {
  assert.equal(roundCoordinate(22.719568), roundCoordinate(22.7203));
  assert.equal(roundCoordinate(75.857727), 75.86);
  assert.notEqual(roundCoordinate(22.72), roundCoordinate(22.74));
});

// ---- wiring: every wired screen decides the full-screen error with the shared function, never `isError` alone ----
const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

const SCREENS: Array<[string, RegExp]> = [
  ["../src/features/weather/WeatherScreen.tsx", /shouldShowFullError\(weatherQuery\)/],
  ["../src/features/orders/OrderHistoryScreen.tsx", /shouldShowFullError\(ordersQuery\)/],
  ["../src/features/orders/OrderConfirmationScreen.tsx", /shouldShowFullError\(orderQuery\)/],
  ["../src/features/crop-marketplace/CropMarketplaceScreen.tsx", /shouldShowFullError\(listingsQuery\)/],
  ["../src/features/crop-marketplace/CropListingDetailScreen.tsx", /shouldShowFullError\(detailQuery\)/],
  ["../src/features/store/StoreScreen.tsx", /shouldShowFullError\(productsQuery\)/],
  ["../src/features/store/ProductDetailScreen.tsx", /shouldShowFullError\(productQuery\)/],
];

for (const [path, decision] of SCREENS) {
  test(`${path.split("/").pop()}: error box decided by shouldShowFullError, banner and helper wired`, () => {
    const source = read(path);
    assert.match(source, decision);
    assert.match(source, /OfflineBanner visible=\{shouldShowOfflineBanner\(offline\)\}/);
    assert.match(source, /useOfflineData\(/);
    // no ErrorState is guarded by a bare isError any more
    assert.doesNotMatch(source, /\b\w+Query\.isError\s*&&\s*(<ErrorState|\()/);
    assert.doesNotMatch(source, /if \((?:orders|order|detail|product)Query\.isError\)/);
  });
}

test("weather uses the 'Last updated' label always; order statuses from a saved copy carry the 'may be out of date' cue", () => {
  assert.match(read("../src/features/weather/WeatherScreen.tsx"), /<LastUpdated[^>]*\balways\b/);
  // On the list the cue sits on every row, beside the (dashed) status chip ...
  const history = read("../src/features/orders/OrderHistoryScreen.tsx");
  assert.match(history, /\{stale && <StaleOrderCue align="right" \/>\}/);
  assert.match(history, /stale=\{offline\.isShowingOfflineData\}/);
  assert.match(history, /statusChipStale: \{ borderStyle: "dashed" \}/);
  // ... and on the order screen directly under the status badge.
  assert.match(read("../src/features/orders/OrderConfirmationScreen.tsx"), /\{offline\.isShowingOfflineData && <StaleOrderCue \/>\}/);
  // The cue says it with the existing wording.
  assert.match(read("../src/components/StaleOrderCue.tsx"), /t\("offline\.orderMayBeOutOfDate"\)/);
});

test("the order screen offers payment only through canOfferPayment", () => {
  const source = read("../src/features/orders/OrderConfirmationScreen.tsx");
  assert.match(source, /canOfferPayment\(\{ status: order\.status, isShowingOfflineData: offline\.isShowingOfflineData \}\)/);
  assert.match(source, /\{offerPayment && !paymentSubmitted && \(/);
});

test("in Hindi, 'Last updated' reads the Hindi way round and the address note is Hindi; English above is unchanged", () => {
  const now = at(2026, 9, 7, 16, 30);
  assert.equal(formatLastUpdated(now - 20_000, now, "hi"), "अभी-अभी अपडेट हुआ");
  assert.equal(formatLastUpdated(at(2026, 9, 7, 15, 42), now, "hi"), "3:42 PM पर अपडेट हुआ");
  assert.equal(formatLastUpdated(at(2026, 9, 6, 21, 9), now, "hi"), "कल 9:09 PM पर अपडेट हुआ");
  assert.equal(formatLastUpdated(at(2026, 9, 1, 8, 0), now, "hi"), "1 अक्टूबर, 8:00 AM पर अपडेट हुआ");
  assert.equal(formatLastUpdated(at(2025, 11, 25, 18, 30), now, "hi"), "25 दिसंबर 2025, 6:30 PM पर अपडेट हुआ");
  assert.equal(formatLastUpdated(null, now, "hi"), null);
  assert.deepEqual(orderAddressView({ shippingLine1: "", shippingPincode: "" }, "hi"), { kind: "online-only", note: "पता ऑनलाइन होने पर दिखेगा" });
});

// ---- Home: two cached sections, one banner ---------------------------------------------------------------------

test("two saved sections on one screen: banner if either is a saved copy, 'last updated' is the older time", () => {
  assert.deepEqual(combineOfflineStates([{ isShowingOfflineData: true, lastUpdatedAt: 5000 }, { isShowingOfflineData: false, lastUpdatedAt: 9000 }]), {
    isShowingOfflineData: true,
    lastUpdatedAt: 5000,
  });
  assert.deepEqual(combineOfflineStates([{ isShowingOfflineData: false, lastUpdatedAt: 7000 }, { isShowingOfflineData: false, lastUpdatedAt: 3000 }]), {
    isShowingOfflineData: false,
    lastUpdatedAt: 3000,
  });
  assert.deepEqual(combineOfflineStates([{ isShowingOfflineData: false, lastUpdatedAt: null }, { isShowingOfflineData: true, lastUpdatedAt: 4000 }]), {
    isShowingOfflineData: true,
    lastUpdatedAt: 4000,
  });
  assert.deepEqual(combineOfflineStates([]), { isShowingOfflineData: false, lastUpdatedAt: null });
});

test("Home shows an error box only for a section that has nothing to show, and one banner for both", () => {
  const home = read("../src/features/home/HomeScreen.tsx");
  assert.match(home, /shouldShowFullError\(productsQuery\)/);
  assert.match(home, /shouldShowFullError\(cropsQuery\)/);
  assert.doesNotMatch(home, /(products|crops)Query\.isError\s*&&/);
  assert.match(home, /combineOfflineStates\(\[useOfflineData\(productsQuery\), useOfflineData\(cropsQuery\)\]\)/);
  assert.match(home, /<OfflineBanner\s+visible=\{shouldShowOfflineBanner\(offline\)\}/);
});

// ---- "load more" while offline ----------------------------------------------------------------------------------

const paged = (over: Partial<Parameters<typeof shouldFetchNextPage>[0]> = {}) => ({
  hasNextPage: true,
  isFetchingNextPage: false,
  isFetchNextPageError: false,
  error: null as unknown,
  ...over,
});

test("the next page is fetched at the end of the list, but not while loading, with no more pages, or straight after a failure", () => {
  assert.equal(shouldFetchNextPage(paged()), true);
  assert.equal(shouldFetchNextPage(paged({ hasNextPage: false })), false);
  assert.equal(shouldFetchNextPage(paged({ hasNextPage: undefined })), false);
  assert.equal(shouldFetchNextPage(paged({ isFetchingNextPage: true })), false);
  assert.equal(shouldFetchNextPage(paged({ isFetchNextPageError: true, error: { code: "NETWORK_ERROR" } })), false);
});

test("'Connect to the internet to load more.' shows only when the next page failed for lack of connection", () => {
  assert.equal(showLoadMoreOfflineNote(paged({ isFetchNextPageError: true, error: { code: "NETWORK_ERROR" } })), true);
  assert.equal(showLoadMoreOfflineNote(paged({ isFetchNextPageError: true, error: { code: "SERVER_ERROR", status: 500 } })), false);
  assert.equal(showLoadMoreOfflineNote(paged({ isFetchNextPageError: false, error: { code: "NETWORK_ERROR" } })), false);
  assert.equal(showLoadMoreOfflineNote(paged()), false);
});

test("every paged list uses the shared footer and the guarded end-reached decision", () => {
  const lists: [string, string][] = [
    ["../src/features/store/StoreScreen.tsx", "productsQuery"],
    ["../src/features/crop-marketplace/CropMarketplaceScreen.tsx", "listingsQuery"],
    ["../src/features/orders/OrderHistoryScreen.tsx", "ordersQuery"],
    ["../src/features/notifications/NotificationCenterScreen.tsx", "notificationsQuery"],
    ["../src/features/farmer/FarmerListingsScreen.tsx", "listingsQuery"],
    ["../src/features/farmer/FarmerPayoutsScreen.tsx", "payoutsQuery"],
    ["../src/features/mandi/MandiScreen.tsx", "pricesQuery"],
  ];
  for (const [path, q] of lists) {
    const source = read(path);
    assert.ok(source.includes(`shouldFetchNextPage(${q})`), path);
    assert.ok(source.includes(`<LoadMoreFooter query={${q}} />`), path);
    assert.doesNotMatch(source, new RegExp(`${q}\.hasNextPage && !${q}\.isFetchingNextPage`), `${path} still has the unguarded check`);
  }
  assert.match(read("../src/features/crop-marketplace/CropReviews.tsx"), /showLoadMoreOfflineNote\(query\)/);
});

test("the load-more line is a translated, tappable note in both languages", () => {
  assert.equal(translate("en", "offline.loadMoreNeedsInternet"), "Connect to the internet to load more.");
  assert.match(translate("hi", "offline.loadMoreNeedsInternet"), /[ऀ-ॿ]/);
  const footer = read("../src/components/LoadMoreFooter.tsx");
  assert.match(footer, /t\("offline\.loadMoreNeedsInternet"\)/);
  assert.match(footer, /accessibilityRole="button"/);
});
