import { apiClient } from "@/api/client";
import type { RecommendationItemType, RecommendationList } from "./types";

export const recommendationService = {
  getForYou: async (limit = 8): Promise<RecommendationList> => {
    const response = await apiClient.get<RecommendationList>("/recommendations/for-you", { params: { limit } });
    return response.data;
  },

  getFrequentlyBoughtWith: async (productId: number, limit = 6): Promise<RecommendationList> => {
    const response = await apiClient.get<RecommendationList>("/recommendations/frequently-bought-with", {
      params: { productId, limit },
    });
    return response.data;
  },

  getSimilar: async (targetType: RecommendationItemType, targetId: number, limit = 6): Promise<RecommendationList> => {
    const response = await apiClient.get<RecommendationList>("/recommendations/similar", {
      params: { targetType, targetId, limit },
    });
    return response.data;
  },
};
