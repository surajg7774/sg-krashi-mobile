// The app's colours, all in one place. Pure (no imports) so tests/theme.test.ts can check contrast under Node.
//
// Brand: the green and the gold of the Srushti Krashi Farm logo. `primary` is the logo's leaf green deepened just enough
// for white text to read on it (5.3:1); `secondary` is the logo's own gold. `primaryDark` is the deep green used for
// headers, with white or gold text on it. Tints (`greenTint`, `goldTint`, `blueTint`, and the accents below) are soft
// backgrounds that carry DARK text or a deep-coloured icon - never white text.
//
// Rule of thumb used everywhere: dark text on a light tint, white text on a deep colour; body text at least 4.5:1,
// large text and icons at least 3:1 (checked in tests/theme.test.ts).
export const colors = {
  // brand greens
  primary: "#357A22",
  primaryLight: "#5FA845",
  primaryDark: "#1B4D2A",
  primaryContrastText: "#FFFFFF",

  // brand gold
  secondary: "#E8B010",
  secondaryLight: "#F6D56B",
  /** Gold dark enough to be TEXT on white or on a gold tint (5.5:1). */
  secondaryDark: "#8A6100",
  /** Dark text for use ON the gold (7:1). */
  onGold: "#3A2A00",

  // surfaces
  background: "#F4F8EF",
  surface: "#FFFFFF",
  white: "#FFFFFF",
  black: "#000000",

  // soft tinted backgrounds
  greenTint: "#E8F3E1",
  greenTintStrong: "#CFE6C3",
  goldTint: "#FFF3CF",
  goldTintStrong: "#FBE29A",
  blueTint: "#DCEEFB",
  blueTintStrong: "#B9DDF5",

  // text
  textPrimary: "#14201A",
  textSecondary: "#4A5750",
  /** Inactive tab icons and labels: clearly grey, still 5:1 on white. */
  tabInactive: "#5F6F65",

  // semantic
  success: "#2E7D32",
  warning: "#ED6C02",
  error: "#D32F2F",
  info: "#0288D1",

  divider: "#E1E3DE",
  grey100: "#F0F1EE",
  grey300: "#C7CAC2",

  /** Behind modals and bottom sheets. */
  scrim: "rgba(0,0,0,0.5)",
};

export type ColorName = keyof typeof colors;

/** A family of related colours: a soft background, a deep colour for icons, and a darker one for text on the tint. */
export interface Accent {
  tint: string;
  /** Icon colour on the tint (3:1 or better). */
  icon: string;
  /** Text colour on the tint (4.5:1 or better). */
  text: string;
}

/** One accent per area of the app, so the home tiles and the menu badges are colourful but consistent. */
export const accents = {
  green: { tint: "#E8F3E1", icon: "#357A22", text: "#1F5A24" },
  teal: { tint: "#DDF3EF", icon: "#00796B", text: "#00695C" },
  blue: { tint: "#E3F0FF", icon: "#1565C0", text: "#0D47A1" },
  gold: { tint: "#FFF3CF", icon: "#8A6100", text: "#7A5500" },
  purple: { tint: "#EEE5F8", icon: "#6A3FA0", text: "#5A2D91" },
  orange: { tint: "#FFE8D6", icon: "#B34F08", text: "#8F3E00" },
  red: { tint: "#FDE7E5", icon: "#C62828", text: "#A61B13" },
} as const satisfies Record<string, Accent>;

export type AccentName = keyof typeof accents;

/** A coloured chip: tinted background, a readable text colour, and a border a shade deeper than the tint. */
export interface Tone {
  bg: string;
  fg: string;
  border: string;
}

/**
 * Order status chips. pending = amber, confirmed = blue, shipped = teal, delivered = green, payment failed = red,
 * refunded = neutral grey. Every `fg` reads at 4.5:1 or better on its `bg`.
 */
export const statusTones = {
  PENDING_PAYMENT: { bg: "#FFF0D6", fg: "#8A4B00", border: "#F2C879" },
  CONFIRMED: { bg: "#E3F0FF", fg: "#0D47A1", border: "#9CC4F2" },
  SHIPPED: { bg: "#DDF3EF", fg: "#00695C", border: "#8FD3C7" },
  DELIVERED: { bg: "#E4F4E1", fg: "#1B5E20", border: "#9CD08F" },
  PAYMENT_FAILED: { bg: "#FDE7E5", fg: "#A61B13", border: "#F0A8A2" },
  REFUNDED: { bg: "#ECEFEA", fg: "#44504A", border: "#C7CAC2" },
} as const satisfies Record<string, Tone>;

/** For a status this build does not know (a newer server): neutral, never alarming. */
export const NEUTRAL_TONE: Tone = statusTones.REFUNDED;
