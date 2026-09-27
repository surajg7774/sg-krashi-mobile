// Matches com.sgkrashi.farmer's and com.sgkrashi.cropmarketplace's real
// DTOs / com.sgkrashi.payout's DTOs exactly — read directly from the
// backend controllers/records, not guessed.

export interface FarmerDashboardSummary {
  totalListings: number;
  activeListings: number;
  ordersContainingListings: number;
  unitsSold: number;
}

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
  harvestDate: string;
  categoryName: string | null;
  thumbnailUrl: string | null;
  avgRating: number | null;
  reviewCount: number;
  isActive: boolean;
}

export interface MediaAsset {
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
  media: MediaAsset[];
  relatedListings: CropListingSummary[];
  avgRating: number | null;
  reviewCount: number;
  isActive: boolean;
}

// Same fields as the backend's FarmerCropListingRequest minus isActive — a
// Farmer never toggles active status directly; deactivation is the
// dedicated DELETE endpoint only.
export interface FarmerCropListingFormValues {
  categoryId: number | null;
  name: string;
  slug: string;
  description: string;
  quantityAvailable: number | null;
  unitPrice: number | null;
  harvestDate: string; // "YYYY-MM-DD"
  isOrganicCertified: boolean;
}

export type PayoutStatus = "BATCHED" | "APPROVED" | "PAID";
export type PayoutLineType = "EARNING" | "CLAWBACK";

export interface FarmerPayoutSummary {
  id: number;
  cycleStartDate: string;
  cycleEndDate: string;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  status: PayoutStatus;
  approvedAt: string | null;
  paidAt: string | null;
}

export interface PayoutLine {
  id: number;
  orderItemId: number;
  orderId: number;
  orderNumber: string;
  itemNameSnapshot: string;
  lineType: PayoutLineType;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
}

export interface FarmerPayoutDetail extends FarmerPayoutSummary {
  lines: PayoutLine[];
}

export interface PendingPayoutSummary {
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  itemCount: number;
}
