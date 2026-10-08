import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { CONTEXT_FALLBACK, friendlyError, retryAfterMinutes, type ErrorContext } from "../src/i18n/friendlyError.ts";
import { translate } from "../src/i18n/index.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const text = (error: unknown, context: ErrorContext = "generic", lang: "en" | "hi" = "en"): string => {
  const f = friendlyError(error, context);
  return translate(lang, f.key, f.params);
};
const keyOf = (error: unknown, context: ErrorContext = "generic"): string => friendlyError(error, context).key;

// ---- the table: code / status -> message ------------------------------------------------------------------------

const TABLE: { error: unknown; context?: ErrorContext; en: string }[] = [
  { error: { code: "NETWORK_ERROR", message: "Network Error" }, en: "No internet connection or the connection is slow. Please try again." },
  { error: { code: "NETWORK_ERROR", message: "timeout of 15000ms exceeded" }, en: "No internet connection or the connection is slow. Please try again." },
  { error: { code: "INVALID_CREDENTIALS", status: 401, message: "Invalid email or password" }, context: "login", en: "Wrong email or password. If you just signed up, first verify your email with the code we sent you." },
  { error: { code: "INVALID_CREDENTIALS", status: 401 }, context: "account", en: "That password isn't right. Please try again." },
  { error: { code: "GOOGLE_ONLY_ACCOUNT", status: 401 }, context: "login", en: "This account uses Google to sign in. Please use the Google sign-in button." },
  { error: { code: "INVALID_GOOGLE_TOKEN", status: 401 }, context: "login", en: "Google sign-in didn't work. Please try again or log in with your email." },
  { error: { code: "INVALID_OTP", status: 400 }, context: "otp", en: "That code isn't right or has expired. Check it, or ask for a new code." },
  { error: { code: "TOO_MANY_OTP_ATTEMPTS", status: 429 }, context: "otp", en: "Too many wrong codes. Please ask for a new code and try again." },
  { error: { code: "OTP_RESEND_COOLDOWN", status: 429 }, context: "resendOtp", en: "Please wait a little before asking for another code." },
  { error: { code: "DUPLICATE_RESOURCE", status: 409 }, context: "register", en: "This email is already registered. Try logging in instead." },
  { error: { code: "DUPLICATE_RESOURCE", status: 409 }, context: "farmer", en: "That already exists. Please check and try again." },
  { error: { code: "CONFLICT", status: 409 }, en: "This changed while you were working on it. Please refresh and try again." },
  { error: { code: "RATE_LIMIT_EXCEEDED", status: 429 }, context: "login", en: "Too many attempts. Please wait a short while and try again." },
  { error: { code: "INVALID_TOKEN", status: 401 }, en: "Your session has expired. Please log in again." },
  { error: { status: 401 }, en: "Your session has expired. Please log in again." },
  { error: { code: "ACCESS_DENIED", status: 403 }, en: "You don't have permission to do this." },
  { error: { status: 403 }, en: "You don't have permission to do this." },
  { error: { code: "RESOURCE_NOT_FOUND", status: 404 }, en: "We couldn't find what you were looking for." },
  { error: { code: "RESOURCE_NOT_FOUND", status: 404 }, context: "payment", en: "We couldn't find that order." },
  { error: { code: "RESOURCE_NOT_FOUND", status: 404 }, context: "cart", en: "This item is no longer available." },
  { error: { code: "NOT_FOUND", status: 404 }, en: "We couldn't find what you were looking for." },
  { error: { status: 404 }, en: "We couldn't find what you were looking for." },
  { error: { code: "BUSINESS_RULE_VIOLATION", status: 400 }, context: "checkout", en: "Some items are out of stock or not available in that quantity. Please check your cart and try again." },
  { error: { code: "BUSINESS_RULE_VIOLATION", status: 400 }, context: "cart", en: "Some items are out of stock or not available in that quantity. Please check your cart and try again." },
  { error: { code: "BUSINESS_RULE_VIOLATION", status: 400 }, context: "payment", en: "The payment didn't go through. Please try again." },
  { error: { code: "BUSINESS_RULE_VIOLATION", status: 400 }, context: "account", en: "Your account can't be deleted while an order, booking or payout is still in progress. Please try again once it's finished." },
  { error: { code: "BUSINESS_RULE_VIOLATION", status: 400 }, context: "farmer", en: "We couldn't complete that. Please check and try again." },
  { error: { code: "VALIDATION_ERROR", status: 400, details: [] }, en: "Please check the details you entered and try again." },
  { error: { code: "VALIDATION_ERROR", status: 400 }, context: "photo", en: "That photo couldn't be used. Please choose a smaller photo (under 5 MB) and try again." },
  { error: { code: "AI_QUOTA_EXCEEDED", status: 503 }, context: "cropDoctor", en: "We've reached the limit for this feature for now. Please try again later." },
  { error: { code: "CHAT_QUOTA_EXCEEDED", status: 429 }, context: "chat", en: "We've reached the limit for this feature for now. Please try again later." },
  { error: { code: "AI_SERVICE_UNAVAILABLE", status: 503 }, context: "cropDoctor", en: "This feature isn't available right now. Please try again in a little while." },
  { error: { code: "CHAT_ASSISTANT_UNAVAILABLE", status: 503 }, context: "chat", en: "This feature isn't available right now. Please try again in a little while." },
  { error: { code: "CHAT_ASSISTANT_DISABLED", status: 503 }, context: "chat", en: "This feature isn't available right now. Please try again in a little while." },
  { error: { code: "WEATHER_UNAVAILABLE", status: 503 }, en: "Weather isn't available right now. Please try again in a little while." },
  { error: { code: "GEOCODING_UNAVAILABLE", status: 503 }, en: "Place search isn't working right now. Please try again in a little while." },
  { error: { code: "INTERNAL_SERVER_ERROR", status: 500 }, en: "Something went wrong on our side. Please try again in a little while." },
  { error: { status: 500 }, en: "Something went wrong on our side. Please try again in a little while." },
  { error: { status: 502, code: "HTTP_ERROR" }, en: "Something went wrong on our side. Please try again in a little while." },
  { error: { status: 503 }, en: "Something went wrong on our side. Please try again in a little while." },
];

test("each server code / HTTP status gives its friendly English message", () => {
  for (const row of TABLE) assert.equal(text(row.error, row.context ?? "generic"), row.en, JSON.stringify(row));
});

test("every message the mapping can return exists in English and Hindi, is real Hindi, and has no unfilled placeholder", () => {
  const contexts = Object.keys(CONTEXT_FALLBACK) as ErrorContext[];
  const codes = [
    "NETWORK_ERROR", "INVALID_CREDENTIALS", "GOOGLE_ONLY_ACCOUNT", "INVALID_GOOGLE_TOKEN", "GOOGLE_SIGN_IN_NOT_CONFIGURED", "INVALID_OTP",
    "TOO_MANY_OTP_ATTEMPTS", "OTP_RESEND_COOLDOWN", "INVALID_TOKEN", "ACCESS_DENIED", "RATE_LIMIT_EXCEEDED", "AI_QUOTA_EXCEEDED",
    "CHAT_QUOTA_EXCEEDED", "AI_SERVICE_UNAVAILABLE", "CHAT_ASSISTANT_UNAVAILABLE", "CHAT_ASSISTANT_DISABLED", "WEATHER_UNAVAILABLE",
    "GEOCODING_UNAVAILABLE", "DUPLICATE_RESOURCE", "CONFLICT", "NOT_FOUND", "RESOURCE_NOT_FOUND", "VALIDATION_ERROR", "BUSINESS_RULE_VIOLATION",
    "INTERNAL_SERVER_ERROR", "UNSUPPORTED_MEDIA_TYPE", "METHOD_NOT_ALLOWED", "HTTP_ERROR", "SOMETHING_NEW", "",
  ];
  const statuses = [0, 400, 401, 403, 404, 409, 413, 418, 422, 429, 500, 502, 503];
  const seen = new Set<string>();
  for (const context of contexts) {
    for (const code of codes) {
      for (const status of statuses) {
        for (const extra of [{}, { retryAfterSeconds: 90 }, { details: ["email: Email must be a valid address"] }]) {
          const f = friendlyError({ code, status, ...extra }, context);
          seen.add(f.key);
          const english = translate("en", f.key, f.params);
          const hindi = translate("hi", f.key, f.params);
          assert.notEqual(english, f.key, `${f.key} missing in English`);
          assert.notEqual(hindi, f.key, `${f.key} missing in Hindi`);
          assert.match(hindi, /[ऀ-ॿ]/, `${f.key} is not Hindi`);
          assert.doesNotMatch(english + hindi, /\{|\}/, `${f.key} has an unfilled placeholder`);
        }
      }
    }
  }
  assert.ok(seen.size > 30, `only ${seen.size} different messages reached`);
});

// ---- never the server's words, a code or a number ---------------------------------------------------------------

test("the server's own text, the error code and the HTTP status never appear in what the person reads", () => {
  const nasty = {
    code: "BUSINESS_RULE_VIOLATION",
    status: 422,
    message: "SECRET-SERVER-TEXT could not reserve stock for item 17",
    details: ["quantity: SECRET-DETAIL must be at most 3", "zzUnknownField: SECRET-OTHER"],
  };
  for (const context of Object.keys(CONTEXT_FALLBACK) as ErrorContext[]) {
    for (const lang of ["en", "hi"] as const) {
      const shown = text(nasty, context, lang);
      assert.doesNotMatch(shown, /SECRET|BUSINESS_RULE|422|VIOLATION|item 17/, `${context}/${lang}: ${shown}`);
    }
  }
  for (const lang of ["en", "hi"] as const) {
    assert.doesNotMatch(text({ code: "INVALID_CREDENTIALS", status: 401, message: "Invalid email or password" }, "login", lang), /INVALID_CREDENTIALS|401|Invalid email/);
  }
});

test("Hindi mode shows no English sentence for any server error", () => {
  for (const row of TABLE) {
    const hindi = text(row.error, row.context ?? "generic", "hi");
    assert.doesNotMatch(hindi, /\b(Please|Something|Wrong|Network|Invalid|error|Error)\b/, hindi);
  }
});

// ---- validation: field-specific when the field is known ---------------------------------------------------------

test("validation errors name the field the app knows, otherwise ask to check the details", () => {
  const cases: [string, string][] = [
    ["email: Email must be a valid address", "Please enter a valid email address."],
    ["password: size must be between 8 and 100", "Your password must be at least 8 characters."],
    ["name: must not be blank", "Please enter your name."],
    ["phone: invalid", "Please enter a valid phone number."],
    ["otp: must be 6 digits", "Please enter the 6-digit code."],
    ["pincode: invalid", "Please enter a valid pincode."],
    ["city: must not be blank", "Please fill in the address details."],
    ["unitPrice: must be positive", "Please enter a valid price."],
    ["quantityAvailable: must be >= 0", "Please enter a valid quantity."],
    ["harvestDate: invalid", "Please choose a valid date."],
  ];
  for (const [detail, english] of cases) assert.equal(text({ code: "VALIDATION_ERROR", status: 400, details: [detail] }), english, detail);
  // first KNOWN field wins; an unknown one is skipped; nothing known -> generic
  assert.equal(text({ code: "VALIDATION_ERROR", status: 400, details: ["mystery: x", "email: bad"] }), "Please enter a valid email address.");
  assert.equal(text({ code: "VALIDATION_ERROR", status: 400, details: ["mystery: x"] }), "Please check the details you entered and try again.");
  assert.equal(text({ code: "VALIDATION_ERROR", status: 400, details: ["no colon here"] }), "Please check the details you entered and try again.");
  assert.equal(text({ code: "VALIDATION_ERROR", status: 400, details: "not an array" }), "Please check the details you entered and try again.");
  assert.equal(text({ status: 422, details: ["email: bad"] }), "Please enter a valid email address.");
});

// ---- rate limit with Retry-After --------------------------------------------------------------------------------

test("Retry-After becomes 'about N minutes' (at least 1), and without a usable number the general wait message", () => {
  assert.equal(retryAfterMinutes(60), 1);
  assert.equal(retryAfterMinutes(61), 2);
  assert.equal(retryAfterMinutes(5), 1);
  assert.equal(retryAfterMinutes(900), 15);
  for (const bad of [0, -5, Number.NaN, Number.POSITIVE_INFINITY, "90", null, undefined]) assert.equal(retryAfterMinutes(bad), null);

  const rate = (seconds?: unknown) => ({ code: "RATE_LIMIT_EXCEEDED", status: 429, retryAfterSeconds: seconds });
  assert.equal(text(rate(60)), "Too many attempts. Please try again in about 1 minute.");
  assert.equal(text(rate(120)), "Too many attempts. Please try again in about 2 minutes.");
  assert.equal(text(rate(900)), "Too many attempts. Please try again in about 15 minutes.");
  assert.equal(text(rate(30)), "Too many attempts. Please try again in about 1 minute.");
  assert.equal(text(rate(undefined)), "Too many attempts. Please wait a short while and try again.");
  assert.equal(text(rate(0)), "Too many attempts. Please wait a short while and try again.");
  assert.equal(text({ status: 429, retryAfterSeconds: 300 }), "Too many attempts. Please try again in about 5 minutes.");
  assert.equal(text(rate(300), "generic", "hi"), "बहुत ज़्यादा कोशिशें हो गईं। कृपया लगभग 5 मिनट बाद फिर से कोशिश करें।");
});

// ---- fallback ---------------------------------------------------------------------------------------------------

test("anything unmapped gets the screen's own friendly fallback, or the generic one - never nothing", () => {
  assert.equal(text(null), "Something went wrong. Please try again.");
  assert.equal(text(undefined), "Something went wrong. Please try again.");
  assert.equal(text("boom"), "Something went wrong. Please try again.");
  assert.equal(text(new Error("kaboom"), "generic"), "Something went wrong. Please try again.");
  assert.equal(text({ code: "SOMETHING_NEW", status: 418 }, "login"), "Login failed. Please try again.");
  assert.equal(text({ code: "SOMETHING_NEW", status: 418 }, "register"), "Could not create your account. Please try again.");
  assert.equal(text(new Error("x"), "checkout"), "Could not place your order. Please try again.");
  assert.equal(keyOf({ code: "SOMETHING_NEW" }, "chat"), CONTEXT_FALLBACK.chat);
  for (const context of Object.keys(CONTEXT_FALLBACK) as ErrorContext[]) {
    assert.notEqual(translate("en", CONTEXT_FALLBACK[context]), CONTEXT_FALLBACK[context], context);
    assert.notEqual(translate("hi", CONTEXT_FALLBACK[context]), CONTEXT_FALLBACK[context], context);
  }
});

// ---- the API client keeps what the mapping needs ----------------------------------------------------------------

test("the API client keeps the Retry-After seconds and survives an error body that is not our JSON", () => {
  const client = readFileSync(join(root, "src/api/client.ts"), "utf8");
  assert.match(client, /headers\?\.\["retry-after"\]/);
  assert.match(client, /retryAfterSeconds/);
  assert.match(client, /code: "HTTP_ERROR"/);
  assert.doesNotMatch(client, /responseBody\.error\.code/, "an HTML error page would have thrown inside the interceptor");
});

// ---- no screen shows server text any more -----------------------------------------------------------------------

const walk = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(path);
  }
  return out;
};

test("no screen or component reads error.message / .details / response.data.message to show it (only the mapping and the API client may)", () => {
  // Files that legitimately look at these fields: the API layer (builds the error), the friendly mapping and the Google
  // classifier (read codes and status), and the notification center (a notification's own message is its content).
  const allowed = [/[\\/]src[\\/]api[\\/]/, /[\\/]src[\\/]i18n[\\/]/, /googleErrors\.ts$/];
  const offenders: string[] = [];
  for (const file of [...walk(join(root, "src")), join(root, "App.tsx")]) {
    if (allowed.some((re) => re.test(file))) continue;
    const code = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    code.split("\n").forEach((line, index) => {
      if (/\b(?:err|error|e)\??\.(?:message|details)\b|\.error\??\.message|\.data\??\.(?:message|error|details)\b|\{[^}]*\bmessage\?: string/.test(line)) {
        offenders.push(`${file.replace(root, "")}:${index + 1} ${line.trim()}`);
      }
    });
  }
  assert.deepEqual(offenders, []);
});

test("every failed-request message on a screen goes through errorText(...) with a context", () => {
  const sites: [string, RegExp][] = [
    ["src/features/auth/LoginScreen.tsx", /errorText\(err, "login"\)/],
    ["src/features/auth/RegisterScreen.tsx", /errorText\(err, "register"\)/],
    ["src/features/auth/VerifyOtpScreen.tsx", /errorText\(err, "otp"\)/],
    ["src/features/auth/VerifyOtpScreen.tsx", /errorText\(err, "resendOtp"\)/],
    ["src/features/checkout/CheckoutScreen.tsx", /errorText\(checkoutMutation\.error, "checkout"\)/],
    ["src/features/address/AddressSelectScreen.tsx", /errorText\(createMutation\.error, "address"\)/],
    ["src/features/store/ProductDetailScreen.tsx", /errorText\(addToCartMutation\.error, "cart"\)/],
    ["src/features/crop-marketplace/CropListingDetailScreen.tsx", /errorText\(addMutation\.error, "cart"\)/],
    ["src/features/orders/OrderConfirmationScreen.tsx", /errorText\(err, "payment"\)/],
    ["src/features/profile/DeleteAccountModal.tsx", /errorText\(err, "account"\)/],
    ["src/features/chat/ChatScreen.tsx", /errorText\(err, "chat"\)/],
    ["src/features/crop-doctor/CropDoctorScreen.tsx", /errorText\(analyzeMutation\.error, "cropDoctor"\)/],
    ["src/features/farmer/FarmerListingFormScreen.tsx", /errorText\(err, "farmer"\)/],
    ["src/features/farmer/FarmerListingFormScreen.tsx", /errorText\(err, "soldOut"\)/],
    ["src/features/farmer/FarmerListingFormScreen.tsx", /errorText\(err, "photo"\)/],
  ];
  for (const [path, pattern] of sites) assert.match(readFileSync(join(root, path), "utf8"), pattern, `${path} ${pattern}`);
  // Razorpay's own wording is not shown either
  const razorpay = readFileSync(join(root, "src/features/payment/RazorpayWebView.tsx"), "utf8");
  assert.match(razorpay, /onError\(t\("errors\.paymentFailed"\)\)/);
  assert.doesNotMatch(razorpay, /onError\(message\.message/);
});
