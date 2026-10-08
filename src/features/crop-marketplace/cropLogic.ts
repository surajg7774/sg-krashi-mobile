// The small rules behind the Crop Marketplace screens: how a name, price or date reads, which filters are valid,
// and how many a buyer can add. Imports only the pure i18n core, so it is unit-tested with Node
// (tests/cropLogic.test.ts). Text functions take the language last and default to English (docs/I18N_DECISIONS.md, D13).
import { translate, type Lang } from "../../i18n/index.ts";
import { monthName } from "../../i18n/format.ts";

/** The most a buyer can pick on the detail screen, like the website. The cart can go up to the stock. */
export const MAX_ORDER_QUANTITY = 10;

/**
 * A name as the person should read it. The server keeps names exactly as typed ("Green chilli "), so stray
 * spaces at either end are removed. Emoji and everything else in the name are kept.
 */
export const trimName = (name: string | null | undefined): string => (typeof name === "string" ? name.trim() : "");

export const isSoldOut = (quantityAvailable: number): boolean => !(quantityAvailable > 0);

/** The lesser of the stock and 10 (never below 0). */
export const maxQuantity = (quantityAvailable: number): number =>
  quantityAvailable > 0 ? Math.min(Math.floor(quantityAvailable), MAX_ORDER_QUANTITY) : 0;

/** Keeps a stepper value inside 1..maxQuantity (0 when sold out). */
export const clampQuantity = (quantity: number, quantityAvailable: number): number => {
  const max = maxQuantity(quantityAvailable);
  if (max === 0) return 0;
  return Math.min(max, Math.max(1, Math.floor(quantity) || 1));
};

/** Rupees with Indian digit grouping; only the rupee amount, no unit (the server has no unit field). 1500 -> ₹1,500, 12.5 -> ₹12.50. */
export const formatRupees = (amount: number): string => {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "";
  const fixed = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  const [whole, fraction] = fixed.split(".");
  const negative = whole.startsWith("-");
  const digits = negative ? whole.slice(1) : whole;
  const grouped = digits.length > 3 ? `${digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${digits.slice(-3)}` : digits;
  return `${negative ? "-" : ""}₹${grouped}${fraction ? `.${fraction}` : ""}`;
};

/** "2026-10-05" -> "5 Oct 2026" ("5 अक्टूबर 2026" in Hindi). Reads the calendar day as written; no time-zone conversion. */
export const formatDay = (isoDate: string, lang: Lang = "en"): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate ?? "");
  if (!match) return "";
  return `${Number(match[3])} ${monthName(Number(match[2]) - 1, lang)} ${match[1]}`;
};

/** A server timestamp (UTC) as the India calendar day it happened on. */
export const formatInstantIndia = (instant: string, lang: Lang = "en"): string => {
  // The server writes microseconds ("...15.658976Z"); not every JavaScript engine reads more than milliseconds.
  const ms = Date.parse(String(instant).replace(/(\.\d{3})\d+/, "$1"));
  if (Number.isNaN(ms)) return "";
  return formatDay(new Date(ms + 330 * 60_000).toISOString().slice(0, 10), lang);
};

/** Today in India as yyyy-mm-dd. */
export const todayIndia = (now: Date = new Date()): string => new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);

/** "Harvest: 12 Oct 2026" for a future date, "Harvested: 5 Oct 2026" otherwise. `today` is a yyyy-mm-dd day. */
export const harvestLabel = (
  harvestDate: string,
  today: string = todayIndia(),
  lang: Lang = "en"
): { text: string; upcoming: boolean } => {
  const day = formatDay(harvestDate, lang);
  if (!day) return { text: "", upcoming: false };
  const upcoming = harvestDate.slice(0, 10) > today;
  return { text: translate(lang, upcoming ? "crops.harvest.upcoming" : "crops.harvest.past", { date: day }), upcoming };
};

/** A Date as a local yyyy-mm-dd day (what the date picker returns). */
export const toIsoDay = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** A yyyy-mm-dd day as a local Date at midnight; today if the text is not a real day. */
export const fromIsoDay = (value: string, fallback: Date = new Date()): Date => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return fallback;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getMonth() === Number(match[2]) - 1 ? date : fallback;
};

// ---- the farmer's own listings -----------------------------------------------------------------------------

export type FarmerListingStatus = "inactive" | "soldOut" | "active";

/** What a farmer's own listing is doing: deactivated, active but out of stock, or on sale. */
export const farmerListingStatus = (listing: { isActive: boolean; quantityAvailable: number }): FarmerListingStatus =>
  !listing.isActive ? "inactive" : isSoldOut(listing.quantityAvailable) ? "soldOut" : "active";

/** "Mark sold out" only makes sense for an active listing that still has stock. */
export const canMarkSoldOut = (isActive: boolean, quantityAvailable: number | null): boolean =>
  isActive && quantityAvailable !== null && quantityAvailable > 0;

// ---- filters ---------------------------------------------------------------------------------------------

export interface CropFilters {
  /** Category slug, or undefined for all. */
  cropType: string | undefined;
  organicOnly: boolean;
  /** What the person typed; validated by {@link validateFilters}. */
  minPrice: string;
  maxPrice: string;
  harvestFrom: string;
  harvestTo: string;
}

export const EMPTY_FILTERS: CropFilters = { cropType: undefined, organicOnly: false, minPrice: "", maxPrice: "", harvestFrom: "", harvestTo: "" };

const PRICE = /^\d+(\.\d{1,2})?$/;

const isRealDay = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

export interface FilterErrors {
  price?: "invalid" | "order";
  harvest?: "invalid" | "order";
}

/** What is wrong with the typed filters, if anything. Empty boxes are fine. */
export const validateFilters = (f: CropFilters): FilterErrors => {
  const errors: FilterErrors = {};
  const min = f.minPrice.trim();
  const max = f.maxPrice.trim();
  if ((min && !PRICE.test(min)) || (max && !PRICE.test(max))) errors.price = "invalid";
  else if (min && max && Number(min) > Number(max)) errors.price = "order";
  const from = f.harvestFrom.trim();
  const to = f.harvestTo.trim();
  if ((from && !isRealDay(from)) || (to && !isRealDay(to))) errors.harvest = "invalid";
  else if (from && to && from > to) errors.harvest = "order";
  return errors;
};

export const filtersAreValid = (f: CropFilters): boolean => Object.keys(validateFilters(f)).length === 0;

/** How many filters are switched on (the crop-type chips count as one). Used for the badge on the Filters button. */
export const activeFilterCount = (f: CropFilters): number =>
  (f.cropType ? 1 : 0) + (f.organicOnly ? 1 : 0) + (f.minPrice.trim() || f.maxPrice.trim() ? 1 : 0) + (f.harvestFrom.trim() || f.harvestTo.trim() ? 1 : 0);

export interface CropListingQuery {
  cropType?: string;
  minPrice?: number;
  maxPrice?: number;
  organicOnly?: boolean;
  harvestDateFrom?: string;
  harvestDateTo?: string;
  search?: string;
  page: number;
  size: number;
}

/** The query for GET /crop-listings. Only valid, switched-on filters are sent; nothing is sent as an empty string. */
export const toListingQuery = (search: string, f: CropFilters, page: number, size: number): CropListingQuery => {
  const errors = validateFilters(f);
  const query: CropListingQuery = { page, size };
  const text = search.trim();
  if (text) query.search = text;
  if (f.cropType) query.cropType = f.cropType;
  if (f.organicOnly) query.organicOnly = true;
  if (!errors.price) {
    if (f.minPrice.trim()) query.minPrice = Number(f.minPrice.trim());
    if (f.maxPrice.trim()) query.maxPrice = Number(f.maxPrice.trim());
  }
  if (!errors.harvest) {
    if (f.harvestFrom.trim()) query.harvestDateFrom = f.harvestFrom.trim();
    if (f.harvestTo.trim()) query.harvestDateTo = f.harvestTo.trim();
  }
  return query;
};

// ---- small display helpers ---------------------------------------------------------------------------------

/** "★★★★☆" for a 1-5 rating. */
export const starsText = (rating: number): string => {
  const whole = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(whole) + "☆".repeat(5 - whole);
};

/** What a screen reader says for a listing card. */
export const listingAccessibilityLabel = (
  listing: {
    name: string;
    unitPrice: number;
    quantityAvailable: number;
    isOrganicCertified: boolean;
    categoryName?: string | null;
    harvestDate: string;
  },
  lang: Lang = "en"
): string => {
  const parts = [trimName(listing.name), formatRupees(listing.unitPrice)];
  if (listing.categoryName) parts.push(listing.categoryName);
  if (listing.isOrganicCertified) parts.push(translate(lang, "crops.a11y.organicCertified"));
  parts.push(translate(lang, isSoldOut(listing.quantityAvailable) ? "crops.a11y.soldOut" : "crops.a11y.available"));
  const harvest = harvestLabel(listing.harvestDate, undefined, lang).text;
  if (harvest) parts.push(harvest);
  return parts.join(", ");
};

