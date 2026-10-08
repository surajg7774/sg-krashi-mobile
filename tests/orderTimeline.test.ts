import assert from "node:assert/strict";
import { test } from "node:test";
import { buildOrderSteps, stepLabel } from "../src/features/orders/orderTimelineSteps.ts";
import { formatDateTime } from "../src/i18n/format.ts";

const at = (status: string, occurredAt: string) => ({ status, occurredAt }) as never;

test("English step labels and the waiting note read exactly as before", () => {
  const steps = buildOrderSteps([at("PENDING_PAYMENT", "2026-10-05T10:00:00Z")], "PENDING_PAYMENT");
  assert.deepEqual(
    steps.map((s) => [s.label, s.state, s.detail]),
    [
      ["Order placed", "current", "Waiting for payment"],
      ["Payment confirmed", "upcoming", null],
      ["Delivered", "upcoming", null],
    ]
  );
  assert.equal(stepLabel("PAYMENT_FAILED"), "Payment failed");
  assert.equal(stepLabel("REFUNDED"), "Refunded");
});

test("in Hindi the same steps carry Hindi labels; states, order and times are unchanged", () => {
  const events = [at("PENDING_PAYMENT", "2026-10-05T10:00:00Z"), at("CONFIRMED", "2026-10-05T10:05:00Z")];
  const english = buildOrderSteps(events, "CONFIRMED");
  const hindi = buildOrderSteps(events, "CONFIRMED", "hi");
  assert.deepEqual(
    hindi.map((s) => [s.key, s.state, s.occurredAt]),
    english.map((s) => [s.key, s.state, s.occurredAt])
  );
  assert.deepEqual(
    hindi.map((s) => s.label),
    ["ऑर्डर किया गया", "भुगतान की पुष्टि हुई", "डिलीवर हुआ"]
  );
  const waiting = buildOrderSteps([at("PENDING_PAYMENT", "2026-10-05T10:00:00Z")], "PENDING_PAYMENT", "hi");
  assert.equal(waiting[0].detail, "भुगतान का इंतज़ार");
});

test("a status this build has never heard of is shown as sent, in either language, and nothing is queued after it", () => {
  const steps = buildOrderSteps([at("ON_HOLD", "2026-10-05T10:00:00Z")], "ON_HOLD" as never, "hi");
  assert.equal(steps.length, 1);
  assert.equal(steps[0].label, "ON_HOLD");
  assert.equal(stepLabel("ON_HOLD", "hi"), "ON_HOLD");
});

test("order times: English is the engine's own toLocaleString (unchanged); Hindi spells the month in Hindi", () => {
  const date = new Date(2026, 9, 8, 15, 42);
  assert.equal(formatDateTime(date), date.toLocaleString());
  assert.equal(formatDateTime(date, "hi"), "8 अक्टूबर 2026, 3:42 PM");
});
