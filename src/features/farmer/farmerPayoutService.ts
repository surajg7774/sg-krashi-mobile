import { apiClient } from "@/api/client";
import type { Paginated } from "@/api/types";
import type { FarmerPayoutDetail, FarmerPayoutSummary, PendingPayoutSummary } from "./types";

export const farmerPayoutService = {
  listOwnPayouts: async (page: number, size = 20): Promise<Paginated<FarmerPayoutSummary>> => {
    const response = await apiClient.get<Paginated<FarmerPayoutSummary>>("/farmer/payouts", { params: { page, size } });
    return response.data;
  },

  getOwnPayoutDetail: async (id: number): Promise<FarmerPayoutDetail> => {
    const response = await apiClient.get<FarmerPayoutDetail>(`/farmer/payouts/${id}`);
    return response.data;
  },

  getPending: async (): Promise<PendingPayoutSummary> => {
    const response = await apiClient.get<PendingPayoutSummary>("/farmer/payouts/pending");
    return response.data;
  },
};
