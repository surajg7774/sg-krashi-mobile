// Hindi text. Same keys as en.ts (the type makes a missing or extra key a compile error).
//
// Wording rules (see docs/I18N_GLOSSARY.md): simple, everyday Devanagari a farmer uses, not word-for-word; keep the
// English word where people really say it (OTP, Order, Cart, Login, Email); same word for the same thing everywhere.
import type { Messages } from "./en.ts";

export const hi: Messages = {
  common: {
    retry: "फिर से कोशिश करें",
    cancel: "रद्द करें",
    remove: "हटाएं",
    save: "सेव करें",
    next: "आगे",
    previous: "पिछला",
    total: "कुल",
    loading: "लोड हो रहा है…",
    itemCount: { one: "{count} आइटम", other: "{count} आइटम" },
  },
  language: {
    title: "भाषा",
    english: "English",
    hindi: "हिन्दी",
    switchTo: "ऐप की भाषा बदलें",
    selected: "{language}, चुनी गई",
  },
  errors: {
    network: "इंटरनेट कनेक्शन नहीं है। कृपया कनेक्शन जांचें और फिर से कोशिश करें।",
  },
};
