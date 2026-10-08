// Every vector icon the UI uses, in one place: one family (Ionicons, from @expo/vector-icons), names checked by
// TypeScript, and a test (tests/icons.test.ts) that reads the library's own glyph list. Pure: the names are strings,
// so the file runs under Node; the type-only imports are erased.
//
// Emoji are not used as icons any more (they look different on every phone and cannot take the theme colours). Emoji
// stay only inside content text (the onboarding illustrations, a rating's stars).
import type { ComponentProps } from "react";
import type Ionicons from "@expo/vector-icons/Ionicons";

export type IconName = ComponentProps<typeof Ionicons>["name"];

/** Outline when inactive, filled when active - the usual tab bar convention. */
export interface TabIcon {
  active: IconName;
  inactive: IconName;
}

export const TAB_ICONS = {
  Home: { active: "home", inactive: "home-outline" },
  Store: { active: "storefront", inactive: "storefront-outline" },
  CropDoctor: { active: "leaf", inactive: "leaf-outline" },
  Weather: { active: "partly-sunny", inactive: "partly-sunny-outline" },
  Farmer: { active: "bar-chart", inactive: "bar-chart-outline" },
  Profile: { active: "person", inactive: "person-outline" },
} as const satisfies Record<string, TabIcon>;

export const TAB_ICON_SIZE = 24;

/** Everything else. Outline style throughout, so the screens look like one set. */
export const ICONS = {
  // header buttons
  cart: "cart-outline",
  notifications: "notifications-outline",
  settings: "settings-outline",
  // Home quick links
  store: "storefront-outline",
  cropDoctor: "leaf-outline",
  weather: "partly-sunny-outline",
  mandi: "trending-up-outline",
  assistant: "chatbubbles-outline",
  cropMarketplace: "basket-outline",
  // rows and buttons
  chevron: "chevron-forward",
  privacy: "shield-checkmark-outline",
  terms: "document-text-outline",
  version: "information-circle-outline",
  deleteAccount: "trash-outline",
  eye: "eye-outline",
  eyeOff: "eye-off-outline",
  camera: "camera-outline",
  gallery: "images-outline",
  close: "close",
  // weather location
  locate: "locate-outline",
  locationNow: "location",
  locationPinned: "pin",
  // empty states
  emptyBox: "cube-outline",
  emptyMail: "file-tray-outline",
  emptyMoney: "cash-outline",
} as const satisfies Record<string, IconName>;

export type IconKey = keyof typeof ICONS;
