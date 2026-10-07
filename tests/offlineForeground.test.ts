import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { queriesToRefetchOnForeground, refetchOfflineErrors, type ForegroundQueryLike } from "../src/offline/foregroundRefetch.ts";
import { canAddToCart } from "../src/offline/screenState.ts";
import { OFFLINE_STRINGS } from "../src/offline/strings.ts";

const offlineErr = { code: "NETWORK_ERROR" };
const q = (queryKey: unknown[], state: ForegroundQueryLike["state"], observers = 1): ForegroundQueryLike => ({
  queryKey, state, getObserversCount: () => observers,
});

test("only whitelisted queries that failed offline, are on screen and not already refetching are refreshed", () => {
  const picked = queriesToRefetchOnForeground([
    q(["weather-current", 22.7, 75.8], { status: "error", error: offlineErr, fetchStatus: "idle" }),
    q(["orders", "my"], { status: "error", error: offlineErr, fetchStatus: "idle" }),
    q(["order", 7], { status: "error", error: offlineErr, fetchStatus: "fetching" }), // already refetching
    q(["products", "home"], { status: "error", error: { status: 500 }, fetchStatus: "idle" }), // server error, not offline
    q(["crop-listings", "home"], { status: "success", fetchStatus: "idle" }), // healthy
    q(["mandi-prices", "Wheat"], { status: "error", error: offlineErr, fetchStatus: "idle" }), // not whitelisted
    q(["recommendations", "for-you"], { status: "error", error: offlineErr, fetchStatus: "idle" }), // not whitelisted
    q(["product-detail", 3], { status: "error", error: offlineErr, fetchStatus: "idle" }, 0), // nobody is looking at it
  ]);
  assert.deepEqual(picked, [["weather-current", 22.7, 75.8], ["orders", "my"]]);
});

test("nothing to do when everything is healthy", () => {
  assert.deepEqual(queriesToRefetchOnForeground([q(["orders", "my"], { status: "success" })]), []);
  assert.deepEqual(queriesToRefetchOnForeground([]), []);
});

test("refetchOfflineErrors refetches each picked query once, exact and active only, and never throws", async () => {
  const calls: unknown[] = [];
  const client = {
    getQueryCache: () => ({ getAll: () => [q(["orders", "my"], { status: "error", error: offlineErr, fetchStatus: "idle" })] }),
    refetchQueries: async (filters: unknown) => { calls.push(filters); },
  };
  assert.equal(await refetchOfflineErrors(client), 1);
  assert.deepEqual(calls, [{ queryKey: ["orders", "my"], exact: true, type: "active" }]);

  const failing = { getQueryCache: () => { throw new Error("boom"); }, refetchQueries: async () => undefined };
  assert.equal(await refetchOfflineErrors(failing), 0);
  const rejecting = { ...client, refetchQueries: async () => { throw new Error("still offline"); } };
  assert.equal(await refetchOfflineErrors(rejecting), 1, "a failed refetch is swallowed");
});

test("add to cart is disabled while a saved copy is on screen, with the wording asked for", () => {
  assert.equal(canAddToCart({ isShowingOfflineData: true }), false);
  assert.equal(canAddToCart({ isShowingOfflineData: false }), true);
  assert.equal(OFFLINE_STRINGS.addToCartNeedsInternet, "Connect to the internet to add to cart");
});

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\/\/.*$/gm, "");

test("wiring: both detail screens gate their add button, and the foreground refetch is the only AppState 'active' action", () => {
  for (const path of ["../src/features/store/ProductDetailScreen.tsx", "../src/features/crop-marketplace/CropListingDetailScreen.tsx"]) {
    const source = read(path);
    assert.match(source, /const cartAllowed = canAddToCart\(offline\)/);
    assert.match(source, /disabled=\{[^}]*!cartAllowed\}/);
    assert.match(source, /OFFLINE_STRINGS\.addToCartNeedsInternet/);
  }
  const provider = read("../src/offline/OfflineCacheProvider.tsx");
  assert.match(provider, /void refetchOfflineErrors\(queryClient\)/);
  assert.doesNotMatch(provider, /setInterval|NetInfo/);
});
