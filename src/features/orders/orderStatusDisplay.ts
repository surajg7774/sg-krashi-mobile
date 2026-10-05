import { colors } from "@/theme/colors";
import type { OrderStatus } from "./types";

/** What the customer reads for an order's status, and the colour it carries — one place for the list, the detail card and the title. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pending Payment",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  PAYMENT_FAILED: "Payment Failed",
  REFUNDED: "Refunded",
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING_PAYMENT: colors.warning,
  CONFIRMED: colors.success,
  SHIPPED: colors.primary,
  DELIVERED: colors.info,
  PAYMENT_FAILED: colors.error,
  REFUNDED: colors.textSecondary,
};

/** Headline on the order screen. */
export const ORDER_STATUS_TITLE: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Order Placed",
  CONFIRMED: "Order Confirmed!",
  SHIPPED: "Order Shipped",
  DELIVERED: "Order Delivered",
  PAYMENT_FAILED: "Payment Failed",
  REFUNDED: "Order Refunded",
};

/**
 * An order from a build older than this one can carry a status this build has
 * never heard of (the server may add more later). Never crash on it: fall back
 * to the raw value, readable, in the neutral colour.
 */
export const orderStatusLabel = (status: string): string =>
  (ORDER_STATUS_LABEL as Record<string, string>)[status] ?? status.replace(/_/g, " ");

export const orderStatusColor = (status: string): string =>
  (ORDER_STATUS_COLOR as Record<string, string>)[status] ?? colors.textSecondary;
