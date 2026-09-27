// Mirrors sg-krashi-client/src/features/mandi/types.ts exactly.
export interface MandiPrice {
  id: number;
  commodity: string;
  marketName: string;
  state: string;
  district: string | null;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  priceDate: string;
}

export interface MandiFilterOptions {
  commodities: string[];
  states: string[];
  markets: string[];
}

export interface MandiSyncMeta {
  lastSyncedAt: string | null;
  totalRows: number;
  apiConfigured: boolean;
}
