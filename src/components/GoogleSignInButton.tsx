import { useEffect, useState } from "react";
import {
  GoogleSignInButton as NativeGoogleSignInButton,
  GoogleOneTapSignIn,
  isSuccessResponse,
  isCancelledResponse,
  isNoSavedCredentialFoundResponse,
} from "react-native-nitro-google-signin";
import { useAuth } from "@/context/AuthContext";
import { ensureGoogleSignInConfigured, isGoogleSignInConfigured } from "@/features/auth/googleAuth";
import { useT } from "@/i18n/useT";
import { classifyGoogleFailure, googleCancelledResponse, googleUnexpectedResponse, type GoogleFailure } from "@/features/auth/googleErrors";

interface GoogleSignInButtonProps {
  onError: (message: string) => void;
}

const CALL_TIMEOUT_MS = 12_000;

/**
 * Races a single native call against a timeout — confirmed necessary live:
 * GoogleOneTapSignIn.createAccount() hung indefinitely (no resolve, no
 * reject) for the full 15s across three separate attempts, verified via
 * real Metro console logs, not assumed. signIn() and presentExplicitSignIn()
 * resolved fine in the same testing — this appears specific to
 * createAccount() in this library version (2.3.0), a known class of issue
 * across this whole library family (the older @react-native-google-signin
 * package has matching "adding new account hangs, no promise return"
 * reports). createAccount() is therefore not called at all below.
 */
const withTimeout = <T,>(label: string, promise: Promise<T>): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} did not resolve within ${CALL_TIMEOUT_MS}ms`)), CALL_TIMEOUT_MS) // i18n-ignore
    ),
  ]);

export const GoogleSignInButton = ({ onError }: GoogleSignInButtonProps) => {
  const { loginWithGoogle } = useAuth();
  const { t } = useT();
  const [isReady, setIsReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!isGoogleSignInConfigured()) return;
    ensureGoogleSignInConfigured()
      .then(() => setIsReady(true))
      .catch((err) => {
        console.error("[GoogleSignInButton] configuration failed, button will stay disabled:", err);
      });
  }, []);

  if (!isGoogleSignInConfigured()) {
    return null;
  }

  // Real users see one of three translated messages, or nothing when they cancelled. The technical reason is only ever
  // logged, and only in development builds (see googleErrors.ts).
  const report = (failure: GoogleFailure) => {
    if (__DEV__ && failure.devNote) console.warn("[GoogleSignInButton]", failure.devNote);
    if (failure.kind === "message") onError(t(failure.key));
  };

  const handlePress = async () => {
    console.log("[GoogleSignInButton] press — starting sign-in");
    setIsSigningIn(true);

    try {
      let response = await withTimeout("signIn()", GoogleOneTapSignIn.signIn());
      console.log("[GoogleSignInButton] signIn() resolved with type:", response.type);

      if (isNoSavedCredentialFoundResponse(response)) {
        // NOT createAccount() — see this file's withTimeout comment.
        console.log("[GoogleSignInButton] no saved credential — trying presentExplicitSignIn()");
        response = await withTimeout("presentExplicitSignIn()", GoogleOneTapSignIn.presentExplicitSignIn());
        console.log("[GoogleSignInButton] presentExplicitSignIn() resolved with type:", response.type);
      }

      if (isSuccessResponse(response)) {
        console.log("[GoogleSignInButton] success, idToken length:", response.data.idToken?.length ?? 0);
        await loginWithGoogle(response.data.idToken);
        console.log("[GoogleSignInButton] loginWithGoogle() completed — should be authenticated now");
      } else if (isCancelledResponse(response)) {
        // The person backed out of the account picker: not an error, so nothing is shown (D17).
        report(googleCancelledResponse());
      } else {
        report(googleUnexpectedResponse(response.type));
      }
    } catch (err) {
      console.error("[GoogleSignInButton] sign-in failed:", err);
      report(classifyGoogleFailure(err));
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <NativeGoogleSignInButton
      size="wide"
      colorScheme="light"
      disabled={!isReady || isSigningIn}
      loading={isSigningIn}
      signInBehavior="none"
      onPress={handlePress}
      style={{ marginTop: 12, alignSelf: "center" }}
    />
  );
};
