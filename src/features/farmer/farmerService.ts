import { apiClient } from "@/api/client";
import type { Paginated } from "@/api/types";
import type {
  CropCategory,
  CropListingDetail,
  CropListingSummary,
  FarmerCropListingFormValues,
  FarmerDashboardSummary,
  MediaAsset,
} from "./types";

// All /farmer/* endpoints are @PreAuthorize("hasRole('FARMER')") and
// ownership-scoped server-side (farmerId always comes from the JWT
// principal via CurrentUserProvider, never a request param) — see
// FarmerCropListingController.java. /crop-categories is the public,
// unauthenticated category list (same one the Crop Marketplace browse
// screen would use), reused here for the listing form's category picker.
export const farmerService = {
  getDashboardSummary: async (): Promise<FarmerDashboardSummary> => {
    const response = await apiClient.get<FarmerDashboardSummary>("/farmer/dashboard/summary");
    return response.data;
  },

  getCropCategories: async (): Promise<CropCategory[]> => {
    const response = await apiClient.get<CropCategory[]>("/crop-categories");
    return response.data;
  },

  listOwnListings: async (search: string, page: number, size = 20): Promise<Paginated<CropListingSummary>> => {
    const response = await apiClient.get<Paginated<CropListingSummary>>("/farmer/crop-listings", {
      params: { search: search || undefined, page, size },
    });
    return response.data;
  },

  getOwnListingDetail: async (id: number): Promise<CropListingDetail> => {
    const response = await apiClient.get<CropListingDetail>(`/farmer/crop-listings/${id}`);
    return response.data;
  },

  createOwnListing: async (values: FarmerCropListingFormValues): Promise<CropListingDetail> => {
    const response = await apiClient.post<CropListingDetail>("/farmer/crop-listings", values);
    return response.data;
  },

  updateOwnListing: async (id: number, values: FarmerCropListingFormValues): Promise<CropListingDetail> => {
    const response = await apiClient.put<CropListingDetail>(`/farmer/crop-listings/${id}`, values);
    return response.data;
  },

  deactivateOwnListing: async (id: number): Promise<void> => {
    await apiClient.delete(`/farmer/crop-listings/${id}`);
  },

  uploadListingMedia: async (listingId: number, image: { uri: string; name: string; type: string }): Promise<MediaAsset> => {
    const formData = new FormData();
    formData.append("file", { uri: image.uri, name: image.name, type: image.type } as unknown as Blob);
    const response = await apiClient.post<MediaAsset>(`/farmer/crop-listings/${listingId}/media`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  deleteListingMedia: async (listingId: number, mediaId: number): Promise<void> => {
    await apiClient.delete(`/farmer/crop-listings/${listingId}/media/${mediaId}`);
  },

  reorderListingMedia: async (listingId: number, mediaId: number, sortOrder: number): Promise<MediaAsset> => {
    const response = await apiClient.patch<MediaAsset>(`/farmer/crop-listings/${listingId}/media/${mediaId}`, { sortOrder });
    return response.data;
  },
};
