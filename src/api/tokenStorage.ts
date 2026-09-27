import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// Mobile equivalent of the web app's in-memory accessTokenRef (AuthContext.tsx)
// — except here it's persisted, not memory-only, since there's no browser XSS
// surface to defend against and the whole point is surviving app restarts.
//
// UPDATE (Milestone 2): now also holds the refresh token. The backend gained
// POST /api/v1/auth/mobile/login and /auth/mobile/refresh specifically to
// return it in the JSON body instead of the web app's HttpOnly cookie — see
// MobileAuthController.java on the server for the reasoning. USER_KEY exists
// so the app can restore `user` on cold start without a network call.
const ACCESS_TOKEN_KEY = "sgkrashi.accessToken";
const REFRESH_TOKEN_KEY = "sgkrashi.refreshToken";
const USER_KEY = "sgkrashi.user";
// Not sensitive (unlike the two above) — stored here anyway purely to reuse
// this module's existing storage abstraction rather than adding a second
// one for one string. Remembered so logout can unregister the exact same
// token it registered at login (see pushNotifications.ts).
const DEVICE_PUSH_TOKEN_KEY = "sgkrashi.devicePushToken";

// expo-secure-store's real target is native Keychain/Keystore — its web shim
// doesn't implement getValueWithKeyAsync in this SDK version (confirmed live:
// throws "not a function" when actually run via `expo start --web`). Web is
// not a shipped platform for this app; it exists here purely so this app's
// logic can be verified with Playwright on a machine with no Android
// emulator. localStorage is a fine stand-in for THAT purpose only — it must
// never be read as "web support," and the native (iOS/Android) path below is
// unaffected and untouched.
const isWeb = Platform.OS === "web";

const webGet = (key: string): Promise<string | null> => Promise.resolve(window.localStorage.getItem(key));
const webSet = (key: string, value: string): Promise<void> => {
  window.localStorage.setItem(key, value);
  return Promise.resolve();
};
const webDelete = (key: string): Promise<void> => {
  window.localStorage.removeItem(key);
  return Promise.resolve();
};

export const tokenStorage = {
  getAccessToken: (): Promise<string | null> =>
    isWeb ? webGet(ACCESS_TOKEN_KEY) : SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string): Promise<void> =>
    isWeb ? webSet(ACCESS_TOKEN_KEY, token) : SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token),
  clearAccessToken: (): Promise<void> =>
    isWeb ? webDelete(ACCESS_TOKEN_KEY) : SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),

  getRefreshToken: (): Promise<string | null> =>
    isWeb ? webGet(REFRESH_TOKEN_KEY) : SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string): Promise<void> =>
    isWeb ? webSet(REFRESH_TOKEN_KEY, token) : SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token),
  clearRefreshToken: (): Promise<void> =>
    isWeb ? webDelete(REFRESH_TOKEN_KEY) : SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),

  getStoredUser: (): Promise<string | null> => (isWeb ? webGet(USER_KEY) : SecureStore.getItemAsync(USER_KEY)),
  setStoredUser: (userJson: string): Promise<void> =>
    isWeb ? webSet(USER_KEY, userJson) : SecureStore.setItemAsync(USER_KEY, userJson),
  clearStoredUser: (): Promise<void> => (isWeb ? webDelete(USER_KEY) : SecureStore.deleteItemAsync(USER_KEY)),

  getDevicePushToken: (): Promise<string | null> =>
    isWeb ? webGet(DEVICE_PUSH_TOKEN_KEY) : SecureStore.getItemAsync(DEVICE_PUSH_TOKEN_KEY),
  setDevicePushToken: (token: string): Promise<void> =>
    isWeb ? webSet(DEVICE_PUSH_TOKEN_KEY, token) : SecureStore.setItemAsync(DEVICE_PUSH_TOKEN_KEY, token),
  clearDevicePushToken: (): Promise<void> =>
    isWeb ? webDelete(DEVICE_PUSH_TOKEN_KEY) : SecureStore.deleteItemAsync(DEVICE_PUSH_TOKEN_KEY),
};
