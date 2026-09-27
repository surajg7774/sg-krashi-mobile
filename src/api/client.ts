import axios, { type InternalAxiosRequestConfig, type AxiosError } from "axios";
import type { ApiError, ApiErrorResponse, ApiResponse } from "./types";
import { tokenStorage } from "./tokenStorage";

// Same production backend the web app (sg-krashi-client) already talks to.
// No .env wiring for this milestone — a single real target, matching the
// task's explicit instruction to hit production, not a mock.
export const API_BASE_URL = "https://sg-krashi-server-production-8583.up.railway.app/api/v1";
const REFRESH_ENDPOINT = "/auth/mobile/refresh";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Set once by AuthProvider at app init — same reason as the web app's
// registerAuthHandlers (axiosInstance.ts): this module can't import
// AuthContext directly (circular dependency: AuthContext -> authService ->
// this module), so AuthProvider hands it callbacks instead.
//
// refreshTokens does the actual /auth/mobile/refresh call AND persists the
// rotated pair to tokenStorage — living in AuthContext (not here) keeps this
// module from also needing to import authService, which would create the
// same circular dependency from the other direction.
let refreshTokens: () => Promise<string | null> = async () => null;
let onAuthFailure: () => void = () => {};

export const registerAuthHandlers = (handlers: {
  refreshTokens: () => Promise<string | null>;
  onAuthFailure: () => void;
}) => {
  refreshTokens = handlers.refreshTokens;
  onAuthFailure = handlers.onAuthFailure;
};

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Same unwrap as sg-krashi-client/src/shared/services/axiosInstance.ts: every
// JSON endpoint responds {success, data, message, timestamp} — callers just
// want `data`.
apiClient.interceptors.response.use(
  (response) => {
    // Binary responses (e.g. the crop-scan PDF report) have no {success,
    // data, message} envelope to unwrap — same guard as sg-krashi-client's
    // axiosInstance.ts.
    if (response.config.responseType === "arraybuffer") {
      return response;
    }
    const envelope = response.data as ApiResponse<unknown>;
    return { ...response, data: envelope.data };
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetriableConfig | undefined;
    const isRefreshCall = originalRequest?.url?.includes(REFRESH_ENDPOINT) ?? false;

    // Same shape as the web app's axiosInstance.ts: on a 401 from anything
    // OTHER than the refresh call itself, try one silent refresh-and-retry
    // before giving up. `_retry` stops this from looping if the retried
    // request 401s again.
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isRefreshCall) {
      originalRequest._retry = true;
      const newAccessToken = await refreshTokens();

      if (newAccessToken) {
        originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
        return apiClient(originalRequest);
      }

      onAuthFailure();
    }

    const responseBody = error.response?.data;
    const normalized: ApiError = responseBody
      ? {
          code: responseBody.error.code,
          message: responseBody.error.message,
          details: responseBody.error.details,
          status: error.response?.status,
        }
      : {
          code: "NETWORK_ERROR",
          message: error.message || "Network error",
          details: [],
          status: error.response?.status,
        };
    return Promise.reject(normalized);
  }
);

// Attaches the stored access token to every outgoing request. SecureStore
// reads are async, so this has to be a request interceptor (which axios lets
// return a Promise<config>), not a plain header set at client-creation time.
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});
