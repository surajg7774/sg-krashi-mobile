// Matches the server's public crop DTOs (com.sgkrashi.cropmarketplace CropListingSummaryResponse /
// CropListingDetailResponse, review ReviewResponse / ReviewListResponse), read from the source and checked against the
// live API. There is no unit, seller, farmer or location field in the public response, so none is modelled here.

export interface CropCategory {
  id: number;
  name: string;
  slug: string;
}

export interface CropListingSummary {
  id: number;
  name: string;
  slug: string;
  unitPrice: number;
  isOrganicCertified: boolean;
  quantityAvailable: number;
  harvestDate: string; // "YYYY-MM-DD"
  categoryName: string | null;
  thumbnailUrl: string | null;
  avgRating: number | null;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface CropListingMedia {
  id: number;
  url: string;
  altText: string | null;
  sortOrder: number;
}

export interface CropListingDetail {
  id: number;
  name: string;
  slug: string;
  description: string;
  unitPrice: number;
  isOrganicCertified: boolean;
  quantityAvailable: number;
  harvestDate: string;
  category: { id: number; name: string; slug: string } | null;
  media: CropListingMedia[];
  relatedListings: CropListingSummary[];
  avgRating: number | null;
  reviewCount: number;
  isActive: boolean;
}

export interface CropReview {
  id: number;
  reviewerName: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface CropReviewPage {
  items: CropReview[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  ratingSummary: { avgRating: number | null; reviewCount: number };
}
