// Ported from sg-krashi-client/src/features/cart-checkout/types.ts.

export type ItemType = "PRODUCT" | "CROP_LISTING";

export interface CartItem {
  id: number;
  itemType: ItemType;
  itemId: number;
  itemName: string;
  itemSlug: string;
  thumbnailUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  availableQuantity: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export interface AddCartItemPayload {
  itemType: ItemType;
  itemId: number;
  quantity: number;
}

export interface UpdateCartItemPayload {
  quantity: number;
}
