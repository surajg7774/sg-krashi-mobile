import type { RecommendationItem } from "@/features/recommendations/types";
import type { CropListingSummary } from "./types";

/** A crop listing in the shape the shared recommendation rail takes (used by Home and the crop detail screen). */
export const asRailItem = (listing: CropListingSummary): RecommendationItem => ({
  id: listing.id,
  itemType: "CROP_LISTING",
  name: listing.name,
  slug: listing.slug,
  price: listing.unitPrice,
  thumbnailUrl: listing.thumbnailUrl,
  avgRating: listing.avgRating,
  reviewCount: listing.reviewCount,
});
