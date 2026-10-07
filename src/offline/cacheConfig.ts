// What may be kept on the phone for offline reading, for how long, and under which scope.
// A query is persisted ONLY if one of these rules matches its key (an allow-list): everything else - tokens,
// payment/checkout/cart state, OTP/Razorpay, chat, AI and Crop Doctor results, notifications, farmer screens,
// recommendations, mandi, geocoding searches, and every mutation - is never written to storage.
//
// Pure (no React Native / React Query imports) so it can be unit-tested with Node (tests/offlineCacheConfig.test.ts).
import { stripOrderAddress } from "./sanitize.ts";

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

export type CacheScope = "public" | "private";
export type QueryKeyLike = readonly unknown[];

export interface CacheRule {
  id: string;
  /** "private" data is stored per user id and removed when that user's session ends. */
  scope: CacheScope;
  maxAgeMs: number;
  /** Newest N entries kept for this rule (e.g. one entry per order id). */
  maxEntries: number;
  /** True only for keys that are allowed to be persisted. */
  matches: (key: QueryKeyLike) => boolean;
  /** Applied to the data before it is written (and again when it is read back). */
  sanitize?: (data: unknown) => unknown;
  /** Query-key prefix used for per-query defaults (fewer retries / fail fast offline). */
  defaultsKey: QueryKeyLike;
}

const isNumberLike = (value: unknown): boolean =>
  (typeof value === "number" && Number.isFinite(value)) || (typeof value === "string" && /^\d+$/.test(value));
const isIdLike = (value: unknown): boolean => isNumberLike(value) || (typeof value === "string" && value.length > 0 && value.length <= 120);
/** A search box that is empty: typed search text is never persisted. */
const noSearchText = (value: unknown): boolean => value === undefined || value === null || value === "";

export const CACHE_RULES: readonly CacheRule[] = [
  // ---- public data: shared by everyone using the phone, kept across logout ----
  {
    id: "weather-current",
    scope: "public",
    maxAgeMs: 6 * HOUR_MS,
    maxEntries: 5,
    matches: (k) => k.length === 3 && k[0] === "weather-current" && typeof k[1] === "number" && typeof k[2] === "number",
    defaultsKey: ["weather-current"],
  },
  {
    id: "crop-listings",
    scope: "public",
    maxAgeMs: DAY_MS,
    maxEntries: 6,
    matches: (k) => k[0] === "crop-listings" && (k[1] === "home" || (k[1] === "browse" && noSearchText(k[2]))),
    defaultsKey: ["crop-listings"],
  },
  {
    id: "crop-categories",
    scope: "public",
    maxAgeMs: DAY_MS,
    maxEntries: 1,
    matches: (k) => k.length === 1 && k[0] === "crop-categories",
    defaultsKey: ["crop-categories"],
  },
  {
    id: "crop-listing-detail",
    scope: "public",
    maxAgeMs: DAY_MS,
    maxEntries: 20,
    matches: (k) => k.length === 2 && k[0] === "crop-listing-detail" && isIdLike(k[1]),
    defaultsKey: ["crop-listing-detail"],
  },
  {
    id: "products",
    scope: "public",
    maxAgeMs: DAY_MS,
    maxEntries: 6,
    matches: (k) => k[0] === "products" && (k[1] === "home" || (k[1] === "store" && noSearchText(k[2]))),
    defaultsKey: ["products"],
  },
  {
    id: "product-categories",
    scope: "public",
    maxAgeMs: DAY_MS,
    maxEntries: 1,
    matches: (k) => k.length === 1 && k[0] === "product-categories",
    defaultsKey: ["product-categories"],
  },
  {
    id: "product-detail",
    scope: "public",
    maxAgeMs: DAY_MS,
    maxEntries: 20,
    matches: (k) => k.length === 2 && k[0] === "product-detail" && isIdLike(k[1]),
    defaultsKey: ["product-detail"],
  },
  // ---- private data: stored under the signed-in user's id, removed on logout / deletion / forced logout ----
  {
    id: "orders-list",
    scope: "private",
    maxAgeMs: 7 * DAY_MS,
    maxEntries: 1,
    matches: (k) => k.length === 2 && k[0] === "orders" && k[1] === "my",
    defaultsKey: ["orders"],
  },
  {
    id: "order-detail",
    scope: "private",
    maxAgeMs: 7 * DAY_MS,
    maxEntries: 30,
    matches: (k) => k.length === 2 && k[0] === "order" && isNumberLike(k[1]),
    // The delivery address is personal: it is removed from the stored copy of an order.
    sanitize: stripOrderAddress,
    defaultsKey: ["order"],
  },
];

/** The rule that allows this key to be persisted, or undefined (= never persisted). */
export const ruleFor = (key: QueryKeyLike): CacheRule | undefined => CACHE_RULES.find((rule) => rule.matches(key));

export const ruleById = (id: string): CacheRule | undefined => CACHE_RULES.find((rule) => rule.id === id);
