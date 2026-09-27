import { GoogleOneTapSignIn } from "react-native-nitro-google-signin";

// TODO: fill in once the Web OAuth client ID exists in Google Cloud Console
// (see the backend's GoogleAuthServiceImpl for why it's the Web client ID
// specifically, not the Android one). Not a secret — safe to hardcode, same
// as google-services.json's own contents — just genuinely doesn't exist yet.
const WEB_CLIENT_ID = "663365327747-nievg8l7d7h7kdtfjj5raja393hcn2n4.apps.googleusercontent.com";

export const isGoogleSignInConfigured = () => WEB_CLIENT_ID.length > 0;

let isConfigured = false;

/** Must be called once before the native GoogleSignInButton (or any other library method) is used. Idempotent. */
export const ensureGoogleSignInConfigured = () => {
  if (isConfigured || !isGoogleSignInConfigured()) return;
  GoogleOneTapSignIn.configure({ webClientId: WEB_CLIENT_ID, scopes: ["email"] });
  isConfigured = true;
};
