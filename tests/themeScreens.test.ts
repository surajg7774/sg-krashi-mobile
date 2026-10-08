import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { test } from "node:test";
import { accents, colors } from "../src/theme/colors.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path: string) => readFileSync(join(root, path), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

// ---- tab bar and Home -------------------------------------------------------------------------------------------

test("tab bar: green active tint, a green pill behind the open tab, a clearly grey inactive colour, no size changes", () => {
  const tabs = read("src/navigation/TabNavigator.tsx");
  assert.match(tabs, /tabBarActiveTintColor: colors\.primary/);
  assert.match(tabs, /tabBarInactiveTintColor: colors\.tabInactive/);
  assert.match(tabs, /tabBarActiveBackgroundColor: colors\.greenTint/);
  // colour and corner radius only: nothing that would change the bar's or an item's size
  const item = /tabBarItemStyle: \{([^}]*)\}/.exec(tabs)![1];
  assert.match(item, /borderRadius/);
  assert.doesNotMatch(item, /height|width|padding|margin/i);
  assert.doesNotMatch(tabs, /tabBarStyle: \{[^}]*(height|padding|margin)/i);
});

test("Home: deep-green hero with a gold edge and white greeting; six tiles, each in its own tinted accent", () => {
  const home = read("src/features/home/HomeScreen.tsx");
  const header = /\n  header: \{([^}]*)\}/.exec(home)![1];
  assert.match(header, /backgroundColor: colors\.primaryDark/);
  assert.match(header, /borderBottomColor: colors\.secondary/);
  assert.match(home, /greeting: \{[^}]*color: colors\.white/s);
  // every quick link has an accent, and the six accents are all different
  const used = [...home.matchAll(/accent: "(\w+)"/g)].map((m) => m[1]);
  assert.equal(used.length, 6);
  assert.equal(new Set(used).size, 6);
  for (const name of used) assert.ok(name in accents, name);
  assert.match(home, /accents\[link\.accent\]\.tint/);
  assert.match(home, /accents\[link\.accent\]\.icon/);
  assert.match(home, /accents\[link\.accent\]\.text/);
  // status bar icons are light over the green hero, only while Home is the open tab
  assert.match(home, /isFocused && <StatusBar style="light" \/>/);
  // the hero's text and icons are white on the deep green (contrast is asserted in theme.test.ts)
  assert.match(home, /color=\{colors\.white\}/);
  assert.ok(colors.primaryDark !== colors.background);
});

// ---- chips, cards, prices ---------------------------------------------------------------------------------------

test("filter chips: selected = filled green with white text, the others a soft green tint with deep-green text", () => {
  const chips = read("src/components/ChipRow.tsx");
  assert.match(chips, /chipActive: \{ backgroundColor: colors\.primary, borderColor: colors\.primary \}/);
  assert.match(chips, /chipTextActive: \{ color: colors\.primaryContrastText/);
  assert.match(chips, /chip: \{[^}]*backgroundColor: colors\.greenTint/s);
  assert.match(chips, /chipText: \{ fontSize: CHIP_FONT_SIZE, color: colors\.primaryDark \}/);
  // size and padding still come from chipLayout, so the Hindi chip-height tests keep their meaning
  assert.match(chips, /paddingVertical: CHIP_PADDING_VERTICAL/);
  assert.match(chips, /borderWidth: CHIP_BORDER/);
});

test("product and crop cards are tinted; the price is the gold accent (dark text on gold, or deep gold text on light)", () => {
  for (const path of [
    "src/features/store/StoreScreen.tsx",
    "src/features/home/HomeScreen.tsx",
    "src/features/crop-marketplace/CropListingCard.tsx",
    "src/features/recommendations/RecommendationRail.tsx",
  ]) {
    const source = read(path);
    assert.match(source, /card: \{[^}]*backgroundColor: colors\.greenTint/s, path);
    assert.match(source, /card: \{[^}]*borderColor: colors\.greenTintStrong/s, path);
  }
  const pill = read("src/components/PricePill.tsx");
  assert.match(pill, /backgroundColor: colors\.secondary/);
  assert.match(pill, /color: colors\.onGold/);
  assert.match(read("src/features/crop-marketplace/CropListingDetailScreen.tsx"), /price: \{[^}]*color: colors\.secondaryDark/);
  assert.match(read("src/features/store/ProductDetailScreen.tsx"), /price: \{[^}]*color: colors\.secondaryDark/s);
});

// ---- weather -----------------------------------------------------------------------------------------------------

test("Weather: the current-weather and 7-day cards are sky-blue tints with deep-blue or dark text", () => {
  const weather = read("src/features/weather/WeatherScreen.tsx");
  assert.match(weather, /\n  card: \{[^}]*backgroundColor: colors\.blueTint/s);
  assert.match(weather, /trendCard: \{[^}]*backgroundColor: colors\.blueTint/s);
  assert.match(weather, /temperature: \{[^}]*color: accents\.blue\.text/);
  assert.match(weather, /trendTitle: \{[^}]*color: accents\.blue\.text/);
  assert.match(weather, /forecastSummary: \{[^}]*color: colors\.textSecondary/);
  assert.match(weather, /screenTitle: \{[^}]*color: colors\.primaryDark/);
});

// ---- orders ------------------------------------------------------------------------------------------------------

test("every order status the app knows has its own chip colours, and the screens draw them (tinted background, readable text)", async () => {
  const { statusTones } = await import("../src/theme/colors.ts");
  const types = read("src/features/orders/types.ts");
  const union = /export type OrderStatus =([^;]*);/.exec(types)![1];
  const statuses = [...union.matchAll(/"([A-Z_]+)"/g)].map((m) => m[1]);
  assert.ok(statuses.length >= 6);
  for (const status of statuses) assert.ok(status in statusTones, `${status} has no chip colours`);
  // the display module takes them from the theme (and falls back to neutral for a status from a newer server)
  const display = read("src/features/orders/orderStatusDisplay.ts");
  assert.match(display, /statusTones as Record<string, Tone>\)\[status\] \?\? NEUTRAL_TONE/);
  assert.doesNotMatch(display, /colors\.(warning|success|info|error)/);
  // the list chip and the order-page chip use the tone's background, border and text colour
  const history = read("src/features/orders/OrderHistoryScreen.tsx");
  assert.match(history, /borderColor: tone\.border, backgroundColor: tone\.bg/);
  assert.match(history, /color: tone\.fg/);
  const confirmation = read("src/features/orders/OrderConfirmationScreen.tsx");
  assert.match(confirmation, /backgroundColor: statusTone\.bg, borderColor: statusTone\.border/);
  assert.match(confirmation, /color: statusTone\.fg/);
});

// ---- login -------------------------------------------------------------------------------------------------------

test("Login: a green-and-gold branded top area with the logo on a light card, and a clear green primary button", () => {
  const login = read("src/features/auth/LoginScreen.tsx");
  const band = /brandBand: \{([^}]*)\}/.exec(login)![1];
  assert.match(band, /backgroundColor: colors\.primaryDark/);
  assert.match(band, /borderBottomColor: colors\.secondary/);
  assert.match(login, /logoCard: \{[^}]*backgroundColor: colors\.surface/s);
  assert.match(login, /isFocused && <StatusBar style="light" \/>/);
  // still headerless, so it still pads under the status bar
  assert.match(login, /screenTopPadding\(insets\.top\)/);
  // the form can scroll on a small phone now that the band takes room
  assert.match(login, /<ScrollView[^>]*keyboardShouldPersistTaps="handled"/);
  assert.match(login, /\n  button: \{[^}]*backgroundColor: colors\.primary/s);
  assert.match(login, /buttonText: \{[^}]*color: colors\.primaryContrastText/s);
});
