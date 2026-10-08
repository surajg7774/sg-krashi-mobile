# Hindi glossary

One word for one thing, everywhere in the app. If you change a word here, change it in `src/i18n/hi.ts` too (search
for the Hindi word). Tone: simple, everyday Hindi a farmer uses, polite "आप" form, not word-for-word English.

## Kept in English (written in English letters, because that is what people say and read on their phones)

| English | Why it stays |
|---|---|
| SG Krashi | Brand name |
| Google, Razorpay, Agmarknet | Names of other companies / the data source |
| PDF | Everyday word |
| AI | Used with Hindi words: "AI सहायक", "AI फसल डॉक्टर" |
| Slug | A technical field name on the listing form (labelled "Slug (ज़रूरी नहीं)") |
| mm, °C, ₹ | Units and currency are unchanged in every language |
| YYYY-MM-DD | The date pattern the filters expect |

## Kept as the common English word, written in Devanagari (it is how people say it)

| English | Hindi as written | Notes |
|---|---|---|
| Order | ऑर्डर | "ऑर्डर करें" = place an order |
| Cart | कार्ट | |
| Checkout | चेकआउट | |
| Login / Log in | लॉग इन | "लॉग आउट" for log out |
| Sign up | साइन अप | |
| OTP | OTP | Written in Latin letters: it is printed that way in the SMS/email |
| Email | ईमेल | |
| Password | पासवर्ड | |
| Notification | सूचना | The website uses this too |
| Store | स्टोर | |
| Filter | फ़िल्टर | |
| Offline | ऑफ़लाइन | |
| Refund | रिफ़ंड | |
| Verify | वेरिफ़ाई | |
| Pincode | पिनकोड | |
| Dashboard | डैशबोर्ड | |
| Commission | कमीशन | |
| Listing | लिस्टिंग | The website uses this; farmers know it |
| Stock | स्टॉक | "स्टॉक खत्म" = sold out / out of stock |

## Translated

| English | Hindi | Where it is used |
|---|---|---|
| Crop Marketplace | फसल बाजार | Same as the website |
| Crop Doctor / AI Crop Doctor | फसल डॉक्टर / AI फसल डॉक्टर | The website says "एआई फसल चिकित्सक"; the app uses the shorter "AI फसल डॉक्टर" because tab labels are tiny |
| Mandi Prices | मंडी भाव | Same as the website |
| Weather | मौसम | |
| AI Assistant | AI सहायक | |
| Profile | प्रोफ़ाइल | |
| My Orders | मेरे ऑर्डर | |
| Sold Out | स्टॉक खत्म | Used for both crops and products |
| Available | उपलब्ध | |
| Add to Cart | कार्ट में जोड़ें | |
| Organic Certified | जैविक प्रमाणित | Same as the website |
| Harvest Date | कटाई की तारीख | Same as the website |
| Price Range | कीमत की सीमा | |
| Retry | फिर से कोशिश करें | On error boxes. On the small offline banner button: "फिर देखें" |
| Cancel | रद्द करें | |
| Remove | हटाएं | |
| Delete (account) | हटाएं | "खाता हटाएं" |
| Pay Now | अभी भुगतान करें | |
| Payment | भुगतान | |
| Pending Payment | भुगतान बाकी | |
| Confirmed | पुष्टि हुई | |
| Shipped | भेजा गया | |
| Delivered | डिलीवर हुआ | |
| Payment Failed | भुगतान असफल | |
| Payout | भुगतान | In the farmer area "भुगतान" means money paid out to the farmer; "भुगतान इतिहास" = payout history |
| Gross / Net | कुल / शुद्ध | |
| Symptoms | लक्षण | |
| Prevention | बचाव | |
| Language | भाषा | |
| Last updated | अपडेट हुआ | Always as a whole sentence: "3:42 PM पर अपडेट हुआ" |

## Style rules used

- Full stop is the Hindi danda "।"; question and exclamation marks stay "?" and "!".
- Numbers use 0-9 (as on prices and receipts in India), never Devanagari digits.
- Spelling decision (owner): **फसल** and **बाजार** are written WITHOUT the dot under the letter (not फ़सल / बाज़ार), in
  every compound too (फसल बाजार, फसल डॉक्टर, फसल चिकित्सक). Other words keep their normal nukta (ऑफ़लाइन, ज़्यादा, ज़रूरी, फ़ोटो ...).
- "Out of stock / sold out" is always **स्टॉक खत्म**.
- Month names are written out ("अक्टूबर"); the times stay 12-hour with AM/PM.
- A sentence with a link or a bold part in the middle (consent text, OTP "sent to") is one whole template with
  `{placeholders}`, so Hindi word order is not forced into English order.
- Never invent text: where English has a fact (a rule, a price, a policy), the Hindi says exactly the same thing.
