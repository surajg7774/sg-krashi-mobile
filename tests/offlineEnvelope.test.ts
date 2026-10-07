import assert from "node:assert/strict";
import { test } from "node:test";
import { DAY_MS, HOUR_MS } from "../src/offline/cacheConfig.ts";
import { ENVELOPE_VERSION, buildEnvelope, parseEnvelope, type StoredEntry } from "../src/offline/envelope.ts";
import { PRIVATE_CACHE_MAX_BYTES, PUBLIC_CACHE_MAX_BYTES, evictEntries, utf8Length } from "../src/offline/eviction.ts";

const NOW = 1_800_000_000_000;

const weather = (updated: number, lat = 22.7): StoredEntry => ({ k: ["weather-current", lat, 75.8], d: { temperatureCelsius: 30 }, u: updated, r: "weather-current" });
const orderDetail = (id: number, updated: number, data: unknown = { id, shippingLine1: "Secret Lane" }): StoredEntry => ({ k: ["order", id], d: data, u: updated, r: "order-detail" });
const orderList = (updated: number): StoredEntry => ({ k: ["orders", "my"], d: { pages: [] }, u: updated, r: "orders-list" });

test("a fresh envelope round-trips", () => {
  const raw = buildEnvelope("public", null, [weather(NOW - HOUR_MS)], NOW);
  const entries = parseEnvelope(raw, { now: NOW, scope: "public" });
  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0].k, ["weather-current", 22.7, 75.8]);
});

test("version mismatch, corrupt JSON and garbage are dropped silently, never thrown", () => {
  const good = JSON.parse(buildEnvelope("public", null, [weather(NOW - 1000)], NOW));
  assert.deepEqual(parseEnvelope(JSON.stringify({ ...good, v: ENVELOPE_VERSION + 1 }), { now: NOW, scope: "public" }), []);
  assert.deepEqual(parseEnvelope(JSON.stringify({ ...good, v: undefined }), { now: NOW, scope: "public" }), []);
  for (const raw of ["{not json", "", "null", "[]", "42", '"str"', '{"v":1}', '{"v":1,"entries":"x"}', null, undefined]) {
    assert.doesNotThrow(() => parseEnvelope(raw as string, { now: NOW, scope: "public" }));
    assert.deepEqual(parseEnvelope(raw as string, { now: NOW, scope: "public" }), [], String(raw));
  }
});

test("entries older than their rule's max age are dropped; younger ones kept", () => {
  const raw = buildEnvelope("public", null, [weather(NOW - 5 * HOUR_MS, 1), weather(NOW - 7 * HOUR_MS, 2)], NOW);
  const entries = parseEnvelope(raw, { now: NOW, scope: "public" });
  assert.deepEqual(entries.map((e) => e.k[1]), [1]);

  const priv = buildEnvelope("private", 9, [orderList(NOW - 6 * DAY_MS), orderDetail(1, NOW - 8 * DAY_MS)], NOW);
  assert.deepEqual(parseEnvelope(priv, { now: NOW, scope: "private", userId: 9 }).map((e) => e.r), ["orders-list"]);
});

test("an entry stamped in the future (wrong clock) is not trusted", () => {
  const raw = buildEnvelope("public", null, [weather(NOW + 60 * 60 * 1000)], NOW);
  assert.deepEqual(parseEnvelope(raw, { now: NOW, scope: "public" }), []);
});

test("entries with no rule, a mismatched rule id or the wrong scope are dropped (never mis-read)", () => {
  const bad: StoredEntry[] = [
    { k: ["mandi-prices", "Wheat"], d: { x: 1 }, u: NOW - 1000, r: "weather-current" },
    { k: ["weather-current", 1, 2], d: { x: 1 }, u: NOW - 1000, r: "order-detail" },
    { k: ["orders", "my"], d: { x: 1 }, u: NOW - 1000, r: "orders-list" }, // private entry inside a public envelope
    { k: ["weather-current", 1, 2], d: null, u: NOW - 1000, r: "weather-current" },
  ];
  assert.deepEqual(parseEnvelope(buildEnvelope("public", null, bad, NOW), { now: NOW, scope: "public" }), []);
});

test("a private envelope is only accepted for its own user and scope", () => {
  const raw = buildEnvelope("private", 5, [orderList(NOW - 1000)], NOW);
  assert.equal(parseEnvelope(raw, { now: NOW, scope: "private", userId: 5 }).length, 1);
  assert.deepEqual(parseEnvelope(raw, { now: NOW, scope: "private", userId: 6 }), [], "another user");
  assert.deepEqual(parseEnvelope(raw, { now: NOW, scope: "private", userId: null }), [], "nobody signed in");
  assert.deepEqual(parseEnvelope(raw, { now: NOW, scope: "private" }), [], "no user given");
  assert.deepEqual(parseEnvelope(raw, { now: NOW, scope: "public" }), [], "read as public");
  const publicRaw = buildEnvelope("public", null, [weather(NOW - 1000)], NOW);
  assert.deepEqual(parseEnvelope(publicRaw, { now: NOW, scope: "private", userId: 5 }), []);
});

test("an order read back is stripped of its address again, even if an old file still had it", () => {
  const raw = buildEnvelope("private", 5, [orderDetail(3, NOW - 1000, { id: 3, shippingLine1: "Secret Lane", shippingPincode: "452001" })], NOW);
  const [entry] = parseEnvelope(raw, { now: NOW, scope: "private", userId: 5 });
  assert.equal(JSON.stringify(entry.d).includes("Secret"), false);
  assert.equal(JSON.stringify(entry.d).includes("452001"), false);
});

// ---- eviction ----
test("per-rule entry limit keeps the newest", () => {
  const entries = Array.from({ length: 40 }, (_, i) => orderDetail(i + 1, NOW - i * 1000, { id: i + 1 }));
  const kept = evictEntries(entries, PRIVATE_CACHE_MAX_BYTES);
  assert.equal(kept.length, 30);
  assert.deepEqual(kept.map((e) => e.k[1]).slice(0, 3), [1, 2, 3]);
  assert.ok(!kept.some((e) => e.k[1] === 40));
});

test("the byte cap drops the oldest entries first and the result always fits", () => {
  const blob = "x".repeat(40_000);
  const entries = Array.from({ length: 20 }, (_, i) => orderDetail(i + 1, NOW - i * 1000, { id: i + 1, blob }));
  const kept = evictEntries(entries, PRIVATE_CACHE_MAX_BYTES);
  const total = utf8Length(JSON.stringify(kept));
  assert.ok(total <= PRIVATE_CACHE_MAX_BYTES, `stored ${total}`);
  assert.ok(kept.length > 0 && kept.length < 20);
  const keptIds = kept.map((e) => e.k[1] as number);
  assert.deepEqual(keptIds, [...keptIds].sort((a, b) => a - b), "newest (lowest id here) kept");
  assert.ok(keptIds.includes(1), "the newest entry survives");
  assert.ok(!keptIds.includes(20), "the oldest is the first to go");
});

test("a single entry bigger than the whole budget is never stored", () => {
  const huge = orderDetail(1, NOW, { blob: "y".repeat(PRIVATE_CACHE_MAX_BYTES + 10) });
  assert.deepEqual(evictEntries([huge], PRIVATE_CACHE_MAX_BYTES), []);
});

test("the two budgets add up to the 1.5 MB total", () => {
  assert.equal(PUBLIC_CACHE_MAX_BYTES + PRIVATE_CACHE_MAX_BYTES, 1_500_000);
});

test("utf8Length counts bytes, not characters", () => {
  assert.equal(utf8Length("abc"), 3);
  assert.equal(utf8Length("गेहूं"), 15);
  assert.equal(utf8Length("\u{1F600}"), 4);
});
