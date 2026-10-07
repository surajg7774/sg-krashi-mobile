import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { CACHE_RULES } from "../src/offline/cacheConfig.ts";
import { CACHED_REQUEST_TIMEOUT_MS, applyCachedQueryDefaults, cachedQueryRetry, timeoutForRequest } from "../src/offline/queryPolicy.ts";

test("a timeout is applied only to the GET endpoints behind cached screens", () => {
  for (const url of ["/orders/my", "/orders/12", "/weather/current", "/crop-listings", "/crop-listings/green-chilli", "/crop-categories", "/products", "/products/7", "/product-categories", "/orders/my?page=0&size=10"]) {
    assert.equal(timeoutForRequest("get", url), CACHED_REQUEST_TIMEOUT_MS, url);
  }
});

test("no timeout for writes or for anything that is not cached (payments, auth, chat, AI, uploads, mandi...)", () => {
  assert.equal(timeoutForRequest("post", "/orders"), undefined, "checkout");
  assert.equal(timeoutForRequest("post", "/orders/12/pay"), undefined);
  assert.equal(timeoutForRequest("get", "/orders/12/payment"), undefined);
  for (const url of ["/auth/mobile/login", "/auth/mobile/refresh", "/payments/razorpay/order", "/ai/crop-doctor/analyze", "/chat/sessions", "/mandi/prices", "/notifications/my", "/cart", "/weather/geocode", "/recommendations/for-you", "/customers/me"]) {
    assert.equal(timeoutForRequest("get", url), undefined, url);
    assert.equal(timeoutForRequest("post", url), undefined, url);
  }
  assert.equal(timeoutForRequest("delete", "/orders/12"), undefined);
  assert.equal(timeoutForRequest(undefined, undefined), undefined);
});

test("retries: none when offline, none for client errors, one otherwise", () => {
  assert.equal(cachedQueryRetry(0, { code: "NETWORK_ERROR" }), false);
  assert.equal(cachedQueryRetry(0, { status: 404 }), false);
  assert.equal(cachedQueryRetry(0, { status: 401 }), false);
  assert.equal(cachedQueryRetry(0, { status: 500 }), true);
  assert.equal(cachedQueryRetry(1, { status: 500 }), false);
  assert.equal(cachedQueryRetry(0, new Error("boom")), true);
});

test("the retry default is registered for every cached query family, and only for them", () => {
  const registered: unknown[][] = [];
  applyCachedQueryDefaults({ setQueryDefaults: (key, options) => { registered.push([...key]); assert.equal(options.retry, cachedQueryRetry); } });
  assert.deepEqual(registered.map((k) => k[0]).sort(), CACHE_RULES.map((r) => r.defaultsKey[0]).sort());
  for (const never of ["mandi-prices", "recommendations", "crop-doctor-history", "notifications-unread-count", "farmer-payouts"]) {
    assert.ok(!registered.some((k) => k[0] === never), never);
  }
});

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\/\/.*$/gm, "");

test("wiring: the timeout is applied per request (no global axios timeout), defaults are applied to the app's client", () => {
  const client = read("../src/api/client.ts");
  assert.doesNotMatch(client, /axios\.create\(\{[^}]*timeout/s);
  assert.match(client, /timeoutForRequest\(config\.method, config\.url\)/);
  assert.match(read("../src/shared/queryClient.ts"), /applyCachedQueryDefaults\(queryClient\)/);
});

test("wiring: logout passes the offline cache to the cleanup, and the app root restores with a capped wait", () => {
  assert.match(read("../src/context/AuthContext.tsx"), /clearLocalUserData\(\{ queryClient, storage: AsyncStorage, offlineCache \}\)/);
  const provider = read("../src/offline/OfflineCacheProvider.tsx");
  assert.match(provider, /RESTORE_CAP_MS = 1000/);
  assert.match(provider, /restorePublic\(\)\s*\.catch\(\(\) => 0\)/);
  assert.match(read("../App.tsx"), /<OfflineCacheProvider>\s*<RootNavigator \/>\s*<\/OfflineCacheProvider>/);
});

test("android auto-backup is switched off in app.json (takes effect in the next native build)", () => {
  const app = JSON.parse(readFileSync(new URL("../app.json", import.meta.url), "utf8"));
  assert.equal(app.expo.android.allowBackup, false);
});
