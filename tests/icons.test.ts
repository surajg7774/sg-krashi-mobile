import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { ICONS, TAB_ICONS, TAB_ICON_SIZE } from "../src/theme/icons.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path: string) => readFileSync(join(root, path), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

// ---- the names exist in the library ----------------------------------------------------------------------------

const glyphs = JSON.parse(readFileSync(join(root, "node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json"), "utf8")) as Record<string, number>;

test("every icon name the app uses is a real Ionicons glyph (so nothing renders as a '?' box)", () => {
  const names = [...Object.values(ICONS), ...Object.values(TAB_ICONS).flatMap((tab) => [tab.active, tab.inactive])];
  assert.ok(names.length > 20);
  for (const name of names) assert.ok(name in glyphs, `${name} is not an Ionicons glyph`);
});

// ---- the tab bar -------------------------------------------------------------------------------------------------

test("each tab has an outline icon for inactive and a different, filled one for active", () => {
  for (const [tab, icon] of Object.entries(TAB_ICONS)) {
    assert.notEqual(icon.active, icon.inactive, tab);
    assert.ok(icon.inactive.endsWith("-outline"), `${tab} inactive icon should be an outline: ${icon.inactive}`);
    assert.ok(!icon.active.endsWith("-outline"), `${tab} active icon should be filled: ${icon.active}`);
    assert.equal(icon.inactive, `${icon.active}-outline`, `${tab}: the two states should be the same glyph, filled and outlined`);
  }
  assert.deepEqual(Object.keys(TAB_ICONS).sort(), ["CropDoctor", "Farmer", "Home", "Profile", "Store", "Weather"]);
});

test("the tab bar draws them: size 24, tint tokens from the theme, filled when focused, labels untouched", () => {
  const tabs = read("src/navigation/TabNavigator.tsx");
  assert.equal(TAB_ICON_SIZE, 24);
  assert.match(tabs, /<Ionicons name=\{focused \? icon\.active : icon\.inactive\} size=\{TAB_ICON_SIZE\} color=\{color\} \/>/);
  assert.match(tabs, /tabBarActiveTintColor: colors\.primary/);
  assert.match(tabs, /tabBarInactiveTintColor: colors\.textSecondary/);
  // labels still come from the translated tab titles
  for (const key of ["home", "store", "cropDoctor", "weather", "farmer", "profile"]) assert.match(tabs, new RegExp(`t\\("nav\\.tabs\\.${key}"\\)`));
});

// ---- what was replaced, and what kept its behaviour -------------------------------------------------------------

test("Home cart and bell are vector icons, keep their accessibility labels and the unread badge", () => {
  const home = read("src/features/home/HomeScreen.tsx");
  assert.match(home, /<Ionicons name=\{ICONS\.cart\}/);
  assert.match(home, /<Ionicons name=\{ICONS\.notifications\}/);
  assert.match(home, /accessibilityLabel=\{t\("nav\.headers\.cart"\)\}/);
  assert.match(home, /accessibilityLabel=\{t\("nav\.headers\.notifications"\)\}/);
  assert.match(home, /notificationsQuery\.data\?\.unreadCount/);
  assert.match(home, /cartQuery\.data\?\.itemCount/);
  assert.match(home, /iconButton: \{[^}]*minHeight: 44/s);
});

test("the Profile gear, the menu rows, the password eye and the photo buttons use icons and keep their labels and 44 dp targets", () => {
  const profile = read("src/features/profile/ProfileScreen.tsx");
  assert.match(profile, /<Ionicons name=\{ICONS\.settings\}/);
  assert.match(profile, /accessibilityLabel=\{t\("settings\.open"\)\}/);
  assert.match(profile, /width: 44,\s*height: 44/);
  const settings = read("src/features/settings/SettingsScreen.tsx");
  for (const icon of ["privacy", "terms", "version", "deleteAccount", "chevron"]) assert.match(settings, new RegExp(`ICONS\\.${icon}`));
  assert.doesNotMatch(settings, /›/);
  const password = read("src/components/PasswordField.tsx");
  assert.match(password, /visible \? ICONS\.eyeOff : ICONS\.eye/);
  assert.match(password, /accessibilityLabel=\{t\(visible \? "auth\.login\.hidePassword" : "auth\.login\.showPassword"\)\}/);
  assert.match(password, /toggle: \{[^}]*minWidth: 44[^}]*minHeight: 44/s);
  for (const path of ["src/features/crop-doctor/CropDoctorScreen.tsx", "src/features/farmer/FarmerListingFormScreen.tsx"]) {
    const source = read(path);
    assert.match(source, /<IconLabel icon=\{ICONS\.camera\} label=\{t\("common\.takePhoto"\)\}/, path);
    assert.match(source, /<IconLabel icon=\{ICONS\.gallery\} label=\{t\("common\.addFromGallery"\)\}/, path);
  }
});

test("empty states take an icon name, not an emoji", () => {
  const empty = read("src/components/EmptyState.tsx");
  assert.match(empty, /icon\?: IconName/);
  assert.match(empty, /<Ionicons name=\{icon\}/);
});

// ---- no emoji left as a UI icon ---------------------------------------------------------------------------------

const walk = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(path);
  }
  return out;
};

test("no emoji is used as an icon: the only pictographs left are rating stars, check marks in text, and the onboarding illustrations", () => {
  // Emoji (and star glyphs) that are CONTENT, not controls: a rating's stars, a check mark inside a sentence, and the five
  // large onboarding illustrations.
  const allowed = [/components[\\/]Rating\.tsx$/, /CropReviews\.tsx$/, /cropLogic\.ts$/, /CropListingDetailScreen\.tsx$/, /OnboardingScreen\.tsx$/, /i18n[\\/](en|hi)\.ts$/];
  const offenders: string[] = [];
  for (const file of walk(join(root, "src"))) {
    if (allowed.some((re) => re.test(file))) continue;
    const code = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    code.split("\n").forEach((line, index) => {
      if (/\p{Extended_Pictographic}/u.test(line)) offenders.push(`${file.replace(root, "")}:${index + 1} ${line.trim().slice(0, 90)}`);
    });
  }
  assert.deepEqual(offenders, []);
  // the translated strings no longer carry the camera / gallery emoji
  const dictionaries = read("src/i18n/en.ts") + read("src/i18n/hi.ts");
  assert.doesNotMatch(dictionaries, /📷|🖼/u);
});
