import { NEUTRAL_TONE, statusTones, type Tone } from "@/theme/colors";
import { translate, type Lang, type MessageKey } from "@/i18n";
import type { OrderStatus } from "./types";

/** What the customer reads for an order's status, and the colour it carries — one place for the list, the detail card and the title. */
const ORDER_STATUS_LABEL_KEY: Record<OrderStatus, MessageKey> = {
  PENDING_PAYMENT: "orders.status.PENDING_PAYMENT",
  CONFIRMED: "orders.status.CONFIRMED",
  SHIPPED: "orders.status.SHIPPED",
  DELIVERED: "orders.status.DELIVERED",
  PAYMENT_FAILED: "orders.status.PAYMENT_FAILED",
  REFUNDED: "orders.status.REFUNDED",
};

/** Headline on the order screen. */
const ORDER_STATUS_TITLE_KEY: Record<OrderStatus, MessageKey> = {
  PENDING_PAYMENT: "orders.title.PENDING_PAYMENT",
  CONFIRMED: "orders.title.CONFIRMED",
  SHIPPED: "orders.title.SHIPPED",
  DELIVERED: "orders.title.DELIVERED",
  PAYMENT_FAILED: "orders.title.PAYMENT_FAILED",
  REFUNDED: "orders.title.REFUNDED",
};

/**
 * An order from a build older than this one can carry a status this build has
 * never heard of (the server may add more later). Never crash on it: fall back
 * to the raw value, readable, in the neutral colour.
 */
export const orderStatusLabel = (status: string, lang: Lang = "en"): string => {
  const key = (ORDER_STATUS_LABEL_KEY as Record<string, MessageKey | undefined>)[status];
  return key ? translate(lang, key) : status.replace(/_/g, " ");
};

/** The order screen's headline; a status this build does not know reads "Order". */
export const orderStatusTitle = (status: string, lang: Lang = "en"): string => {
  const key = (ORDER_STATUS_TITLE_KEY as Record<string, MessageKey | undefined>)[status];
  return translate(lang, key ?? "orders.fallbackTitle");
};

/** The chip colours for a status: tinted background, readable text, a slightly deeper border (src/theme/colors.ts). */
export const orderStatusTone = (status: string): Tone => (statusTones as Record<string, Tone>)[status] ?? NEUTRAL_TONE;

/** The text colour of the status chip. */
export const orderStatusColor = (status: string): string => orderStatusTone(status).fg;
