// Top spacing for screens that draw their own title instead of a navigation header (the Home / Weather / Profile tabs
// and the Login / Register / OTP screens). Pure (no React Native imports) so it is unit-tested with Node
// (tests/screenInsets.test.ts); the screens pass in the safe-area inset they read with useSafeAreaInsets().
//
// With edge-to-edge on Android the app draws under the status bar, so a screen that starts at y = 0 puts its title
// under the clock and battery icons. Screens that have a navigation header do not need this: the header already
// pads itself by the status-bar inset.

/** A little air between the status bar and the first line of a headerless screen. */
export const SCREEN_TOP_EXTRA = 8;

/** The status-bar inset plus `extra` dp. A missing, negative or non-numeric inset counts as 0. */
export const screenTopPadding = (insetTop: number | null | undefined, extra: number = SCREEN_TOP_EXTRA): number =>
  (typeof insetTop === "number" && Number.isFinite(insetTop) && insetTop > 0 ? insetTop : 0) + extra;
