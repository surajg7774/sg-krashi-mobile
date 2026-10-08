import axios, { type InternalAxiosRequestConfig, type AxiosError } from "axios";
import type { ApiError, ApiErrorResponse, ApiResponse } from "./types";
import { tokenStorage } from "./tokenStorage";
import { timeoutForRequest } from "@/offline/queryPolicy";

// Same production backend the web app (sg-krashi-client) already talks to.
// No .env wiring for this milestone — a single real target, matching the
// task's explicit instruction to hit production, not a mock.
export const API_BASE_URL = "https://sg-krashi-server-production-8583.up.railway.app/api/v1";
const REFRESH_ENDPOINT = "/auth/mobile/refresh";
// A 401 here must never escalate to onAuthFailure() (full logout) — this is
// a best-effort background call (see pushNotifications.ts's own try/catch),
// and a real incident confirmed why: a 401 on this exact endpoint,
// immediately after a real successful Google login, forced a full logout
// and sent the user straight back to the login screen — the worst possible
// outcome for a call whose only job is registering a push token. Whatever
// benign timing quirk caused that 401 (still being investigated), a device
// token registration failing is never a reason to end the session; it's
// swallowed by pushNotifications.ts's own catch either way.
const NON_CRITICAL_ENDPOINTS = ["/notifications/device-tokens"];

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

// De-duplicates concurrent refresh attempts into one in-flight promise.
// Confirmed live as a real bug, not theoretical: a burst of simultaneous
// authenticated calls (products/cart/notifications/device-tokens all
// firing together right after login) each independently 401'd on a
// stale token and each called refreshTokens() on its own — since the
// refresh token rotates on every use (AuthServiceImpl.refresh — "Rotation
// happens on every call, not just on expiry"), only the first of those
// concurrent calls could actually succeed; the rest hit the server with
// an already-rotated refresh token and failed with a second 401. Every
// 401 handler below now calls getOrStartRefresh() instead of
// refreshTokens() directly: the first caller starts the real request and
// stores the promise here; anyone arriving while it's still pending gets
// the exact same promise instead of starting a second one. Cleared via
// .finally() once it settles (success or failure) so the next genuinely
// new expiry starts a fresh refresh rather than reusing a stale result.
let refreshPromise: Promise<string | null> | null = null;

const getOrStartRefresh = (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
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
    const isNonCritical = NON_CRITICAL_ENDPOINTS.some((path) => originalRequest?.url?.includes(path));

    // Same shape as the web app's axiosInstance.ts: on a 401 from anything
    // OTHER than the refresh call itself, try one silent refresh-and-retry
    // before giving up. `_retry` stops this from looping if the retried
    // request 401s again.
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isRefreshCall) {
      originalRequest._retry = true;
      // null = the server rejected the refresh token (session over); a throw = the refresh could not be
      // completed (offline, timeout, 429, 5xx), which must never log anyone out.
      let newAccessToken: string | null | undefined;
      try {
        newAccessToken = await getOrStartRefresh();
      } catch {
        newAccessToken = undefined;
      }

      if (newAccessToken) {
        originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
        return apiClient(originalRequest);
      }

      if (newAccessToken === null && !isNonCritical) {
        onAuthFailure();
      }
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
          message: error.message || "Network error", // i18n-ignore (errorText shows a translated sentence for NETWORK_ERROR)
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
  // A timeout only for the GETs behind the screens that have an offline copy (not a global axios timeout):
  // a dead connection then fails over to the cached data instead of hanging.
  if (!config.timeout) {
    const timeout = timeoutForRequest(config.method, config.url);
    if (timeout) config.timeout = timeout;
  }
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});
