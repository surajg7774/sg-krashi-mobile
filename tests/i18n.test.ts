import assert from "node:assert/strict";
import { test } from "node:test";
import { en } from "../src/i18n/en.ts";
import { hi } from "../src/i18n/hi.ts";
import {
  createLanguageStore,
  interpolate,
  languageFromLocale,
  makeT,
  parseStoredLanguage,
  pluralCategory,
  readDeviceLocale,
  splitTemplate,
  translate,
  translateWith,
  type Dictionary,
  type LanguageStorage,
} from "../src/i18n/index.ts";
import { formatClock, formatDate, formatDayMonth, monthName, weekdayShort } from "../src/i18n/format.ts";
import { errorText } from "../src/i18n/errorText.ts";
import { LANGUAGE_KEY } from "../src/shared/storageKeys.ts";
import { isPrivateCacheKey, PUBLIC_CACHE_KEY } from "../src/offline/scoping.ts";

// ---- dictionaries -----------------------------------------------------------------------------------------------

type Leaf = string | { one: string; other: string };
const leaves = (node: unknown, prefix = ""): Map<string, Leaf> => {
  const out = new Map<string, Leaf>();
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out.set(path, value);
    else if (value && typeof value === "object" && "one" in value && "other" in value) out.set(path, value as Leaf);
    else for (const [k, v] of leaves(value, path)) out.set(k, v);
  }
  return out;
};
const placeholders = (leaf: Leaf): string[] => {
  const texts = typeof leaf === "string" ? [leaf] : [leaf.one, leaf.other];
  return [...new Set(texts.flatMap((t) => [...t.matchAll(/\{(\w+)\}/g)].map((m) => m[1])))].sort();
};

test("English and Hindi have exactly the same keys, and plurals are plurals in both", () => {
  const enLeaves = leaves(en);
  const hiLeaves = leaves(hi);
  assert.deepEqual([...hiLeaves.keys()].sort(), [...enLeaves.keys()].sort());
  for (const [key, value] of enLeaves) assert.equal(typeof hiLeaves.get(key), typeof value, `plural shape differs: ${key}`);
  assert.ok(enLeaves.size > 0);
});

test("every Hindi text uses the same {placeholders} as the English one, and none is empty", () => {
  const hiLeaves = leaves(hi);
  for (const [key, value] of leaves(en)) {
    const hiValue = hiLeaves.get(key)!;
    assert.deepEqual(placeholders(hiValue), placeholders(value), `placeholders differ: ${key}`);
    const texts = typeof hiValue === "string" ? [hiValue] : [hiValue.one, hiValue.other];
    for (const text of texts) assert.ok(text.trim() !== "", `empty Hindi text: ${key}`);
  }
});

// ---- lookup, interpolation, plurals, fallback -------------------------------------------------------------------

test("a key is looked up in the chosen language", () => {
  assert.equal(translate("en", "common.retry"), "Retry");
  assert.equal(translate("hi", "common.retry"), hi.common.retry);
  assert.equal(makeT("hi")("language.title"), "भाषा");
});

test("{name} placeholders are filled; a missing value is left visible; text without params is untouched", () => {
  assert.equal(interpolate("Hello {name}, {count} new", { name: "Ravi", count: 3 }), "Hello Ravi, 3 new");
  assert.equal(interpolate("Hello {name}", {}), "Hello {name}");
  assert.equal(interpolate("Price {x} {x}", { x: "₹5" }), "Price ₹5 ₹5");
  assert.equal(interpolate("No params here {name}"), "No params here {name}");
  assert.equal(translate("en", "auth.otp.resendIn", { seconds: 30 }), "Resend in 30s");
  assert.equal(translate("hi", "auth.otp.resendIn", { seconds: 30 }), "30 सेकंड में दोबारा भेजें");
});

test("plural rules: English 'one' is exactly 1; Hindi 'one' is 0 and 1", () => {
  assert.equal(pluralCategory("en", 1), "one");
  assert.equal(pluralCategory("en", 0), "other");
  assert.equal(pluralCategory("en", 2), "other");
  assert.equal(pluralCategory("en", 1.5), "other");
  assert.equal(pluralCategory("hi", 0), "one");
  assert.equal(pluralCategory("hi", 1), "one");
  assert.equal(pluralCategory("hi", 0.5), "one");
  assert.equal(pluralCategory("hi", 2), "other");
  assert.equal(pluralCategory("hi", 11), "other");
  assert.equal(pluralCategory("en", Number.NaN), "other");
  assert.equal(translate("en", "common.itemCount", { count: 1 }), "1 item");
  assert.equal(translate("en", "common.itemCount", { count: 3 }), "3 items");
  assert.equal(translate("en", "common.itemCount", { count: 0 }), "0 items");
  assert.equal(translate("hi", "common.itemCount", { count: 3 }), "3 आइटम");
  // No count at all: the "other" form, never a crash.
  assert.equal(translate("en", "common.itemCount"), "{count} items");
});

test("a key missing (or empty) in Hindi falls back to English; a key missing everywhere shows the key", () => {
  const dicts: Record<"en" | "hi", Dictionary> = {
    en: { a: { b: "English B", n: { one: "{count} thing", other: "{count} things" } }, only: "English only", blank: "English blank" },
    hi: { a: { b: "हिंदी B" }, blank: "" },
  };
  assert.equal(translateWith(dicts, "hi", "a.b"), "हिंदी B");
  assert.equal(translateWith(dicts, "hi", "only"), "English only");
  assert.equal(translateWith(dicts, "hi", "blank"), "English blank");
  // Fallback plurals use the English rule (0 is "other" in English).
  assert.equal(translateWith(dicts, "hi", "a.n", { count: 0 }), "0 things");
  assert.equal(translateWith(dicts, "hi", "nope.never"), "nope.never");
  assert.equal(translateWith(dicts, "en", "a"), "a");
  assert.equal(translateWith(dicts, "en", "a.b.c"), "a.b.c");
});

// ---- language state ---------------------------------------------------------------------------------------------

const memoryStorage = (initial: Record<string, string> = {}, opts: { getFails?: boolean; setFails?: boolean; delayMs?: number } = {}) => {
  const data = { ...initial };
  const storage: LanguageStorage & { data: Record<string, string> } = {
    data,
    getItem: async (key) => {
      if (opts.delayMs) await new Promise((r) => setTimeout(r, opts.delayMs));
      if (opts.getFails) throw new Error("storage unavailable");
      return key in data ? data[key] : null;
    },
    setItem: async (key, value) => {
      if (opts.setFails) throw new Error("storage unavailable");
      data[key] = value;
    },
  };
  return storage;
};

test("the device locale decides the default: Hindi only for hi*, English for everything else", () => {
  assert.equal(languageFromLocale("hi-IN"), "hi");
  assert.equal(languageFromLocale("hi"), "hi");
  assert.equal(languageFromLocale("HI_in"), "hi");
  assert.equal(languageFromLocale("en-IN"), "en");
  assert.equal(languageFromLocale("mr-IN"), "en");
  assert.equal(languageFromLocale("his"), "en");
  assert.equal(languageFromLocale(""), "en");
  assert.equal(languageFromLocale(null), "en");
  assert.equal(languageFromLocale(undefined), "en");
});

test("reading the device locale never throws, even without a working Intl", () => {
  assert.equal(typeof readDeviceLocale(), "string");
  const original = globalThis.Intl;
  try {
    (globalThis as { Intl: unknown }).Intl = undefined;
    assert.equal(readDeviceLocale(), null);
    (globalThis as { Intl: unknown }).Intl = {
      DateTimeFormat: () => {
        throw new Error("no ICU");
      },
    };
    assert.equal(readDeviceLocale(), null);
  } finally {
    (globalThis as { Intl: unknown }).Intl = original;
  }
});

test("only 'en' and 'hi' are accepted from storage", () => {
  assert.equal(parseStoredLanguage("hi"), "hi");
  assert.equal(parseStoredLanguage("en"), "en");
  assert.equal(parseStoredLanguage("HI"), null);
  assert.equal(parseStoredLanguage("fr"), null);
  assert.equal(parseStoredLanguage(null), null);
  assert.equal(parseStoredLanguage('"hi"'), null);
});

test("the choice is saved under the language key and wins over the device default on the next start", async () => {
  const storage = memoryStorage();
  const first = createLanguageStore({ storage, deviceLocale: "en-US" });
  await first.ready;
  assert.equal(first.getLanguage(), "en");
  await first.setLanguage("hi");
  assert.equal(first.getLanguage(), "hi");
  assert.equal(storage.data[LANGUAGE_KEY], "hi");

  const restarted = createLanguageStore({ storage, deviceLocale: "en-US" });
  assert.equal(restarted.getLanguage(), "en"); // device default until the stored value is read
  await restarted.ready;
  assert.equal(restarted.getLanguage(), "hi");

  // And the other way round: an English choice on a Hindi phone stays English.
  const storage2 = memoryStorage({ [LANGUAGE_KEY]: "en" });
  const hindiPhone = createLanguageStore({ storage: storage2, deviceLocale: "hi-IN" });
  assert.equal(hindiPhone.getLanguage(), "hi");
  await hindiPhone.ready;
  assert.equal(hindiPhone.getLanguage(), "en");
});

test("the offline cache's clean-up can never pick up the language key", () => {
  assert.equal(isPrivateCacheKey(LANGUAGE_KEY), false);
  assert.notEqual(LANGUAGE_KEY, PUBLIC_CACHE_KEY);
});

test("with nothing stored, the device default stays; a junk stored value is ignored", async () => {
  const hindi = createLanguageStore({ storage: memoryStorage(), deviceLocale: "hi-IN" });
  await hindi.ready;
  assert.equal(hindi.getLanguage(), "hi");
  const junk = createLanguageStore({ storage: memoryStorage({ [LANGUAGE_KEY]: "fr" }), deviceLocale: "en-GB" });
  await junk.ready;
  assert.equal(junk.getLanguage(), "en");
});

test("a choice made before the stored value is read is not overwritten by it", async () => {
  const storage = memoryStorage({ [LANGUAGE_KEY]: "en" }, { delayMs: 20 });
  const store = createLanguageStore({ storage, deviceLocale: "en-US" });
  await store.setLanguage("hi");
  await store.ready;
  assert.equal(store.getLanguage(), "hi");
});

test("broken storage never breaks the language: reads keep the default, writes still switch the screen", async () => {
  const unreadable = createLanguageStore({ storage: memoryStorage({}, { getFails: true }), deviceLocale: "hi-IN" });
  await unreadable.ready;
  assert.equal(unreadable.getLanguage(), "hi");
  const unwritable = createLanguageStore({ storage: memoryStorage({}, { setFails: true }), deviceLocale: "en-US" });
  await unwritable.setLanguage("hi");
  assert.equal(unwritable.getLanguage(), "hi");
  await unwritable.setLanguage("xx" as "en");
  assert.equal(unwritable.getLanguage(), "hi");
});

test("listeners hear each real change once, and can unsubscribe", async () => {
  const store = createLanguageStore({ storage: memoryStorage(), deviceLocale: "en-US" });
  await store.ready;
  let calls = 0;
  const unsubscribe = store.subscribe(() => {
    calls++;
  });
  await store.setLanguage("hi");
  await store.setLanguage("hi");
  assert.equal(calls, 1);
  unsubscribe();
  await store.setLanguage("en");
  assert.equal(calls, 1);
});

// ---- dates ------------------------------------------------------------------------------------------------------

test("month and weekday names in both languages, and out-of-range indexes give empty text", () => {
  assert.equal(monthName(9), "Oct");
  assert.equal(monthName(9, "hi"), "अक्टूबर");
  assert.equal(monthName(12, "hi"), "");
  assert.equal(weekdayShort(1), "Mon");
  assert.equal(weekdayShort(1, "hi"), "सोम");
  assert.equal(weekdayShort(-1), "");
  assert.equal(formatDayMonth(5, 9, 2026), "5 Oct 2026");
  assert.equal(formatDayMonth(5, 9, 2026, "hi"), "5 अक्टूबर 2026");
  assert.equal(formatDayMonth(5, 9, null, "hi"), "5 अक्टूबर");
});

test("clock time is 12-hour with AM/PM", () => {
  assert.equal(formatClock(new Date(2026, 9, 5, 15, 42)), "3:42 PM");
  assert.equal(formatClock(new Date(2026, 9, 5, 0, 5)), "12:05 AM");
  assert.equal(formatClock(new Date(2026, 9, 5, 12, 0)), "12:00 PM");
});

// ---- rich templates and request errors --------------------------------------------------------------------------

test("a template splits into text and placeholder parts, in the language's own order", () => {
  assert.deepEqual(splitTemplate("By signing up you agree to the {terms} and {privacy}."), [
    "By signing up you agree to the ",
    { name: "terms" },
    " and ",
    { name: "privacy" },
    ".",
  ]);
  assert.deepEqual(splitTemplate("{a}{b}"), [{ name: "a" }, { name: "b" }]);
  assert.deepEqual(splitTemplate("plain"), ["plain"]);
  assert.deepEqual(splitTemplate(""), []);
  // The English consent sentence reads exactly as before once the links are put back.
  const english = splitTemplate(translate("en", "auth.register.consent"))
    .map((part) => (typeof part === "string" ? part : part.name === "terms" ? "Terms" : "Privacy Policy"))
    .join("");
  assert.equal(english, "By signing up you agree to the Terms and Privacy Policy.");
  const hindi = splitTemplate(translate("hi", "auth.register.consent"));
  assert.ok(hindi.some((p) => typeof p !== "string" && p.name === "terms"));
  assert.ok(hindi.some((p) => typeof p !== "string" && p.name === "privacy"));
});

test("request errors: server details, then server message, then the fallback - unchanged in English", () => {
  const en = { lang: "en" as const, networkText: "NET" };
  const hiCtx = { lang: "hi" as const, networkText: "नेट" };
  const withDetails = { code: "VALIDATION", message: "Request validation failed", details: ["email: bad", "name: blank"] };
  assert.equal(errorText(withDetails, "fallback", en), "email: bad\nname: blank");
  assert.equal(errorText(withDetails, "fallback", en, { details: false }), "Request validation failed");
  assert.equal(errorText({ code: "X", message: "", details: [] }, "fallback", en), "fallback");
  assert.equal(errorText(null, "fallback", en), "fallback");
  assert.equal(errorText("boom", "fallback", en), "fallback");
  // Server text is server data: shown as sent in Hindi too.
  assert.equal(errorText(withDetails, "fallback", hiCtx), "email: bad\nname: blank");
  // A network failure: English keeps the library text exactly as before; Hindi gets the Hindi sentence.
  const network = { code: "NETWORK_ERROR", message: "Network Error", details: [] };
  assert.equal(errorText(network, "fallback", en), "Network Error");
  assert.equal(errorText(network, "fallback", hiCtx), "नेट");
});

test("a calendar date: English is the engine's toLocaleDateString (unchanged); Hindi spells the month in Hindi", () => {
  const date = new Date(2026, 9, 8, 15, 42);
  assert.equal(formatDate(date), date.toLocaleDateString());
  assert.equal(formatDate(date, "hi"), "8 अक्टूबर 2026");
});
