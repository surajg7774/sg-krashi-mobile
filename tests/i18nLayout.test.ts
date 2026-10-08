import assert from "node:assert/strict";
import { test } from "node:test";
import { en } from "../src/i18n/en.ts";
import { hi } from "../src/i18n/hi.ts";
import { DEVANAGARI_LINE_HEIGHT_RATIO, contentLineHeight, scriptLineHeight } from "../src/i18n/layout.ts";

// ---- line height ----------------------------------------------------------------------------------------------

test("English line heights are never changed; Hindi gets room for vowel signs (at least 1.6x the font size)", () => {
  assert.equal(scriptLineHeight("en", 14, 20), 20);
  assert.equal(scriptLineHeight("en", 12, 18), 18);
  assert.equal(scriptLineHeight("hi", 14, 20), Math.ceil(14 * DEVANAGARI_LINE_HEIGHT_RATIO));
  assert.equal(scriptLineHeight("hi", 15, 22), 24);
  // Already roomy enough: left alone.
  assert.equal(scriptLineHeight("hi", 10, 30), 30);
});

test("server/AI text gets the extra room only when it actually contains Devanagari", () => {
  assert.equal(contentLineHeight("Remove infected leaves", 13, 19), 19);
  assert.equal(contentLineHeight("संक्रमित पत्तियां हटा दें", 13, 19), 21);
  assert.equal(contentLineHeight("Spray नीम oil", 13, 19), 21);
  assert.equal(contentLineHeight("", 13, 19), 19);
});

// ---- short slots ----------------------------------------------------------------------------------------------

// A rough on-screen width in "Latin letter" units: a Devanagari cluster (letter + its signs) is about 1.6 Latin
// letters wide at the same size, anything else about 1. Good enough to catch a label that would clearly not fit.
const segmenter = new Intl.Segmenter("hi", { granularity: "grapheme" });
const width = (text: string): number =>
  [...segmenter.segment(text)].reduce((sum, { segment }) => sum + (/[ऀ-ॿ]/.test(segment) ? 1.6 : 1), 0);

const get = (dict: unknown, key: string): string => {
  const value = key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], dict);
  assert.equal(typeof value, "string", `not a plain string: ${key}`);
  return value as string;
};

// Slots with a known small width, and the widest text that comfortably fits each one.
const SHORT_SLOTS: { keys: string[]; max: number; where: string }[] = [
  { keys: ["home", "store", "cropDoctor", "weather", "farmer", "profile"].map((k) => `nav.tabs.${k}`), max: 12, where: "bottom tab label (single line, 10sp, 5-6 tabs)" },
  { keys: ["common.new", "store.outOfStockBadge", "crops.detail.soldOut", "crops.detail.organic"], max: 12, where: "badge on a product/crop image" },
  { keys: ["orders.currentChip"], max: 8, where: "the timeline's current-step chip" },
  { keys: ["offline.retry"], max: 10, where: "the offline banner's retry button" },
  { keys: ["language.english", "language.hindi"], max: 8, where: "language switch pill" },
  {
    keys: ["PENDING_PAYMENT", "CONFIRMED", "SHIPPED", "DELIVERED", "PAYMENT_FAILED", "REFUNDED"].map((s) => `orders.status.${s}`),
    max: 15,
    where: "order status chip",
  },
  {
    keys: [
      "crops.farmer.active",
      "crops.farmer.inactive",
      "crops.farmer.soldOut",
      "farmer.payouts.status.BATCHED",
      "farmer.payouts.status.APPROVED",
      "farmer.payouts.status.PAID",
      "cropDoctor.health.HEALTHY",
      "cropDoctor.health.DISEASED",
      "cropDoctor.health.UNCERTAIN",
    ],
    max: 15,
    where: "status badge beside a row",
  },
];

test("labels in small fixed slots stay short enough in both languages", () => {
  for (const slot of SHORT_SLOTS) {
    for (const key of slot.keys) {
      for (const [lang, dict] of [["en", en], ["hi", hi]] as const) {
        const text = get(dict, key);
        assert.ok(width(text) <= slot.max, `${lang} ${key} "${text}" is too wide for the ${slot.where} (${width(text).toFixed(1)} > ${slot.max})`);
      }
    }
  }
});

// Texts with placeholders, measured with a realistic filled-in value (the longest the screen is likely to show).
test("labels with a filled-in value stay short enough for their slot in both languages", () => {
  const fill = (text: string, values: Record<string, string>): string => text.replace(/\{(\w+)\}/g, (_m, name: string) => values[name] ?? "");
  const slots: { key: string; values: Record<string, string>; max: number; where: string }[] = [
    { key: "farmer.payouts.net", values: { amount: "123456.78" }, max: 26, where: "payout row amount (beside the status badge)" },
    { key: "farmer.payouts.approvedAt", values: { date: "28 सितंबर 2026, 12:00 PM" }, max: 60, where: "payout detail meta line (full width, 12sp)" },
    { key: "farmer.payouts.paidAt", values: { date: "28 सितंबर 2026, 12:00 PM" }, max: 60, where: "payout detail meta line (full width, 12sp)" },
    { key: "weather.tonightLow", values: {}, max: 32, where: "weather stat box label (half width, may wrap to two lines)" },
    { key: "mandi.lastSynced", values: { date: "28 सितंबर 2026" }, max: 50, where: "mandi sync line" },
  ];
  for (const slot of slots) {
    for (const [lang, dict] of [["en", en], ["hi", hi]] as const) {
      const text = fill(get(dict, slot.key), slot.values);
      assert.ok(width(text) <= slot.max, `${lang} ${slot.key} "${text}" is too wide for the ${slot.where} (${width(text).toFixed(1)} > ${slot.max})`);
    }
  }
});
