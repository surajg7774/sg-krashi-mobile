import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { SCREEN_TOP_EXTRA, screenTopPadding } from "../src/theme/insets.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\/\/.*$/gm, "");

test("the top padding is the status-bar inset plus a small extra (8 dp by default)", () => {
  assert.equal(SCREEN_TOP_EXTRA, 8);
  assert.equal(screenTopPadding(24), 32);
  assert.equal(screenTopPadding(48), 56);
  assert.equal(screenTopPadding(24, 16), 40);
  assert.equal(screenTopPadding(0), 8);
});

test("a missing, negative or broken inset counts as zero, never as a negative or NaN padding", () => {
  for (const bad of [null, undefined, -10, Number.NaN, Number.POSITIVE_INFINITY, "24" as never]) {
    assert.equal(screenTopPadding(bad), SCREEN_TOP_EXTRA);
  }
});

// ---- wiring --------------------------------------------------------------------------------------------------------

// Screens that draw their own title because they have no navigation header (everything else gets the inset from the
// stack header). A new headerless screen has to be added here AND use screenTopPadding.
const HEADERLESS = [
  "../src/features/home/HomeScreen.tsx",
  "../src/features/weather/WeatherScreen.tsx",
  "../src/features/profile/ProfileScreen.tsx",
  "../src/features/auth/LoginScreen.tsx",
  "../src/features/auth/RegisterScreen.tsx",
  "../src/features/auth/VerifyOtpScreen.tsx",
];

test("every headerless screen pads its top by the status-bar inset", () => {
  for (const path of HEADERLESS) {
    const source = read(path);
    assert.match(source, /useSafeAreaInsets\(\)/, `${path} does not read the safe-area insets`);
    assert.match(source, /screenTopPadding\(insets\.top/, `${path} does not use screenTopPadding`);
  }
});

test("the only headerless routes are the tabs and the three auth screens (so the list above is complete)", () => {
  const guest = read("../src/navigation/GuestStackNavigator.tsx");
  const main = read("../src/navigation/MainStackNavigator.tsx");
  const tabs = read("../src/navigation/TabNavigator.tsx");
  const headerless = (source: string) => [...source.matchAll(/name="(\w+)"[^>]*headerShown: false/g)].map((m) => m[1]);
  assert.deepEqual(headerless(guest).sort(), ["CropDoctorGuest", "Login", "Register", "VerifyOtp"]);
  assert.deepEqual(headerless(main), ["MainTabs"]);
  // The tab navigator hides every tab header; the tabs that draw their own title are Home, Weather and Profile
  // (Store, Crop Doctor and Farmer are stacks with their own headers).
  assert.match(tabs, /headerShown: false/);
  for (const tab of ["Home", "Weather", "Profile"]) assert.match(tabs, new RegExp(`name="${tab}"`));
});
