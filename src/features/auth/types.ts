// Ported from sg-krashi-client/src/features/auth/types.ts, plus the
// mobile-only shapes returned by /auth/mobile/login and /auth/mobile/refresh
// (MobileAuthResponse / MobileRefreshResponse on the server) — see
// MobileAuthController.java for why these exist as a separate pair rather
// than reusing the web AuthResponse (which never includes a refresh token).

export interface LoginPayload {
  email: string;
  password: string;
}

// Same shape as the web app's RegisterRequest — POST /auth/register itself
// is unauthenticated and identical for web and mobile (no mobile-specific
// variant needed here, unlike login/refresh), since it returns no tokens at
// all: it only emails a 6-digit OTP. Completing the account happens via
// /auth/mobile/verify-otp (see authService.verifyOtp), entered right in the
// app — no browser hand-off needed, unlike the old link-based flow this
// replaced.
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ResendOtpPayload {
  email: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  roles: string[];
}

export interface MobileAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface MobileRefreshResponse {
  accessToken: string;
  refreshToken: string;
}
