import { Platform } from "react-native";
import { GoogleOneTapSignIn } from "react-native-nitro-google-signin";

// Not a secret — safe to hardcode, same as google-services.json's own
// contents. Web client ID specifically (see the backend's
// GoogleAuthServiceImpl for why), created in the same Google Cloud project
// as the Android OAuth client (SHA-1-registered) and Firebase/FCM setup.
const WEB_CLIENT_ID = "663365327747-nievg8l7d7h7kdtfjj5raja393hcn2n4.apps.googleusercontent.com";

export const isGoogleSignInConfigured = () => WEB_CLIENT_ID.length > 0;

let configureState: "idle" | "configuring" | "ready" | "failed" = "idle";
let configurePromise: Promise<void> | null = null;

/**
 * Must complete before the native GoogleSignInButton (or any other library
 * method) is used — previously called synchronously during render, which
 * worked in principle (configure() is synchronous) but meant a render-time
 * side effect with no way to catch/log a failure or confirm it actually
 * ran before the button became tappable. Now explicit, awaited, and
 * logged, so a misconfiguration surfaces here rather than as a silent
 * dead end after the button is tapped.
 */
export const ensureGoogleSignInConfigured = (): Promise<void> => {
  if (configurePromise) return configurePromise;

  configurePromise = (async () => {
    configureState = "configuring";
    console.log("[GoogleAuth] configuring with webClientId:", WEB_CLIENT_ID);

    if (Platform.OS === "android") {
      try {
        await GoogleOneTapSignIn.checkPlayServices();
        console.log("[GoogleAuth] Play Services check passed");
      } catch (err) {
        console.error("[GoogleAuth] Play Services check FAILED:", err);
        configureState = "failed";
        throw err;
      }
    }

    try {
      GoogleOneTapSignIn.configure({ webClientId: WEB_CLIENT_ID, scopes: ["email"] });
      configureState = "ready";
      console.log("[GoogleAuth] configure() completed, state = ready");
    } catch (err) {
      console.error("[GoogleAuth] configure() FAILED:", err);
      configureState = "failed";
      throw err;
    }
  })();

  return configurePromise;
};

export const getGoogleSignInConfigureState = () => configureState;
