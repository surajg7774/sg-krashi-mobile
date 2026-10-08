import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  CANCELLED_RESPONSE_DEV_HINT,
  GOOGLE_CODES,
  classifyGoogleFailure,
  googleCancelledResponse,
  googleUnexpectedResponse,
} from "../src/features/auth/googleErrors.ts";
import { translate } from "../src/i18n/index.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

// ---- the mapping ------------------------------------------------------------------------------------------------

test("the person cancelled the picker: nothing is shown", () => {
  assert.deepEqual(classifyGoogleFailure({ code: "SIGN_IN_CANCELLED", message: "User cancelled" }), { kind: "silent" });
  assert.equal(googleCancelledResponse().kind, "silent");
});

test("another sign-in is already running: the extra tap is ignored, not reported", () => {
  assert.equal(classifyGoogleFailure({ code: "IN_PROGRESS", message: "busy" }).kind, "silent");
});

test("Play services missing or out of date has its own message", () => {
  const failure = classifyGoogleFailure({ code: "PLAY_SERVICES_NOT_AVAILABLE", message: "Play services 12 < 24" });
  assert.equal(failure.kind, "message");
  assert.equal(failure.kind === "message" && failure.key, "auth.google.playServices");
});

test("network problems (our API, a timeout, a hung native call, a message that says so) get the 'couldn't reach Google' message", () => {
  const network = [
    { code: "NETWORK_ERROR", message: "Network Error", details: [] },
    { code: "NETWORK_ERROR", message: "timeout of 15000ms exceeded" },
    { code: "ONE_TAP_START_FAILED", message: "Unable to resolve host accounts.google.com" },
    { code: "ONE_TAP_START_FAILED", message: "A network error (such as timeout, interrupted connection) occurred" },
    new Error("signIn() did not resolve within 12000ms"),
    { code: "X", message: "No internet connection" },
  ];
  for (const error of network) {
    const failure = classifyGoogleFailure(error);
    assert.equal(failure.kind === "message" && failure.key, "auth.google.network", JSON.stringify(error));
  }
});

test("everything else - rejected account, config error, server refusal, unknown or garbage - is the one generic message", () => {
  const other = [
    { code: "DEVELOPER_ERROR", message: "10: wrong SHA-1" },
    { code: "ONE_TAP_START_FAILED", message: "No credentials available" },
    { code: "SIGN_IN_REQUIRED", message: "x" },
    { code: "ACCOUNT_DISABLED", message: "This account is not allowed", details: ["email: not allowed"], status: 403 },
    new Error("boom"),
    "a string",
    null,
    undefined,
    42,
  ];
  for (const error of other) {
    const failure = classifyGoogleFailure(error);
    assert.equal(failure.kind === "message" && failure.key, "auth.google.failed", String(error));
  }
  const unexpected = googleUnexpectedResponse("weird");
  assert.equal(unexpected.kind === "message" && unexpected.key, "auth.google.failed");
});

test("the technical reason is kept for the developer log, never as the message to show", () => {
  const failure = classifyGoogleFailure({ code: "DEVELOPER_ERROR", message: "10: wrong SHA-1" });
  assert.match(failure.devNote ?? "", /SHA-1/);
  assert.ok(!("text" in failure) && !("message" in failure), "the failure object carries a key, not display text");
  assert.match(CANCELLED_RESPONSE_DEV_HINT, /Test users/);
  assert.equal(googleCancelledResponse().devNote, CANCELLED_RESPONSE_DEV_HINT);
});

// ---- what the person reads, in both languages -------------------------------------------------------------------

test("the three messages are the agreed English, and Hindi has real Hindi (no English sentence, no code, no hint)", () => {
  assert.equal(translate("en", "auth.google.network"), "Couldn't reach Google. Check your internet connection and try again.");
  assert.equal(translate("en", "auth.google.failed"), "Google sign-in didn't work. Please try again or log in with your email.");
  for (const key of ["auth.google.network", "auth.google.failed", "auth.google.playServices"] as const) {
    const hindi = translate("hi", key);
    assert.match(hindi, /[ऀ-ॿ]/, key);
    assert.doesNotMatch(hindi, /Cloud Console|Test users|OAuth|DEVELOPER_ERROR|SHA-1|Metro/, key);
    assert.doesNotMatch(hindi, /\{|\}/, `${key} has an unfilled placeholder`);
    const english = translate("en", key);
    assert.doesNotMatch(english, /Cloud Console|Test users|OAuth|DEVELOPER_ERROR|SHA-1|Metro/, key);
  }
});

// ---- the library still uses these codes -------------------------------------------------------------------------

test("the error codes we map are still the ones the Google sign-in library defines", () => {
  const types = readFileSync(new URL("../node_modules/react-native-nitro-google-signin/src/types.ts", import.meta.url), "utf8");
  for (const code of Object.values(GOOGLE_CODES)) assert.match(types, new RegExp(`['"]${code}['"]`), code);
});

// ---- wiring: Login and Register share the one button; no developer text can reach a release build ----------------

test("Login and Register both use the shared Google button (so they share the mapping)", () => {
  for (const path of ["../src/features/auth/LoginScreen.tsx", "../src/features/auth/RegisterScreen.tsx"]) {
    assert.match(read(path), /<GoogleSignInButton onError=\{setError\} \/>/, path);
  }
});

test("the button shows only translated keys; the old developer hint exists only in the pure module and is only logged under __DEV__", () => {
  const button = read("../src/components/GoogleSignInButton.tsx");
  assert.match(button, /if \(failure\.kind === "message"\) onError\(t\(failure\.key\)\)/);
  assert.match(button, /if \(__DEV__ && failure\.devNote\) console\.warn/);
  assert.doesNotMatch(button, /onError\(`|onError\("/, "no literal text goes to the screen");
  assert.doesNotMatch(button, /err\.code|err\.message|errorText/, "no raw code or library text reaches the screen");
  assert.doesNotMatch(button, /Cloud Console|Test users|DEVELOPER_ERROR|Metro console/);
  // the hint is a console-only constant: nothing but the pure module and the dev log line can reach it
  const screens = ["../src/features/auth/LoginScreen.tsx", "../src/features/auth/RegisterScreen.tsx", "../src/features/profile/DeleteAccountModal.tsx"];
  for (const path of screens) assert.doesNotMatch(read(path), /CANCELLED_RESPONSE_DEV_HINT|Cloud Console/, path);
});

test("account-deletion confirmation with Google uses the same mapping for 'the person backed out'", () => {
  const modal = read("../src/features/profile/DeleteAccountModal.tsx");
  assert.match(modal, /classifyGoogleFailure\(err\)\.kind === "silent"/);
});
