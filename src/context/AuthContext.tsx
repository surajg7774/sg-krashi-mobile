import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authService } from "@/features/auth/authService";
import { tokenStorage } from "@/api/tokenStorage";
import { registerAuthHandlers } from "@/api/client";
import { ensurePushPermissionAndRegister, unregisterPushToken } from "@/notifications/pushNotifications";
import type { AuthUser, LoginPayload, MobileAuthResponse } from "@/features/auth/types";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  loginWithGoogle: (idToken: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Shared by password login and Google login — both end in the exact same
  // MobileAuthResponse shape (see MobileAuthController.google() on the
  // backend, which returns the same DTO as login()), so everything after
  // "the server gave us tokens" is identical regardless of which flow got
  // us there.
  const applyAuthResult = useCallback(async (response: MobileAuthResponse): Promise<AuthUser> => {
    await Promise.all([
      tokenStorage.setAccessToken(response.accessToken),
      tokenStorage.setRefreshToken(response.refreshToken),
      tokenStorage.setStoredUser(JSON.stringify(response.user)),
    ]);
    setUser(response.user);
    // Fire-and-forget, deliberately after login rather than on app launch —
    // requesting notification permission before the user has even seen the
    // app would be the "surprising, trust-damaging" pattern this codebase
    // avoids elsewhere for geolocation. Never blocks/fails the login itself
    // (see the function's own try/catch).
    void ensurePushPermissionAndRegister();
    return response.user;
  }, []);

  const login = useCallback(
    async (payload: LoginPayload): Promise<AuthUser> => applyAuthResult(await authService.login(payload)),
    [applyAuthResult]
  );

  const loginWithGoogle = useCallback(
    async (idToken: string): Promise<AuthUser> => applyAuthResult(await authService.google(idToken)),
    [applyAuthResult]
  );

  const logout = useCallback(async (): Promise<void> => {
    // No server-side call: unlike the web app's /auth/logout (which only
    // revokes the HttpOnly cookie's DB-side row), there's no mobile-specific
    // logout endpoint yet — the refresh token this app holds stays valid
    // server-side until it expires or is rotated again. Fine for this
    // milestone; worth a real "revoke on mobile logout" endpoint later.
    await unregisterPushToken();
    await Promise.all([
      tokenStorage.clearAccessToken(),
      tokenStorage.clearRefreshToken(),
      tokenStorage.clearStoredUser(),
    ]);
    setUser(null);
  }, []);

  // Called by the axios interceptor (client.ts) on a 401 — does the actual
  // /auth/mobile/refresh call, persists the rotated pair, and returns the
  // new access token for the interceptor to retry the original request
  // with. Returning null (refresh itself failed — token expired/revoked)
  // tells the interceptor to give up and call onAuthFailure instead.
  const refreshTokens = useCallback(async (): Promise<string | null> => {
    try {
      const storedRefreshToken = await tokenStorage.getRefreshToken();
      if (!storedRefreshToken) {
        return null;
      }
      const response = await authService.refresh(storedRefreshToken);
      await Promise.all([
        tokenStorage.setAccessToken(response.accessToken),
        tokenStorage.setRefreshToken(response.refreshToken),
      ]);
      return response.accessToken;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    registerAuthHandlers({
      refreshTokens,
      onAuthFailure: () => {
        void logout();
      },
    });
  }, [refreshTokens, logout]);

  // Cold-start restore: trusts whatever's in SecureStore rather than making
  // a network call up front (unlike the web app's real /auth/refresh-on-mount
  // check) — if the stored access token is stale, the first real request's
  // interceptor-driven refresh (above) handles it transparently anyway.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [storedToken, storedUserJson] = await Promise.all([
        tokenStorage.getAccessToken(),
        tokenStorage.getStoredUser(),
      ]);
      if (!cancelled && storedToken && storedUserJson) {
        setUser(JSON.parse(storedUserJson) as AuthUser);
        // Re-registers on every cold start for an already-logged-in user —
        // cheap (permission is already granted or already denied by this
        // point, so this is just a fresh getDevicePushTokenAsync + POST) and
        // covers a token that rotated since the last app launch.
        void ensurePushPermissionAndRegister();
      }
      if (!cancelled) {
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
