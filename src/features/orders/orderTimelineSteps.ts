// Ported from sg-krashi-client/src/features/orders/orderTimelineSteps.ts (minus the
// admin-only actor labels — the customer API never sends who made a change).
// Keep the two in step: same states, same rule that "Shipped" is never a phantom
// upcoming step.
import { translate, type Lang, type MessageKey } from "../../i18n/index.ts";
import type { OrderStatus, OrderStatusEvent } from "./types";

export type StepState = "done" | "current" | "upcoming" | "failed" | "refunded";

export interface TimelineStep {
  key: string;
  status: OrderStatus;
  label: string;
  state: StepState;
  /** Always a real timestamp from the order's history; null for steps that have not happened yet. */
  occurredAt: string | null;
  /** Short helper text under the label, e.g. "Waiting for payment". */
  detail: string | null;
}

const STEP_LABEL_KEY: Record<OrderStatus, MessageKey> = {
  PENDING_PAYMENT: "orders.step.PENDING_PAYMENT",
  CONFIRMED: "orders.step.CONFIRMED",
  SHIPPED: "orders.step.SHIPPED",
  DELIVERED: "orders.step.DELIVERED",
  PAYMENT_FAILED: "orders.step.PAYMENT_FAILED",
  REFUNDED: "orders.step.REFUNDED",
};

/** A step's label in `lang`; a status this build does not know is shown as sent. */
export const stepLabel = (status: string, lang: Lang = "en"): string => {
  const key = (STEP_LABEL_KEY as Record<string, MessageKey | undefined>)[status];
  return key ? translate(lang, key) : status;
};

/** Statuses an order can still move on from by itself — worth re-checking in the background. */
export const isActiveOrderStatus = (status: OrderStatus): boolean =>
  status === "PENDING_PAYMENT" || status === "CONFIRMED" || status === "SHIPPED";

/**
 * Steps that can still lie ahead. "Shipped" is deliberately never listed: it is
 * optional (an admin may go straight to Delivered), so showing it as upcoming
 * would promise a step that may never happen. It appears only once it has
 * happened, and then it is the current step.
 */
const UPCOMING: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["CONFIRMED", "DELIVERED"],
  CONFIRMED: ["DELIVERED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  PAYMENT_FAILED: [],
  REFUNDED: [],
};

/**
 * Turns an order's real status history into display steps: every event that
 * happened (with its real time), the latest one marked current (or
 * failed/refunded for those terminal outcomes), then — only while the order is
 * still in progress — the greyed steps still ahead, with no time.
 */
export const buildOrderSteps = (events: OrderStatusEvent[], status: OrderStatus, lang: Lang = "en"): TimelineStep[] => {
  const steps: TimelineStep[] = events.map((event, index) => {
    const isLast = index === events.length - 1;
    let state: StepState = "done";
    if (event.status === "PAYMENT_FAILED") state = "failed";
    else if (event.status === "REFUNDED") state = "refunded";
    else if (isLast) state = "current";

    return {
      key: `${event.status}-${event.occurredAt}`,
      status: event.status,
      label: stepLabel(event.status, lang),
      state,
      occurredAt: event.occurredAt,
      detail: state === "current" && event.status === "PENDING_PAYMENT" ? translate(lang, "orders.waitingForPayment") : null,
    };
  });

  if (steps.length === 0) {
    // No history at all (should not happen): show the present status only, with no invented time.
    steps.push({
      key: `${status}-none`,
      status,
      label: stepLabel(status, lang),
      state: status === "PAYMENT_FAILED" ? "failed" : status === "REFUNDED" ? "refunded" : "current",
      occurredAt: null,
      detail: null,
    });
  }

  // A status this build does not know (a newer server) has nothing queued after it.
  for (const ahead of UPCOMING[status] ?? []) {
    steps.push({
      key: `${ahead}-upcoming`,
      status: ahead,
      label: stepLabel(ahead, lang),
      state: "upcoming",
      occurredAt: null,
      detail: null,
    });
  }

  return steps;
};
