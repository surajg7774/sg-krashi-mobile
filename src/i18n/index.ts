// The app's small i18n core: languages, typed keys, lookup with English fallback, {name} interpolation, plurals and
// the language state (stored choice, device default). Pure - no React Native imports, storage is passed in - so it
// is unit-tested with Node (tests/i18n.test.ts). The React side is I18nProvider.tsx + useT.ts.
import { LANGUAGE_KEY } from "../shared/storageKeys.ts";
import { en, type PluralForms } from "./en.ts";
import { hi } from "./hi.ts";

export type Lang = "en" | "hi";
export const LANGUAGES: readonly Lang[] = ["en", "hi"];

type Leaf = string | PluralForms;
type KeysOf<T> = {
  [K in keyof T & string]: T[K] extends Leaf ? K : `${K}.${KeysOf<T[K]>}`;
}[keyof T & string];

/** Every translatable key, e.g. "common.retry". Typed from en.ts, so a typo is a compile error. */
export type MessageKey = KeysOf<typeof en>;
export type MessageParams = Record<string, string | number>;
export type TFunction = (key: MessageKey, params?: MessageParams) => string;

/** A dictionary tree: groups of groups, ending in strings or plural objects. */
export interface Dictionary {
  readonly [key: string]: Leaf | Dictionary;
}

export const MESSAGES: Record<Lang, Dictionary> = { en, hi };

const isPlural = (value: unknown): value is PluralForms =>
  typeof value === "object" && value !== null && typeof (value as PluralForms).one === "string" && typeof (value as PluralForms).other === "string";

/** The CLDR plural category for a count. English: "one" only for exactly 1. Hindi: "one" for 0 and 1 (and 0.x). */
export const pluralCategory = (lang: Lang, count: number): "one" | "other" => {
  if (!Number.isFinite(count)) return "other";
  if (lang === "hi") return Math.trunc(Math.abs(count)) === 0 || count === 1 ? "one" : "other";
  return count === 1 ? "one" : "other";
};

/** Replaces {name} with params.name. A placeholder with no value is left as written, so a mistake is visible. */
export const interpolate = (template: string, params?: MessageParams): string =>
  params ? template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match)) : template;

const lookup = (dict: Dictionary | undefined, key: string): Leaf | undefined => {
  let node: Leaf | Dictionary | undefined = dict;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null || isPlural(node)) return undefined;
    node = (node as Dictionary)[part];
  }
  return typeof node === "string" || isPlural(node) ? node : undefined;
};

/**
 * Looks a key up in `lang`, falling back to English when the key is missing or empty there, and to the key itself if
 * even English lacks it (never throws, never shows nothing). Exported with the dictionaries as a parameter for tests.
 */
export const translateWith = (dicts: Partial<Record<Lang, Dictionary>>, lang: Lang, key: string, params?: MessageParams): string => {
  let used: Lang = lang;
  let value = lookup(dicts[lang], key);
  if (value === undefined || value === "" || (isPlural(value) && (value.one === "" || value.other === ""))) {
    used = "en";
    value = lookup(dicts.en, key);
  }
  if (value === undefined) return key;
  const text = isPlural(value) ? value[pluralCategory(used, Number(params?.count))] : value;
  return interpolate(text, params);
};

export const translate = (lang: Lang, key: MessageKey, params?: MessageParams): string => translateWith(MESSAGES, lang, key, params);

/** A t() bound to one language. */
export const makeT = (lang: Lang): TFunction => (key, params) => translate(lang, key, params);

// ---- language state ------------------------------------------------------------------------------------------

export const parseStoredLanguage = (value: unknown): Lang | null => (value === "en" || value === "hi" ? value : null);

/** Hindi when the device locale is Hindi ("hi", "hi-IN", "HI_in"), otherwise English. */
export const languageFromLocale = (locale: string | null | undefined): Lang =>
  typeof locale === "string" && /^hi([-_]|$)/i.test(locale.trim()) ? "hi" : "en";

/** The device locale, or null if the engine cannot say (no Intl, or Intl throws). */
export const readDeviceLocale = (): string | null => {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    return typeof locale === "string" && locale !== "" ? locale : null;
  } catch {
    return null;
  }
};

export interface LanguageStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
}

export interface LanguageStore {
  getLanguage: () => Lang;
  /** Saves the person's choice; it wins over the device default from now on. The screen switches at once. */
  setLanguage: (lang: Lang) => Promise<void>;
  subscribe: (listener: () => void) => () => void;
  /** Settles once the stored choice has been read (or the read failed). Never rejects. */
  ready: Promise<void>;
}

/**
 * Starts from the device default, then reads the stored choice in the background. Rendering never waits for it: if
 * the read finishes after the first render, the text switches once. A choice made before the read finishes wins.
 */
export const createLanguageStore = (deps: { storage: LanguageStorage; deviceLocale: string | null }): LanguageStore => {
  let lang: Lang = languageFromLocale(deps.deviceLocale);
  let chosenThisSession = false;
  const listeners = new Set<() => void>();
  const notify = () =>
    listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // One broken listener must not stop the others.
      }
    });
  const apply = (next: Lang) => {
    if (next === lang) return;
    lang = next;
    notify();
  };

  const ready = (async () => {
    try {
      const stored = parseStoredLanguage(await deps.storage.getItem(LANGUAGE_KEY));
      if (stored && !chosenThisSession) apply(stored);
    } catch {
      // Storage unavailable: keep the device default.
    }
  })();

  return {
    getLanguage: () => lang,
    setLanguage: async (next) => {
      if (parseStoredLanguage(next) === null) return;
      chosenThisSession = true;
      apply(next);
      try {
        await deps.storage.setItem(LANGUAGE_KEY, next);
      } catch {
        // Not saved: the switch still applies until the app is closed.
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    ready,
  };
};
