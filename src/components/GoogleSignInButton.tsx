import { useState } from "react";
import { GoogleSignInButton as NativeGoogleSignInButton } from "react-native-nitro-google-signin";
import { useAuth } from "@/context/AuthContext";
import { ensureGoogleSignInConfigured, isGoogleSignInConfigured } from "@/features/auth/googleAuth";
import type { ApiError } from "@/api/types";

interface GoogleSignInButtonProps {
  onError: (message: string) => void;
}

// Wraps the library's own official, brand-compliant button (native
// GIDSignInButton on iOS, Play-services-branded on Android) rather than a
// custom-styled one — Google requires specific button assets for
// production use, and this component already implements the right
// signIn()->createAccount() fallback cascade internally via
// signInBehavior="credentialManager" (its default), so no custom cascade
// logic is needed on this side.
//
// Hidden entirely (not shown disabled/erroring) until WEB_CLIENT_ID is set
// — same "don't show a feature that can only fail" reasoning as this app's
// other coming-soon gates.
export const GoogleSignInButton = ({ onError }: GoogleSignInButtonProps) => {
  const { loginWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (!isGoogleSignInConfigured()) {
    return null;
  }
  ensureGoogleSignInConfigured();

  return (
    <NativeGoogleSignInButton
      size="wide"
      colorScheme="light"
      disabled={isSigningIn}
      style={{ marginTop: 12, alignSelf: "center" }}
      loading={isSigningIn}
      onSignInSuccess={async (data) => {
        setIsSigningIn(true);
        try {
          await loginWithGoogle(data.idToken);
        } catch (err) {
          const apiError = err as ApiError;
          const detail = apiError.details?.length ? apiError.details.join("\n") : null;
          onError(detail || apiError.message || "Could not sign in with Google. Please try again.");
        } finally {
          setIsSigningIn(false);
        }
      }}
      onSignInError={(error) => {
        // Cancelling the account picker also lands here per the library's
        // own error-code convention — only surface it as a user-facing
        // error when it's genuinely not a cancellation.
        const message = error instanceof Error ? error.message : String(error);
        if (!/cancel/i.test(message)) {
          onError("Could not sign in with Google. Please try again.");
        }
      }}
    />
  );
};
