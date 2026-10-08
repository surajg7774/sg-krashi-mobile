// What a Google sign-in failure means to the person using the app. One small pure function, so every screen that signs
// in with Google (Login, Register) says the same thing and the rule is unit-tested with Node
// (tests/googleErrors.test.ts). Imports only types, so it runs without the native library.
//
// Real users never see developer text, raw error codes or English fallback text inside Hindi mode: a failure becomes
// either nothing (the person cancelled) or one of three translated messages. The technical detail goes to `devNote`,
// which the button only ever logs under __DEV__.
import type { MessageKey } from "../../i18n/index.ts";

/** The library's error codes (react-native-nitro-google-signin statusCodes). A test checks they still exist there. */
export const GOOGLE_CODES = {
  cancelled: "SIGN_IN_CANCELLED",
  inProgress: "IN_PROGRESS",
  playServices: "PLAY_SERVICES_NOT_AVAILABLE",
  developer: "DEVELOPER_ERROR",
  oneTapFailed: "ONE_TAP_START_FAILED",
  signInRequired: "SIGN_IN_REQUIRED",
} as const;

export type GoogleMessageKey = Extract<MessageKey, "auth.google.network" | "auth.google.failed" | "auth.google.playServices">;

export type GoogleFailure =
  /** Show nothing: the person cancelled, or another sign-in is already running. */
  | { kind: "silent"; devNote?: string }
  /** Show this translated message. */
  | { kind: "message"; key: GoogleMessageKey; devNote?: string };

/** The setup hint that used to be shown to everyone. Developer eyes only: the button logs it under __DEV__. */
export const CANCELLED_RESPONSE_DEV_HINT =
  "Google reported 'cancelled'. If an account WAS selected, check that it is added under Google Cloud Console -> OAuth consent screen -> Test users, and that the package name / SHA-1 / client ID match."; // i18n-ignore (developer-only)

const NETWORK_MESSAGE = /network|timed? ?out|timeout|unable to resolve|unknownhost|connection (reset|refused|failed|lost)|offline|no internet|econn|enotfound|enetunreach/i;

const asObject = (error: unknown): { code?: unknown; message?: unknown } => (typeof error === "object" && error !== null ? error : {});

/** Maps whatever a Google sign-in attempt threw (library error, our API error, a timeout) to what the person sees. */
export const classifyGoogleFailure = (error: unknown): GoogleFailure => {
  const { code, message } = asObject(error);
  const text = typeof message === "string" ? message : "";

  if (code === GOOGLE_CODES.cancelled) return { kind: "silent" };
  if (code === GOOGLE_CODES.inProgress) return { kind: "silent", devNote: "A Google sign-in is already in progress; the extra tap was ignored." };
  if (code === GOOGLE_CODES.playServices) return { kind: "message", key: "auth.google.playServices", devNote: text };
  if (code === GOOGLE_CODES.developer) {
    return { kind: "message", key: "auth.google.failed", devNote: "DEVELOPER_ERROR: package name, SHA-1 or client ID mismatch. " + text }; // i18n-ignore (developer-only)
  }
  // Our own API client reports an unreachable server / timeout as NETWORK_ERROR; the sign-in guard in the button
  // reports a hung native call as "... did not resolve within ...ms".
  if (code === "NETWORK_ERROR" || /did not resolve within/.test(text) || NETWORK_MESSAGE.test(text)) {
    return { kind: "message", key: "auth.google.network", devNote: text };
  }
  return { kind: "message", key: "auth.google.failed", devNote: [typeof code === "string" ? code : "", text].filter(Boolean).join(": ") || undefined };
};

/** Google answered "cancelled" without throwing. Treated as the person backing out: nothing is shown. */
export const googleCancelledResponse = (): GoogleFailure => ({ kind: "silent", devNote: CANCELLED_RESPONSE_DEV_HINT });

/** Google answered with something that is neither success nor cancelled. */
export const googleUnexpectedResponse = (type: unknown): GoogleFailure => ({
  kind: "message",
  key: "auth.google.failed",
  devNote: `Unexpected Google sign-in response type: ${String(type)}`,
});
