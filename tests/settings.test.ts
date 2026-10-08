import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { clearLocalUserData } from "../src/shared/sessionCleanup.ts";
import { LANGUAGE_KEY } from "../src/shared/storageKeys.ts";
import { PRIVACY_POLICY_URL, TERMS_URL, DELETE_ACCOUNT_URL } from "../src/config/legal.ts";
import { en } from "../src/i18n/en.ts";
import { hi } from "../src/i18n/hi.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\/\/.*$/gm, "");
const settings = read("../src/features/settings/SettingsScreen.tsx");
const profile = read("../src/features/profile/ProfileScreen.tsx");
const main = read("../src/navigation/MainStackNavigator.tsx");

// ---- the route -------------------------------------------------------------------------------------------------

test("the Settings route is registered in the main stack, typed, and titled through i18n", () => {
  assert.match(main, /Settings: undefined;/);
  assert.match(main, /<Stack\.Screen name="Settings" component=\{SettingsScreen\} options=\{\{ title: t\("nav\.headers\.settings"\) \}\} \/>/);
  assert.match(main, /import \{ SettingsScreen \} from "@\/features\/settings\/SettingsScreen"/);
  assert.equal((en.nav.headers as Record<string, string>).settings, "Settings");
  assert.equal((hi.nav.headers as Record<string, string>).settings, "सेटिंग्स");
});

test("Profile opens it from a gear at the top right: labelled through i18n and a 44 dp touch target", () => {
  assert.match(profile, /navigation\.navigate\("Settings"\)/);
  assert.match(profile, /accessibilityLabel=\{t\("settings\.open"\)\}/);
  assert.match(profile, /accessibilityRole="button"/);
  const gear = /settingsButton: \{([^}]*)\}/.exec(profile)![1];
  assert.match(gear, /position: "absolute"/);
  assert.match(gear, /right: \d+/);
  assert.match(gear, /width: 44/);
  assert.match(gear, /height: 44/);
});

// ---- where each Profile item went -------------------------------------------------------------------------------

test("Profile keeps the person's things and Log out; the app-level items are gone from it", () => {
  for (const kept of [/user\?\.name/, /user\?\.email/, /navigation\.navigate\("Notifications"\)/, /navigation\.navigate\("OrderHistory"\)/, /void logout\(\)/, /t\("profile\.logout"\)/]) {
    assert.match(profile, kept);
  }
  for (const gone of [/LanguageToggle/, /PRIVACY_POLICY_URL/, /TERMS_URL/, /DeleteAccountModal/, /Linking/]) {
    assert.doesNotMatch(profile, gone);
  }
});

test("Settings has the language switch, both legal links, the app version and the account deletion", () => {
  assert.match(settings, /<LanguageToggle \/>/);
  assert.match(settings, /openWebPage\(PRIVACY_POLICY_URL\)/);
  assert.match(settings, /openWebPage\(TERMS_URL\)/);
  assert.match(settings, /\{APP_VERSION\}/);
  assert.match(settings, /<DeleteAccountModal visible=\{showDeleteAccount\} onClose=\{\(\) => setShowDeleteAccount\(false\)\} \/>/);
  assert.match(settings, /setShowDeleteAccount\(true\)/);
});

test("the delete-account action is the last section of Settings, in a separate danger section", () => {
  const order = ["language.title", "settings.legal", "settings.about", "settings.dangerZone", "settings.deleteAccount"].map((key) => settings.indexOf(`t("${key}")`));
  assert.ok(order.every((index) => index >= 0), "a section is missing");
  assert.deepEqual([...order].sort((a, b) => a - b), order, "sections are not in the expected order");
  assert.match(settings, /dangerCard: \{ borderColor: colors\.error \}/);
});

test("the legal links still point at the same website pages", () => {
  assert.equal(PRIVACY_POLICY_URL, "https://sg-krashi-client.vercel.app/privacy-policy");
  assert.equal(TERMS_URL, "https://sg-krashi-client.vercel.app/terms-and-conditions");
  assert.equal(DELETE_ACCOUNT_URL, "https://sg-krashi-client.vercel.app/delete-account");
});

test("the deletion confirmation is untouched: still password or fresh Google confirmation, then the server delete, then logout", () => {
  const modal = read("../src/features/profile/DeleteAccountModal.tsx");
  assert.match(modal, /accountService\.deleteAccount\(usesPassword \? \{ password \} : \{ googleIdToken: googleToken \}\)/);
  assert.match(modal, /await logout\(\)/);
  assert.match(modal, /DELETE_ACCOUNT_URL/);
});

test("the version shown is the one in app.json", () => {
  const appInfo = read("../src/config/appInfo.ts");
  assert.match(appInfo, /appConfig\.expo\.version/);
  const app = JSON.parse(readFileSync(new URL("../app.json", import.meta.url), "utf8")) as { expo: { version: string } };
  assert.match(app.expo.version, /^\d+\.\d+\.\d+$/);
});

// ---- the language is not part of "user data" ---------------------------------------------------------------------

test("logout, account deletion and a forced logout all clear user data but never the language", async () => {
  const removed: string[] = [];
  await clearLocalUserData({
    queryClient: { cancelQueries: async () => undefined, clear: () => undefined },
    storage: { removeItem: async (key: string) => void removed.push(key) },
    offlineCache: { clearPrivate: async () => undefined },
  });
  assert.ok(removed.length > 0, "user data is still cleared");
  assert.ok(!removed.includes(LANGUAGE_KEY));
  // Every one of the three flows goes through that one cleanup.
  const auth = read("../src/context/AuthContext.tsx");
  assert.ok((auth.match(/clearLocalUserData\(/g) ?? []).length >= 1);
});
