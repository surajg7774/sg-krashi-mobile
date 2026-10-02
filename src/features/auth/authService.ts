import { apiClient } from "@/api/client";
import type {
  LoginPayload,
  MobileAuthResponse,
  MobileRefreshResponse,
  RegisterPayload,
  ResendOtpPayload,
  VerifyOtpPayload,
} from "./types";

// Hits the mobile-specific endpoints (MobileAuthController.java) for
// login/refresh — those stay cookie-based on the web side and return no
// refresh token in the body at all. /auth/register has no mobile variant:
// it returns no tokens either way (see RegisterPayload's comment), so
// there's nothing web-vs-mobile to differ on.
export const authService = {
  login: async (payload: LoginPayload): Promise<MobileAuthResponse> => {
    const response = await apiClient.post<MobileAuthResponse>("/auth/mobile/login", payload);
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<MobileRefreshResponse> => {
    const response = await apiClient.post<MobileRefreshResponse>("/auth/mobile/refresh", { refreshToken });
    return response.data;
  },

  register: async (payload: RegisterPayload): Promise<void> => {
    await apiClient.post("/auth/register", payload);
  },

  verifyOtp: async (payload: VerifyOtpPayload): Promise<MobileAuthResponse> => {
    const response = await apiClient.post<MobileAuthResponse>("/auth/mobile/verify-otp", payload);
    return response.data;
  },

  // No mobile-specific variant needed — returns no tokens either way, same
  // reasoning as register() above.
  resendOtp: async (payload: ResendOtpPayload): Promise<void> => {
    await apiClient.post("/auth/resend-otp", payload);
  },

  google: async (idToken: string): Promise<MobileAuthResponse> => {
    console.log("[authService.google] POST /auth/mobile/google — idToken length:", idToken?.length ?? 0);
    try {
      const response = await apiClient.post<MobileAuthResponse>("/auth/mobile/google", { idToken });
      console.log("[authService.google] success — user id:", response.data.user.id);
      return response.data;
    } catch (err) {
      console.error("[authService.google] request failed:", err);
      throw err;
    }
  },
};
