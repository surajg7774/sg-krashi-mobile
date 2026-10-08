# Hindi (i18n) decisions

Decisions taken while adding Hindi to the mobile app (branch `feat/hindi-i18n`, roadmap item 8). The job ran without
anyone to ask, so each decision below takes the more conservative option and gives the reason. Anything that really
needs the owner's call is listed under **Open questions** at the end.

## Scope

- **D1 - Only the app's own static text is translated.** This covers labels, buttons, placeholders, empty states, the
  app's own error and validation messages, alerts, banners, tab and header titles, and screen-reader labels.
  - **Not translated (server data):** product and crop names, categories, descriptions, reviews, user names, order
    data, notification titles and messages, chat replies, AI scan results, mandi commodity, market and state names,
    place names from the weather search, and payout data.
- **D2 - Server error messages stay as the server sends them (English).** They are server data. The app's own fallback
  messages (shown when the server gives none) are translated. The one exception is a network failure: the text there
  comes from the HTTP library ("Network Error", "timeout of 15000ms exceeded"), not from the server. In Hindi that case
  shows a Hindi "no connection" message; English is unchanged.
- **D3 - Brand names and units stay as they are.** "SG Krashi", "Google", "Razorpay", "Agmarknet", "₹", "°C", "mm" and
  "PDF" are unchanged.
- **D4 - Legal text stays in English.** The Privacy Policy and Terms pages are web pages; only the link labels that open
  them are translated. *TODO:* a Hindi version of the legal pages needs a reviewed translation and is out of scope.
- **D5 - Developer diagnostics never reach the screen.** The Google sign-in setup hints (DEVELOPER_ERROR, Cloud Console
  test users, SHA-1) used to be appended to a red message. They are now only logged, and only in development builds
  (`__DEV__`); see D17. The people who use the app see translated text or nothing.
- **D6 - Language names in the Crop Doctor "report language" list stay as they are.** Each is already written in its
  own script ("हिन्दी (Hindi)", "मराठी (Marathi)"). That list controls the AI report's language, not the app's
  language. It is a separate setting, as on the website.

## Language state

- **D7 - Storage key `sgkrashi.language`.** This is the same name the website uses for its own language choice, which
  keeps the two consistent. The stored value is exactly "en" or "hi"; anything else is ignored.
- **D8 - Default language.**
  - If nothing is stored: Hindi when the device locale starts with "hi", otherwise English.
  - The device locale is read with `Intl.DateTimeFormat().resolvedOptions().locale` inside try/catch. Any failure
    means English.
  - Once the person picks a language, that choice always wins.
- **D9 - The language belongs to the device, not the account.** Logout, account deletion and forced logout leave the
  language untouched, like the onboarding flag. A test locks this in.
- **D10 - Startup is not delayed.** The stored choice is read as soon as the i18n module loads, before the first render.
  That read runs alongside the offline-cache restore, which already holds the first screen back. The app renders with
  the best language known at that moment and never waits for storage. If storage were slower than the cache restore,
  the text would switch language once, right after start; nothing blocks.

## Implementation

- **D11 - No new library.** There is a small typed layer in `src/i18n`:
  - Keys are typed from `en.ts`, so a key missing in `hi.ts` (or an extra one) is a type error.
  - `{name}` placeholders are supported.
  - Plurals are `{ one, other }` objects, chosen by hand-written rules: English "one" is exactly 1; Hindi "one" is 0
    or 1, which is the CLDR rule. Hermes has no `Intl.PluralRules`, so the rules are not taken from Intl.
- **D12 - Dates and numbers.**
  - Month and weekday names come from `src/i18n/format.ts`. Hermes's Intl date support varies by Android version, and
    the app already wrote its own month names, so it keeps doing that.
  - Digits stay 0-9 in Hindi, as they appear in Indian apps, prices and receipts.
  - Times stay 12-hour with AM/PM in both languages.
  - Rupee grouping is unchanged (₹1,50,000).
- **D13 - Pure modules take the language as a parameter, defaulting to English.** Examples are `cropLogic`,
  `screenState` and `orderTimelineSteps`. Their unit tests keep checking the exact English output, and new tests check
  the Hindi output.
- **D14 - A language switch in two places.** The required one is on the Settings screen (opened from the gear on Profile). A small one is also on the
  Login screen, because someone who is not signed in cannot reach Profile. Without it, a Hindi reader with an
  English-locale phone could not switch before signing in. Each label is in its own script: "English", "हिन्दी".

- **D15 - Crop Doctor report language follows Hindi.**
  - When the app is in Hindi, the Crop Doctor "Report language" starts as Hindi instead of English. Without this, a
    Hindi reader would get an English AI report unless they noticed the setting.
  - The person can still pick any language.
  - In English nothing changes: the default is still "en".
  - The AI's report text itself is server data and is not translated by the app.
- **D16 - Server codes shown as words.**
  - Some screens showed a raw server code: health "HEALTHY", role "FARMER".
  - In Hindi these are named ("स्वस्थ", "किसान").
  - English keeps showing the code exactly as before.
  - A code the app does not know is shown as sent.

- **D17 - Google sign-in messages.**
  - `src/features/auth/googleErrors.ts` maps every failure to one of: nothing (the person cancelled, or another
    sign-in is already running), "Couldn't reach Google..." (network, timeout), "Google Play services is missing or
    out of date...", or "Google sign-in didn't work. Please try again or log in with your email.".
  - Cancelling the account picker shows **nothing** (my choice over a grey "cancelled" line). It is not an error, and
    a neutral line would add UI state to Login and Register for no benefit. The old "check Test users" hint for a
    "cancelled" answer is logged under `__DEV__` only, so a wrongly configured build is still easy to spot.
  - Server wording is not shown for Google failures (it could be English); the generic message is used instead.
  - Login, Register and the account-deletion Google step share this mapping.
- **D18 - Settings screen.** Language, Privacy Policy, Terms, app version and Delete account live on a Settings screen
  (gear at the top right of Profile). Profile keeps the person's name, email, role, Notifications, My Orders and Log out.
  Delete account sits alone in a "danger" section at the bottom; its confirmation flow is unchanged.

## Open questions

- **Q1 - Server error messages.** Should the server send translated messages, or should the app map known error codes
  (for example INVALID_CREDENTIALS) to Hindi text? Today a Hindi reader sees the server's English message in those
  cases. This needs a server or contract decision, so it is not done here.
- **Q2 - Legal pages in Hindi.** Should the Privacy Policy and Terms get reviewed Hindi versions?
