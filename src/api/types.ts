// Ported verbatim from sg-krashi-client/src/shared/types/api.ts — same backend,
// same envelope shape, must stay in sync with that file if it ever changes.

export interface ApiResponse<T> {
  success: true;
  data: T;
  message: string;
  timestamp: string;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details: string[];
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details: string[];
  status?: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
