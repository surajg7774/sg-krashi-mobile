import { apiClient } from "@/api/client";
import type { AddCartItemPayload, Cart, UpdateCartItemPayload } from "./types";

// Ported from sg-krashi-client/src/features/cart-checkout/services/cartCheckoutService.ts.
export const cartService = {
  getCart: async (): Promise<Cart> => {
    const response = await apiClient.get<Cart>("/cart");
    return response.data;
  },

  addItem: async (payload: AddCartItemPayload): Promise<Cart> => {
    const response = await apiClient.post<Cart>("/cart/items", payload);
    return response.data;
  },

  updateItem: async (itemId: number, payload: UpdateCartItemPayload): Promise<Cart> => {
    const response = await apiClient.put<Cart>(`/cart/items/${itemId}`, payload);
    return response.data;
  },

  removeItem: async (itemId: number): Promise<Cart> => {
    const response = await apiClient.delete<Cart>(`/cart/items/${itemId}`);
    return response.data;
  },
};

// Shared React Query key so Home's cart badge and any mutation elsewhere
// (ProductDetailScreen's add-to-cart, CartScreen's quantity/remove) all
// invalidate the exact same cache entry.
export const CART_QUERY_KEY = ["cart"] as const;
