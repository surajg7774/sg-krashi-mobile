import assert from "node:assert/strict";
import { test } from "node:test";
import { CACHE_RULES, DAY_MS, HOUR_MS, ruleFor } from "../src/offline/cacheConfig.ts";
import { ORDER_ADDRESS_FIELDS, isAddressRedacted, stripOrderAddress } from "../src/offline/sanitize.ts";
import { isOfflineError, describeOfflineData } from "../src/offline/offlineError.ts";
import { PUBLIC_CACHE_KEY, userCacheKey, isPrivateCacheKey } from "../src/offline/scoping.ts";

test("max ages: weather 6 h, orders 7 days, public lists 24 h", () => {
  assert.equal(ruleFor(["weather-current", 22.7, 75.8])?.maxAgeMs, 6 * HOUR_MS);
  assert.equal(ruleFor(["orders", "my"])?.maxAgeMs, 7 * DAY_MS);
  assert.equal(ruleFor(["order", 12])?.maxAgeMs, 7 * DAY_MS);
  for (const key of [
    ["crop-listings", "home"], ["crop-listings", "browse", "", {}], ["crop-categories"], ["crop-listing-detail", "green-chilli"],
    ["products", "home"], ["products", "store", undefined, 3], ["product-categories"], ["product-detail", 7],
  ]) {
    assert.equal(ruleFor(key)?.maxAgeMs, DAY_MS, JSON.stringify(key));
  }
});

test("scopes: orders are private, weather and public lists are public", () => {
  assert.equal(ruleFor(["orders", "my"])?.scope, "private");
  assert.equal(ruleFor(["order", 5])?.scope, "private");
  assert.equal(ruleFor(["weather-current", 1, 2])?.scope, "public");
  assert.equal(ruleFor(["crop-listings", "home"])?.scope, "public");
  assert.equal(ruleFor(["products", "home"])?.scope, "public");
});

test("everything not on the allow-list is never persisted", () => {
  const never: unknown[][] = [
    ["mandi-prices", "Wheat", "MP"], ["mandi-meta"], ["mandi-filters", undefined], ["mandi-trend", "Wheat", undefined],
    ["recommendations", "for-you"], ["recommendations", "similar", "CROP_LISTING", 4],
    ["notifications-unread-count"], ["crop-doctor-history"], ["crop-doctor-scan-detail", 3], ["crop-doctor-supported-crops"],
    ["farmer-payouts"], ["farmer-listings"], ["farmer-dashboard-summary"], ["account-sign-in-methods"],
    ["weather-geocode", "indore"], ["crop-reviews", 3], ["chat", 1], ["payment", 1], ["checkout"], ["cart"], ["tokens"], ["otp"],
    ["orders"], ["order"], ["order", "abc"], ["orders", "my", 2],
  ];
  for (const key of never) {
    assert.equal(ruleFor(key), undefined, JSON.stringify(key));
  }
});

test("typed search text is never persisted (only the empty-search list)", () => {
  assert.equal(ruleFor(["crop-listings", "browse", "wheat", {}]), undefined);
  assert.equal(ruleFor(["products", "store", "seeds", 2]), undefined);
  assert.ok(ruleFor(["crop-listings", "browse", "", {}]));
  assert.ok(ruleFor(["products", "store", undefined, undefined]));
});

test("a rule exists for every default key and ids are unique", () => {
  assert.equal(new Set(CACHE_RULES.map((rule) => rule.id)).size, CACHE_RULES.length);
  for (const rule of CACHE_RULES) assert.ok(rule.defaultsKey.length > 0 && rule.maxEntries > 0 && rule.maxAgeMs > 0, rule.id);
});

// ---- address stripping ----
const order = {
  id: 7, orderNumber: "SK-7", status: "CONFIRMED", totalAmount: 120,
  shippingLine1: "12 Secret Lane", shippingLine2: "Behind the Grove", shippingCity: "Indore", shippingState: "MP", shippingPincode: "452001",
  items: [{ id: 1, itemName: "Seeds" }], statusHistory: [], createdAt: "2026-10-01T00:00:00Z",
};

test("the stored copy of an order has all five delivery-address fields removed and nothing else changed", () => {
  assert.deepEqual([...ORDER_ADDRESS_FIELDS], ["shippingLine1", "shippingLine2", "shippingCity", "shippingState", "shippingPincode"]);
  const stripped = stripOrderAddress(order) as typeof order;
  assert.equal(stripped.shippingLine1, "");
  assert.equal(stripped.shippingLine2, null);
  assert.equal(stripped.shippingCity, "");
  assert.equal(stripped.shippingState, "");
  assert.equal(stripped.shippingPincode, "");
  assert.equal(JSON.stringify(stripped).includes("Secret"), false);
  assert.equal(JSON.stringify(stripped).includes("452001"), false);
  assert.equal(stripped.orderNumber, "SK-7");
  assert.deepEqual(stripped.items, order.items);
  assert.equal(order.shippingLine1, "12 Secret Lane", "the original object is not mutated");
  assert.equal(isAddressRedacted(stripped), true);
  assert.equal(isAddressRedacted(order), false);
});

test("the order-detail rule applies the stripping, the order list has no address to strip", () => {
  const rule = ruleFor(["order", 7]);
  assert.equal(JSON.stringify(rule?.sanitize?.(order)).includes("Secret"), false);
  assert.equal(stripOrderAddress(null), null);
  assert.deepEqual(stripOrderAddress([1, 2]), [1, 2]);
});

// ---- offline detection ----
test("isOfflineError is true only for NETWORK_ERROR", () => {
  assert.equal(isOfflineError({ code: "NETWORK_ERROR", message: "Network Error", details: [] }), true);
  for (const e of [{ status: 500 }, { status: 401, code: "UNAUTHENTICATED" }, { code: "VALIDATION_ERROR" }, null, undefined, "NETWORK_ERROR", 42, new Error("x")]) {
    assert.equal(isOfflineError(e), false, JSON.stringify(e));
  }
});

test("describeOfflineData: cached data kept after an offline refresh failure", () => {
  const offline = describeOfflineData({ data: { a: 1 }, dataUpdatedAt: 1000, isError: true, error: { code: "NETWORK_ERROR" } });
  assert.deepEqual(offline, { isShowingOfflineData: true, lastUpdatedAt: 1000 });
  assert.equal(describeOfflineData({ data: { a: 1 }, dataUpdatedAt: 1000, isError: true, error: { status: 500 } }).isShowingOfflineData, false);
  assert.equal(describeOfflineData({ data: undefined, dataUpdatedAt: 0, isError: true, error: { code: "NETWORK_ERROR" } }).isShowingOfflineData, false);
  assert.deepEqual(describeOfflineData({ data: undefined, dataUpdatedAt: 0, isError: false, error: null }), { isShowingOfflineData: false, lastUpdatedAt: null });
});

// ---- scoping keys ----
test("storage keys: one shared public key, one private key per user id", () => {
  assert.notEqual(userCacheKey(1), userCacheKey(2));
  assert.notEqual(userCacheKey(1), PUBLIC_CACHE_KEY);
  assert.ok(isPrivateCacheKey(userCacheKey(5)));
  assert.ok(!isPrivateCacheKey(PUBLIC_CACHE_KEY));
  assert.ok(!isPrivateCacheKey("sgkrashi.weatherLocation"));
  assert.ok(!isPrivateCacheKey("sgkrashi.hasSeenOnboarding"));
});
