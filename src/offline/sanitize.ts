// Fields removed from data before it is written to the phone's storage.

/**
 * The delivery address on an order (Order in features/orders/types.ts). All five are removed from the stored
 * copy; strings become "" and the optional second line becomes null, so the restored object still has the
 * shape the TypeScript types promise. Nothing in the current app renders them; if a screen ever does, it can use
 * isAddressRedacted() to say "address shown when online".
 */
export const ORDER_ADDRESS_FIELDS = [
  "shippingLine1",
  "shippingLine2",
  "shippingCity",
  "shippingState",
  "shippingPincode",
] as const;

export const stripOrderAddress = (data: unknown): unknown => {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return data;
  }
  const copy: Record<string, unknown> = { ...(data as Record<string, unknown>) };
  for (const field of ORDER_ADDRESS_FIELDS) {
    if (field in copy) {
      copy[field] = field === "shippingLine2" ? null : "";
    }
  }
  return copy;
};

/** True when an order has had its delivery address removed (i.e. it came from the offline copy). */
export const isAddressRedacted = (order: { shippingLine1?: unknown; shippingPincode?: unknown } | null | undefined): boolean =>
  !!order && (order.shippingLine1 ?? "") === "" && (order.shippingPincode ?? "") === "";
