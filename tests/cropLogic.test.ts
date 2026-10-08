/// <reference types="node" />
// Run with: npm test   (Node's built-in test runner; needs Node 22.18 or newer for TypeScript files)
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EMPTY_FILTERS,
  MAX_ORDER_QUANTITY,
  activeFilterCount,
  canMarkSoldOut,
  clampQuantity,
  farmerListingStatus,
  filtersAreValid,
  formatDay,
  formatInstantIndia,
  formatRupees,
  fromIsoDay,
  harvestLabel,
  isSoldOut,
  listingAccessibilityLabel,
  maxQuantity,
  starsText,
  toIsoDay,
  todayIndia,
  toListingQuery,
  trimName,
  validateFilters,
  type CropFilters,
} from "../src/features/crop-marketplace/cropLogic.ts";

const filters = (over: Partial<CropFilters> = {}): CropFilters => ({ ...EMPTY_FILTERS, ...over });

test("names lose stray spaces at the ends but keep emoji and inner spacing", () => {
  assert.equal(trimName("Green chilli "), "Green chilli");
  assert.equal(trimName("  Wheat 🌾  "), "Wheat 🌾");
  assert.equal(trimName("Tomato 🍅"), "Tomato 🍅");
  assert.equal(trimName("Onion  Batch - MP"), "Onion  Batch - MP");
  assert.equal(trimName(null), "");
  assert.equal(trimName(undefined), "");
});

test("sold out means no stock left", () => {
  assert.equal(isSoldOut(0), true);
  assert.equal(isSoldOut(-2), true);
  assert.equal(isSoldOut(1), false);
  assert.equal(isSoldOut(Number.NaN), true);
});

test("the quantity cap is the lesser of the stock and 10", () => {
  assert.equal(MAX_ORDER_QUANTITY, 10);
  assert.equal(maxQuantity(250), 10);
  assert.equal(maxQuantity(11), 10);
  assert.equal(maxQuantity(10), 10);
  assert.equal(maxQuantity(7), 7);
  assert.equal(maxQuantity(1), 1);
  assert.equal(maxQuantity(0), 0);
  assert.equal(maxQuantity(-4), 0);
  assert.equal(maxQuantity(Number.NaN), 0);
});

test("a stepper value is kept between 1 and the cap, and is 0 when sold out", () => {
  assert.equal(clampQuantity(0, 5), 1);
  assert.equal(clampQuantity(99, 5), 5);
  assert.equal(clampQuantity(3, 250), 3);
  assert.equal(clampQuantity(40, 250), 10);
  assert.equal(clampQuantity(3, 0), 0);
  assert.equal(clampQuantity(2.7, 5), 2);
  assert.equal(clampQuantity(Number.NaN, 5), 1);
});

test("prices are shown as rupees only, with Indian grouping and no invented unit", () => {
  assert.equal(formatRupees(51), "₹51");
  assert.equal(formatRupees(0), "₹0");
  assert.equal(formatRupees(999), "₹999");
  assert.equal(formatRupees(1000), "₹1,000");
  assert.equal(formatRupees(1500), "₹1,500");
  assert.equal(formatRupees(150000), "₹1,50,000");
  assert.equal(formatRupees(1234567), "₹12,34,567");
  assert.equal(formatRupees(12.5), "₹12.50");
  assert.equal(formatRupees(51.0), "₹51");
  assert.equal(formatRupees(Number.NaN), "");
  assert.ok(!/kg|quintal|per/i.test(formatRupees(51)));
});

test("days read as written, with no time-zone shift", () => {
  assert.equal(formatDay("2026-10-05"), "5 Oct 2026");
  assert.equal(formatDay("2026-01-31T23:59:59Z"), "31 Jan 2026");
  assert.equal(formatDay("nonsense"), "");
  assert.equal(formatDay(""), "");
});

test("a server timestamp becomes the India day, even with microseconds", () => {
  assert.equal(formatInstantIndia("2026-09-27T07:02:15.658976Z"), "27 Sep 2026");
  assert.equal(formatInstantIndia("2026-10-05T19:00:00Z"), "6 Oct 2026"); // 00:30 in India
  assert.equal(formatInstantIndia("2026-10-05T18:29:59Z"), "5 Oct 2026");
  assert.equal(formatInstantIndia("garbage"), "");
});

test("'today' is the India date", () => {
  assert.equal(todayIndia(new Date("2026-10-05T20:00:00Z")), "2026-10-06");
  assert.equal(todayIndia(new Date("2026-10-05T18:29:00Z")), "2026-10-05");
});

test("harvest label: future dates say Harvest, today and past say Harvested", () => {
  assert.deepEqual(harvestLabel("2026-10-12", "2026-10-06"), { text: "Harvest: 12 Oct 2026", upcoming: true });
  assert.deepEqual(harvestLabel("2026-10-06", "2026-10-06"), { text: "Harvested: 6 Oct 2026", upcoming: false });
  assert.deepEqual(harvestLabel("2026-09-25", "2026-10-06"), { text: "Harvested: 25 Sep 2026", upcoming: false });
  assert.deepEqual(harvestLabel("", "2026-10-06"), { text: "", upcoming: false });
});

test("empty filter boxes are valid", () => {
  assert.deepEqual(validateFilters(EMPTY_FILTERS), {});
  assert.equal(filtersAreValid(EMPTY_FILTERS), true);
});

test("prices must be numbers, at most two decimals, and the lowest cannot exceed the highest", () => {
  assert.equal(validateFilters(filters({ minPrice: "abc" })).price, "invalid");
  assert.equal(validateFilters(filters({ maxPrice: "-5" })).price, "invalid");
  assert.equal(validateFilters(filters({ minPrice: "20.555" })).price, "invalid");
  assert.equal(validateFilters(filters({ minPrice: "20", maxPrice: "10" })).price, "order");
  assert.equal(validateFilters(filters({ minPrice: "20", maxPrice: "20" })).price, undefined);
  assert.equal(validateFilters(filters({ minPrice: " 20 ", maxPrice: "30.50" })).price, undefined);
  assert.equal(validateFilters(filters({ maxPrice: "30" })).price, undefined);
});

test("harvest dates must be real days and the start cannot be after the end", () => {
  assert.equal(validateFilters(filters({ harvestFrom: "2026-02-30" })).harvest, "invalid");
  assert.equal(validateFilters(filters({ harvestFrom: "05/10/2026" })).harvest, "invalid");
  assert.equal(validateFilters(filters({ harvestFrom: "2026-10-05", harvestTo: "2026-09-01" })).harvest, "order");
  assert.equal(validateFilters(filters({ harvestFrom: "2026-09-01", harvestTo: "2026-10-05" })).harvest, undefined);
  assert.equal(validateFilters(filters({ harvestTo: "2026-10-05" })).harvest, undefined);
  assert.equal(filtersAreValid(filters({ minPrice: "x" })), false);
});

test("the Filters badge counts switched-on groups", () => {
  assert.equal(activeFilterCount(EMPTY_FILTERS), 0);
  assert.equal(activeFilterCount(filters({ cropType: "grains" })), 1);
  assert.equal(activeFilterCount(filters({ cropType: "grains", organicOnly: true })), 2);
  assert.equal(activeFilterCount(filters({ minPrice: "10", maxPrice: "20" })), 1);
  assert.equal(activeFilterCount(filters({ cropType: "grains", organicOnly: true, minPrice: "10", harvestTo: "2026-10-05" })), 4);
  assert.equal(activeFilterCount(filters({ minPrice: "  " })), 0);
});

test("the list query sends only valid, switched-on filters and never empty strings", () => {
  assert.deepEqual(toListingQuery("", EMPTY_FILTERS, 0, 12), { page: 0, size: 12 });
  assert.deepEqual(toListingQuery("  tomato ", EMPTY_FILTERS, 2, 12), { page: 2, size: 12, search: "tomato" });
  assert.deepEqual(
    toListingQuery("", filters({ cropType: "grains", organicOnly: true, minPrice: "10", maxPrice: "50.5", harvestFrom: "2026-09-01", harvestTo: "2026-09-30" }), 0, 12),
    { page: 0, size: 12, cropType: "grains", organicOnly: true, minPrice: 10, maxPrice: 50.5, harvestDateFrom: "2026-09-01", harvestDateTo: "2026-09-30" }
  );
  // organic switched off is not sent at all
  assert.equal("organicOnly" in toListingQuery("", filters({ organicOnly: false }), 0, 12), false);
  // an invalid price is left out, but a valid harvest range still goes
  assert.deepEqual(toListingQuery("", filters({ minPrice: "20", maxPrice: "10", harvestFrom: "2026-09-01" }), 0, 12), { page: 0, size: 12, harvestDateFrom: "2026-09-01" });
});

test("star text for ratings", () => {
  assert.equal(starsText(5), "★★★★★");
  assert.equal(starsText(4.4), "★★★★☆");
  assert.equal(starsText(4.5), "★★★★★");
  assert.equal(starsText(0), "☆☆☆☆☆");
  assert.equal(starsText(9), "★★★★★");
});

test("a screen reader hears name, price, category, organic, availability and harvest", () => {
  const base = { name: "Green chilli ", unitPrice: 51, quantityAvailable: 250, isOrganicCertified: true, categoryName: "Vegetables", harvestDate: "2020-09-25" };
  assert.equal(listingAccessibilityLabel(base), "Green chilli, ₹51, Vegetables, Organic certified, Available, Harvested: 25 Sep 2020");
  assert.equal(
    listingAccessibilityLabel({ ...base, quantityAvailable: 0, isOrganicCertified: false, categoryName: null }),
    "Green chilli, ₹51, Sold out, Harvested: 25 Sep 2020"
  );
});

// The {{name}} fill() helper is gone: the crop text moved into src/i18n, whose {name} interpolation is tested in
// tests/i18n.test.ts. These check the same functions in Hindi; the English checks above are unchanged.
test("in Hindi, days use Hindi month names and the harvest and screen-reader labels are Hindi", () => {
  assert.equal(formatDay("2026-10-05", "hi"), "5 अक्टूबर 2026");
  assert.equal(formatInstantIndia("2026-10-05T19:00:00Z", "hi"), "6 अक्टूबर 2026");
  assert.deepEqual(harvestLabel("2026-10-12", "2026-10-06", "hi"), { text: "कटाई: 12 अक्टूबर 2026", upcoming: true });
  assert.deepEqual(harvestLabel("2026-09-25", "2026-10-06", "hi"), { text: "कटाई हुई: 25 सितंबर 2026", upcoming: false });
  const base = { name: "Green chilli ", unitPrice: 51, quantityAvailable: 250, isOrganicCertified: true, categoryName: "Vegetables", harvestDate: "2020-09-25" };
  // Server data (name, category) stays as sent; only the app's own words change.
  assert.equal(listingAccessibilityLabel(base, "hi"), "Green chilli, ₹51, Vegetables, जैविक प्रमाणित, उपलब्ध, कटाई हुई: 25 सितंबर 2020");
  assert.equal(
    listingAccessibilityLabel({ ...base, quantityAvailable: 0, isOrganicCertified: false, categoryName: null }, "hi"),
    "Green chilli, ₹51, स्टॉक समाप्त, कटाई हुई: 25 सितंबर 2020"
  );
});

test("the date picker's Date and the typed yyyy-mm-dd day convert both ways", () => {
  assert.equal(toIsoDay(new Date(2026, 9, 5)), "2026-10-05");
  assert.equal(toIsoDay(new Date(2026, 0, 31)), "2026-01-31");
  const back = fromIsoDay("2026-10-05");
  assert.deepEqual([back.getFullYear(), back.getMonth(), back.getDate()], [2026, 9, 5]);
  const fallback = new Date(2000, 0, 1);
  assert.equal(fromIsoDay("", fallback), fallback);
  assert.equal(fromIsoDay("nonsense", fallback), fallback);
  assert.equal(fromIsoDay("2026-02-30", fallback), fallback); // not a real day
});

test("a farmer's listing is inactive, sold out or active", () => {
  assert.equal(farmerListingStatus({ isActive: true, quantityAvailable: 120 }), "active");
  assert.equal(farmerListingStatus({ isActive: true, quantityAvailable: 0 }), "soldOut");
  assert.equal(farmerListingStatus({ isActive: false, quantityAvailable: 120 }), "inactive");
  assert.equal(farmerListingStatus({ isActive: false, quantityAvailable: 0 }), "inactive"); // deactivated wins
});

test("Mark sold out is offered only for an active listing that still has stock", () => {
  assert.equal(canMarkSoldOut(true, 5), true);
  assert.equal(canMarkSoldOut(true, 0), false);
  assert.equal(canMarkSoldOut(true, null), false);
  assert.equal(canMarkSoldOut(false, 5), false);
});
