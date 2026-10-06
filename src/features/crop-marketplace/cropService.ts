import { apiClient } from "@/api/client";
import type { Paginated } from "@/api/types";
import type { CropListingQuery } from "./cropLogic";
import type { CropCategory, CropListingDetail, CropListingSummary, CropReviewPage } from "./types";

// All public, unauthenticated GETs (the same ones the website's Crop Marketplace uses).
export const cropService = {
  getCategories: async (): Promise<CropCategory[]> => {
    const response = await apiClient.get<CropCategory[]>("/crop-categories");
    return response.data;
  },

  getListings: async (query: CropListingQuery): Promise<Paginated<CropListingSummary>> => {
    const response = await apiClient.get<Paginated<CropListingSummary>>("/crop-listings", { params: query });
    return response.data;
  },

  getDetail: async (idOrSlug: string): Promise<CropListingDetail> => {
    const response = await apiClient.get<CropListingDetail>(`/crop-listings/${encodeURIComponent(idOrSlug)}`);
    return response.data;
  },

  getReviews: async (listingId: number, page: number, size = 5): Promise<CropReviewPage> => {
    const response = await apiClient.get<CropReviewPage>("/reviews", {
      params: { targetType: "CROP_LISTING", targetId: listingId, page, size },
    });
    return response.data;
  },
};
