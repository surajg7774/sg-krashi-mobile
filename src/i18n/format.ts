// Dates and times in the app's language. Pure (no Intl dates: Hermes's support differs between Android versions, and
// the app has always written its own month names), so it is unit-tested with Node (tests/i18n.test.ts).
// Digits stay 0-9 and times stay 12-hour with AM/PM in both languages (docs/I18N_DECISIONS.md, D12).
import type { Lang } from "./index.ts";

const MONTHS: Record<Lang, readonly string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  // Full names: they are short in Hindi and every reader knows them; abbreviations like "सित॰" are not everyday text.
  hi: ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"],
};

const WEEKDAYS: Record<Lang, readonly string[]> = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  hi: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"],
};

/** Month name for a 0-based month index ("Oct" / "अक्टूबर"); "" when out of range. */
export const monthName = (monthIndex: number, lang: Lang = "en"): string => MONTHS[lang][monthIndex] ?? "";

/** Short weekday name for a 0-based day (0 = Sunday): "Mon" / "सोम"; "" when out of range. */
export const weekdayShort = (dayIndex: number, lang: Lang = "en"): string => WEEKDAYS[lang][dayIndex] ?? "";

/** "5 Oct 2026" / "5 अक्टूबर 2026" (year optional). */
export const formatDayMonth = (day: number, monthIndex: number, year: number | null, lang: Lang = "en"): string =>
  `${day} ${monthName(monthIndex, lang)}${year === null ? "" : ` ${year}`}`;

/**
 * A moment with date and time. English keeps exactly what the app always showed (the engine's toLocaleString, which
 * follows the phone's own settings); Hindi gets "8 अक्टूबर 2026, 3:42 PM" so the month is in Hindi whatever the phone's
 * region format is.
 */
export const formatDateTime = (date: Date, lang: Lang = "en"): string =>
  lang === "en" ? date.toLocaleString() : `${formatDayMonth(date.getDate(), date.getMonth(), date.getFullYear(), lang)}, ${formatClock(date)}`;

/** A calendar date: English keeps the engine's toLocaleDateString exactly; Hindi gets "8 अक्टूबर 2026". */
export const formatDate = (date: Date, lang: Lang = "en"): string =>
  lang === "en" ? date.toLocaleDateString() : formatDayMonth(date.getDate(), date.getMonth(), date.getFullYear(), lang);

/** "3:42 PM" - the same in both languages. */
export const formatClock = (date: Date): string => {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours % 12 === 0 ? 12 : hours % 12}:${minutes} ${hours < 12 ? "AM" : "PM"}`;
};
