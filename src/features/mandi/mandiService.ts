import { apiClient } from "@/api/client";
import type { Paginated } from "@/api/types";
import type { MandiFilterOptions, MandiPrice, MandiSyncMeta, MandiTrendPoint } from "./types";

export interface MandiPriceSearchParams {
  commodity?: string;
  state?: string;
  market?: string;
  page?: number;
  size?: number;
}

// Public, unauthenticated — same contract as sg-krashi-client's mandiService.ts.
export const mandiService = {
  search: async (params: MandiPriceSearchParams): Promise<Paginated<MandiPrice>> => {
    const response = await apiClient.get<Paginated<MandiPrice>>("/mandi/prices", { params });
    return response.data;
  },

  getFilterOptions: async (state?: string): Promise<MandiFilterOptions> => {
    const response = await apiClient.get<MandiFilterOptions>("/mandi/prices/filters", { params: { state } });
    return response.data;
  },

  getTrend: async (commodity: string, state?: string, market?: string): Promise<MandiTrendPoint[]> => {
    const response = await apiClient.get<MandiTrendPoint[]>("/mandi/prices/trend", { params: { commodity, state, market } });
    return response.data;
  },

  getSyncMeta: async (): Promise<MandiSyncMeta> => {
    const response = await apiClient.get<MandiSyncMeta>("/mandi/prices/meta");
    return response.data;
  },
};
