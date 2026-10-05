// Ported from sg-krashi-client/src/features/orders/types.ts.

export type OrderStatus = "PENDING_PAYMENT" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "PAYMENT_FAILED" | "REFUNDED";
export type ItemType = "PRODUCT" | "CROP_LISTING";

export interface OrderItem {
  id: number;
  itemType: ItemType;
  itemId: number;
  itemName: string;
  thumbnailUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  note: string | null;
  occurredAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  items: OrderItem[];
  statusHistory: OrderStatusEvent[];
  createdAt: string;
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
}
