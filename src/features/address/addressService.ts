import { apiClient } from "@/api/client";
import type { Address, AddressPayload } from "./types";

// Ported from sg-krashi-client/src/features/customer-portal/services/customerService.ts
// — only list/create, which is all this pass needs (no edit/delete/set-default UI yet).
export const addressService = {
  listAddresses: async (): Promise<Address[]> => {
    const response = await apiClient.get<Address[]>("/customers/me/addresses");
    return response.data;
  },

  createAddress: async (payload: AddressPayload): Promise<Address> => {
    const response = await apiClient.post<Address>("/customers/me/addresses", payload);
    return response.data;
  },
};

export const ADDRESSES_QUERY_KEY = ["customer", "addresses"] as const;
