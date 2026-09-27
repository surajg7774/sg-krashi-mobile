import { apiClient } from "@/api/client";
import type { Paginated } from "@/api/types";
import type { ProductCategory, ProductDetail, ProductSummary } from "./types";

// Ported from sg-krashi-client/src/features/product-store/services/productService.ts.
// Every filter (search/categoryId/minPrice/maxPrice/organicOnly) is a query
// param on the SAME GET /products the plain list uses — confirmed directly
// against ProductController.java, not guessed. Public, unauthenticated.
export interface ProductQueryParams {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  organicOnly?: boolean;
  search?: string;
  page?: number;
  size?: number;
}

export const productService = {
  getCategories: async (): Promise<ProductCategory[]> => {
    const response = await apiClient.get<ProductCategory[]>("/product-categories");
    return response.data;
  },

  getProducts: async (params: ProductQueryParams): Promise<Paginated<ProductSummary>> => {
    const response = await apiClient.get<Paginated<ProductSummary>>("/products", { params });
    return response.data;
  },

  getProductDetail: async (idOrSlug: string): Promise<ProductDetail> => {
    const response = await apiClient.get<ProductDetail>(`/products/${idOrSlug}`);
    return response.data;
  },
};
