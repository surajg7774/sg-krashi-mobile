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
