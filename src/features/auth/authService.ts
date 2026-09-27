import { apiClient } from "@/api/client";
import type { LoginPayload, MobileAuthResponse, MobileRefreshResponse, RegisterPayload } from "./types";

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

  google: async (idToken: string): Promise<MobileAuthResponse> => {
    const response = await apiClient.post<MobileAuthResponse>("/auth/mobile/google", { idToken });
    return response.data;
  },
};
