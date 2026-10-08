// Room for Devanagari. Its vowel signs sit above and below the letters (कि, की, कु, के), so a line needs more height
// than Latin text of the same size. When a Text sets an explicit lineHeight sized for English, Android can clip
// those signs. These helpers keep every English lineHeight exactly as it is and only raise it for Devanagari.
// Pure, so it is unit-tested with Node (tests/i18n.test.ts).
import type { Lang } from "./index.ts";

/** Smallest line height, as a multiple of the font size, that leaves room for Devanagari vowel signs. */
export const DEVANAGARI_LINE_HEIGHT_RATIO = 1.6;

const DEVANAGARI = /[ऀ-ॿ]/;

const roomy = (fontSize: number, englishLineHeight: number): number =>
  Math.max(englishLineHeight, Math.ceil(fontSize * DEVANAGARI_LINE_HEIGHT_RATIO));

/** For app text: the English lineHeight in English, a roomier one in Hindi. */
export const scriptLineHeight = (lang: Lang, fontSize: number, englishLineHeight: number): number =>
  lang === "en" ? englishLineHeight : roomy(fontSize, englishLineHeight);

/** For server or AI text, whose language is not the app's: roomier only when the text itself has Devanagari. */
export const contentLineHeight = (text: string, fontSize: number, englishLineHeight: number): number =>
  DEVANAGARI.test(text) ? roomy(fontSize, englishLineHeight) : englishLineHeight;
