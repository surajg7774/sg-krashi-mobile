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
// all: registration only sends a verification email (link points at the WEB
// frontend's /verify-email page — completing an account is a one-time,
// web-side step regardless of which client registered it), and the mobile
// app's own /auth/mobile/login only becomes usable once that's done.
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
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
