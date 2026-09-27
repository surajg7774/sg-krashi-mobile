import { useEffect, useState } from "react";
import {
  GoogleSignInButton as NativeGoogleSignInButton,
  GoogleOneTapSignIn,
  isErrorWithCode,
  isSuccessResponse,
  isCancelledResponse,
  isNoSavedCredentialFoundResponse,
  statusCodes,
} from "react-native-nitro-google-signin";
import { useAuth } from "@/context/AuthContext";
import { ensureGoogleSignInConfigured, isGoogleSignInConfigured } from "@/features/auth/googleAuth";
import type { ApiError } from "@/api/types";

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
      setTimeout(() => reject(new Error(`${label} did not resolve within ${CALL_TIMEOUT_MS}ms`)), CALL_TIMEOUT_MS)
    ),
  ]);

export const GoogleSignInButton = ({ onError }: GoogleSignInButtonProps) => {
  const { loginWithGoogle } = useAuth();
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
        console.warn("[GoogleSignInButton] response type = 'cancelled' (no thrown error)");
        onError(
          "Google sign-in was cancelled or rejected. If you selected an account, check whether that account is " +
            "added under Google Cloud Console → OAuth consent screen → Test users."
        );
      } else {
        console.warn("[GoogleSignInButton] unexpected response type:", response.type);
        onError("Google sign-in did not complete (unexpected response). Please try again.");
      }
    } catch (err) {
      if (isErrorWithCode(err)) {
        console.error("[GoogleSignInButton] GoogleSignInError code:", err.code, "message:", err.message, "userInfo:", err.userInfo);
        if (err.code === statusCodes.SIGN_IN_CANCELLED) {
          return; // Real, unambiguous user cancellation — nothing to show.
        }
        if (err.code === statusCodes.DEVELOPER_ERROR) {
          onError("Google sign-in configuration error (DEVELOPER_ERROR) — package name, SHA-1, or client ID mismatch. See Metro console for details.");
          return;
        }
        onError(`Google sign-in failed (${err.code}): ${err.message}`);
        return;
      }
      if (err instanceof Error && /did not resolve within/.test(err.message)) {
        console.error("[GoogleSignInButton]", err.message);
        onError(`Google sign-in hung on ${err.message.split(" did not")[0]} — see Metro console. This is a real, reported issue in this library's version.`);
        return;
      }
      console.error("[GoogleSignInButton] non-library error during sign-in:", err);
      const apiError = err as ApiError;
      const detail = apiError.details?.length ? apiError.details.join("\n") : null;
      onError(detail || apiError.message || "Could not sign in with Google. Please try again.");
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
