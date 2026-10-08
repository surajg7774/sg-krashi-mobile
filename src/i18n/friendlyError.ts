// What a failed request means to the person using the app. One pure function: error code / HTTP status -> a message key
// (and a number or two), so every screen says the same friendly thing in English and Hindi and the rules are
// unit-tested with Node (tests/friendlyError.test.ts).
//
// The app NEVER shows the server's own message text, an error code, an HTTP status number or a library's text:
// those are English, technical and can change under us. Only the stable CODE (and status) are read, never the
// message. The original error is logged in development builds only (I18nProvider).
//
// The server's error body (read-only here) is { success: false, error: { code, message, details[] } }; the API client
// (src/api/client.ts) turns it into { code, message, details, status, retryAfterSeconds? }, and a failure with no HTTP
// response at all into code "NETWORK_ERROR". The codes the server can send are listed in docs/I18N.md.
import type { MessageKey } from "./index.ts";

/** Where the error happened: a few codes mean something different on different screens. */
export type ErrorContext =
  | "generic"
  | "login"
  | "register"
  | "otp"
  | "resendOtp"
  | "cart"
  | "checkout"
  | "payment"
  | "address"
  | "account"
  | "chat"
  | "cropDoctor"
  | "farmer"
  | "soldOut"
  | "photo";

export interface FriendlyError {
  key: MessageKey;
  params?: Record<string, string | number>;
}

/** What each screen says when nothing more specific applies (an unmapped 4xx): short, polite, what to do next. */
export const CONTEXT_FALLBACK: Record<ErrorContext, MessageKey> = {
  generic: "errors.generic",
  login: "auth.login.failed",
  register: "auth.register.failed",
  otp: "auth.otp.verifyFailed",
  resendOtp: "auth.otp.resendFailed",
  cart: "crops.detail.addError",
  checkout: "checkout.placeError",
  payment: "orders.startPaymentError",
  address: "address.saveError",
  account: "account.deleteFailed",
  chat: "chat.sendError",
  cropDoctor: "cropDoctor.analyzeError",
  farmer: "farmer.form.saveError",
  soldOut: "crops.farmer.markSoldOutError",
  photo: "errors.photoInvalid",
};

/** Field names the server reports in validation details ("email: must be a valid address") and what to say for them. */
const FIELD_KEYS: Record<string, MessageKey> = {
  email: "errors.field.email",
  password: "errors.field.password",
  newPassword: "errors.field.password",
  name: "errors.field.name",
  fullName: "errors.field.name",
  phone: "errors.field.phone",
  phoneNumber: "errors.field.phone",
  otp: "errors.field.otp",
  line1: "errors.field.address",
  line2: "errors.field.address",
  city: "errors.field.address",
  state: "errors.field.address",
  pincode: "errors.field.pincode",
  unitPrice: "errors.field.price",
  price: "errors.field.price",
  quantityAvailable: "errors.field.quantity",
  quantity: "errors.field.quantity",
  harvestDate: "errors.field.date",
};

interface ErrorShape {
  code?: unknown;
  status?: unknown;
  details?: unknown;
  retryAfterSeconds?: unknown;
}

const shape = (error: unknown): ErrorShape => (typeof error === "object" && error !== null ? (error as ErrorShape) : {});

/** "email: Email must be a valid address" -> "email". Only the field NAME is used; the sentence after it never is. */
const fieldOf = (detail: unknown): string | null => {
  if (typeof detail !== "string") return null;
  const colon = detail.indexOf(":");
  return colon > 0 ? detail.slice(0, colon).trim() : null;
};

/** A message for the first validation detail whose field the app knows, otherwise the generic "check the details". */
const validationMessage = (details: unknown): MessageKey => {
  if (Array.isArray(details)) {
    for (const detail of details) {
      const key = FIELD_KEYS[fieldOf(detail) ?? ""];
      if (key) return key;
    }
  }
  return "errors.validation";
};

/** Whole minutes to wait, at least 1, from the Retry-After seconds - or null when the server gave no usable number. */
export const retryAfterMinutes = (seconds: unknown): number | null => {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.max(1, Math.ceil(seconds / 60));
};

const tooMany = (retryAfterSeconds: unknown): FriendlyError => {
  const minutes = retryAfterMinutes(retryAfterSeconds);
  return minutes === null
    ? { key: "errors.tooManyAttempts" }
    : { key: "errors.tooManyAttemptsIn", params: { count: minutes, minutes } };
};

export const friendlyError = (error: unknown, context: ErrorContext = "generic"): FriendlyError => {
  const e = shape(error);
  const code = typeof e.code === "string" ? e.code : "";
  const status = typeof e.status === "number" ? e.status : 0;

  // No answer from the server at all (no connection, DNS failure, timeout, aborted).
  if (code === "NETWORK_ERROR") return { key: "errors.network" };

  switch (code) {
    case "INVALID_CREDENTIALS":
      return { key: context === "account" ? "errors.wrongPassword" : "errors.invalidCredentials" };
    case "GOOGLE_ONLY_ACCOUNT":
      return { key: "errors.googleOnlyAccount" };
    case "INVALID_GOOGLE_TOKEN":
    case "GOOGLE_SIGN_IN_NOT_CONFIGURED":
      return { key: "auth.google.failed" };
    case "INVALID_OTP":
      return { key: "errors.invalidOtp" };
    case "TOO_MANY_OTP_ATTEMPTS":
      return { key: "errors.tooManyOtp" };
    case "OTP_RESEND_COOLDOWN":
      return { key: "errors.otpCooldown" };
    case "INVALID_TOKEN":
      return { key: "errors.sessionExpired" };
    case "ACCESS_DENIED":
      return { key: "errors.forbidden" };
    case "RATE_LIMIT_EXCEEDED":
      return tooMany(e.retryAfterSeconds);
    case "AI_QUOTA_EXCEEDED":
    case "CHAT_QUOTA_EXCEEDED":
      return { key: "errors.dailyLimit" };
    case "AI_SERVICE_UNAVAILABLE":
    case "CHAT_ASSISTANT_UNAVAILABLE":
    case "CHAT_ASSISTANT_DISABLED":
      return { key: "errors.featureUnavailable" };
    case "WEATHER_UNAVAILABLE":
      return { key: "errors.weatherUnavailable" };
    case "GEOCODING_UNAVAILABLE":
      return { key: "errors.placeSearchUnavailable" };
    case "DUPLICATE_RESOURCE":
      return { key: context === "register" ? "errors.emailTaken" : "errors.alreadyExists" };
    case "CONFLICT":
      return { key: "errors.conflict" };
    case "NOT_FOUND":
    case "RESOURCE_NOT_FOUND":
      return { key: context === "payment" ? "errors.orderNotFound" : context === "cart" || context === "checkout" ? "errors.itemGone" : "errors.notFound" };
    case "VALIDATION_ERROR":
      return { key: context === "photo" ? "errors.photoInvalid" : validationMessage(e.details) };
    case "BUSINESS_RULE_VIOLATION":
      if (context === "cart" || context === "checkout") return { key: "errors.outOfStock" };
      if (context === "account") return { key: "errors.cannotDeleteNow" };
      if (context === "payment") return { key: "errors.paymentFailed" };
      return { key: "errors.businessRule" };
    case "INTERNAL_SERVER_ERROR":
      return { key: "errors.server" };
    case "UNSUPPORTED_MEDIA_TYPE":
      return { key: context === "photo" ? "errors.photoInvalid" : "errors.validation" };
    default:
      break;
  }

  // An unknown or missing code (a proxy's error page, a newer server): fall back on the HTTP status.
  if (status === 429) return tooMany(e.retryAfterSeconds);
  if (status >= 500) return { key: "errors.server" };
  if (status === 401) return { key: "errors.sessionExpired" };
  if (status === 403) return { key: "errors.forbidden" };
  if (status === 404) return { key: "errors.notFound" };
  if (status === 409) return { key: "errors.conflict" };
  if (status === 413 && context === "photo") return { key: "errors.photoInvalid" };
  if (status === 400 || status === 422) return { key: validationMessage(e.details) };
  if (status > 0) return { key: CONTEXT_FALLBACK[context] };

  // Not an API error at all (a bug, a thrown string): the screen's own friendly fallback.
  return { key: CONTEXT_FALLBACK[context] };
};
