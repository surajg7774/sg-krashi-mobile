// Sizes for the horizontal chip rows (category / state / crop-type filters). Pure (no React Native imports) so the
// numbers are unit-tested with Node (tests/chipLayout.test.ts); the ChipRow component only applies them.
//
// Why this exists: a horizontal list inside a column layout is a ScrollView, and a ScrollView defaults to
// flexGrow 1 / flexShrink 1. Next to a second vertical list (the products grid) the chip row was squeezed to less
// than its content, so the chip text was half hidden and the cards below peeked out under it. The row now refuses to
// shrink (flexShrink 0) AND has a minimum height worked out from the font scale and the language, so it can never be
// smaller than one chip, whatever the system font size or script.
import type { Lang } from "../i18n/index.ts";

export const CHIP_FONT_SIZE = 13;
export const CHIP_PADDING_VERTICAL = 6;
export const CHIP_BORDER = 1;
/** Air above and below the chips inside the row, so their shadow/hit area is not cut by the row's edge. */
export const CHIP_ROW_PADDING_VERTICAL = 4;

/** Line height as a multiple of the font size: Latin text sits comfortably in 1.4, Devanagari vowel signs need 1.6. */
export const chipLineRatio = (lang: Lang): number => (lang === "en" ? 1.4 : 1.6);

const safeScale = (fontScale: number): number => (Number.isFinite(fontScale) && fontScale > 0 ? Math.max(fontScale, 1) : 1);

/** The explicit line height of the chip text for `lang` at the given system font scale (a Text with this never clips). */
export const chipLineHeight = (lang: Lang): number => Math.ceil(CHIP_FONT_SIZE * chipLineRatio(lang));

/** The height of one chip: its (scaled) text line plus the vertical padding and the border. */
export const chipHeight = (fontScale: number, lang: Lang): number =>
  Math.ceil(CHIP_FONT_SIZE * safeScale(fontScale) * chipLineRatio(lang)) + 2 * CHIP_PADDING_VERTICAL + 2 * CHIP_BORDER;

/** The least height the whole row may have: one chip plus the row's own padding. */
export const chipRowMinHeight = (fontScale: number, lang: Lang): number => chipHeight(fontScale, lang) + 2 * CHIP_ROW_PADDING_VERTICAL;
