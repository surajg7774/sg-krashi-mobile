// English text for the whole app: the source of truth for every key. hi.ts must have exactly the same keys (a missing
// or extra key is a type error there).
//
// Rules for this file:
// - Placeholders are {name}; fill them through t("group.key", { name }).
// - A plural is an object with exactly `one` and `other` (pass `count` to t). Never use those two words as group names.
// - Group by feature; reuse `common` only for words that mean the same thing everywhere (Retry, Cancel, ...).
// - Server data (names, descriptions, reviews, order data, notifications) never goes here - it is shown as sent.

export interface PluralForms {
  readonly one: string;
  readonly other: string;
}

export const en = {
  common: {
    retry: "Retry",
    cancel: "Cancel",
    remove: "Remove",
    save: "Save",
    next: "Next",
    previous: "Previous",
    total: "Total",
    loading: "Loading…",
    itemCount: { one: "{count} item", other: "{count} items" },
  },
  language: {
    title: "Language",
    english: "English",
    hindi: "हिन्दी",
    switchTo: "Change app language",
    selected: "{language}, selected",
  },
  errors: {
    network: "No internet connection. Please check your connection and try again.",
  },
} as const;

type Widen<T> = T extends string ? string : T extends PluralForms ? PluralForms : { readonly [K in keyof T]: Widen<T[K]> };

/** The shape every language must provide: the same keys as English, any wording. */
export type Messages = Widen<typeof en>;
