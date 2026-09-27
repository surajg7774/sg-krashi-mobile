import { apiClient } from "@/api/client";
import type { Paginated } from "@/api/types";
import type { Order, OrderSummary } from "./types";

export interface CheckoutPayload {
  addressId: number;
}

// Ported from sg-krashi-client/src/features/orders/services/orderService.ts.
export const orderService = {
  checkout: async (payload: CheckoutPayload): Promise<Order> => {
    const response = await apiClient.post<Order>("/orders", payload);
    return response.data;
  },

  listMyOrders: async (page: number, size = 10): Promise<Paginated<OrderSummary>> => {
    const response = await apiClient.get<Paginated<OrderSummary>>("/orders/my", { params: { page, size } });
    return response.data;
  },

  getOrderDetail: async (orderId: number): Promise<Order> => {
    const response = await apiClient.get<Order>(`/orders/${orderId}`);
    return response.data;
  },
};
