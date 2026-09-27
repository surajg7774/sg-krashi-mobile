// Ported from sg-krashi-client/src/features/product-store/types.ts.

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  children: ProductCategory[];
}

export interface ProductSummary {
  id: number;
  name: string;
  slug: string;
  price: number;
  isOrganicCertified: boolean;
  stockQty: number;
  categoryName: string | null;
  thumbnailUrl: string | null;
  avgRating: number | null;
  reviewCount: number;
  isActive: boolean;
}

export interface ProductMedia {
  id: number;
  url: string;
  altText: string | null;
  sortOrder: number;
}

export interface ProductDetailCategory {
  id: number;
  name: string;
  slug: string;
}

export interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  isOrganicCertified: boolean;
  stockQty: number;
  category: ProductDetailCategory | null;
  media: ProductMedia[];
  relatedProducts: ProductSummary[];
  avgRating: number | null;
  reviewCount: number;
  isActive: boolean;
}
