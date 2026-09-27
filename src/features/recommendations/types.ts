// Mirrors sg-krashi-client/src/features/recommendations/types.ts exactly.
export type RecommendationItemType = "PRODUCT" | "CROP_LISTING";

export interface RecommendationItem {
  id: number;
  itemType: RecommendationItemType;
  name: string;
  slug: string;
  price: number;
  thumbnailUrl: string | null;
  avgRating: number | null;
  reviewCount: number;
}

export interface RecommendationList {
  items: RecommendationItem[];
}
