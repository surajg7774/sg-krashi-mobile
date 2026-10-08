# Hindi: what to try on a real phone

Use the preview build from this branch on an Android phone. Tick each line. Anything odd: note the screen and what
you saw (a photo of the screen helps).

## Switching and remembering

- [ ] Fresh install, phone language English: the app opens in English.
- [ ] Fresh install, phone language Hindi: the app opens in Hindi (onboarding slides too).
- [ ] Login screen: the "English | हिन्दी" switch is in the top corner and works while signed out.
- [ ] Profile > gear (top right) > Settings > language: switch to हिन्दी. Every visible text changes at once (tabs, headers, the screen itself).
- [ ] Close the app fully and reopen: it is still Hindi.
- [ ] Log out, then log in again: still Hindi.
- [ ] Switch back to English: everything returns to English, nothing stays in Hindi.
- [ ] Phone language is Hindi but you chose English: the app stays English after a restart.

## Screens in Hindi (go through each one)

- [ ] Onboarding: all five slides, "छोड़ें", "आगे", "शुरू करें".
- [ ] Register: the line "साइन अप करके आप नियम व शर्तों और गोपनीयता नीति से सहमत होते हैं।" shows both links; tapping each opens the website page.
- [ ] OTP screen: the email address is shown in the sentence; the "दोबारा भेजें" countdown ticks.
- [ ] Home: quick-link tiles read well, none cut off ("फसल बाजार", "फसल डॉक्टर").
- [ ] Store, a product page, add to cart, cart, address, review order, place order.
- [ ] Crop Marketplace: search, filters sheet (price, dates), a crop page, reviews.
- [ ] Weather: search a place, "आपका मौजूदा स्थान", the stats, the 7-day chart (weekday names in Hindi).
- [ ] Mandi prices: sync line, chips, a trend card.
- [ ] AI assistant: type a Hindi sentence using the Hindi keyboard.
- [ ] AI Crop Doctor: photo, analyze, result (the report language should start as Hindi).
- [ ] Notifications list: "x मिनट पहले" times.
- [ ] Profile: name, role, Notifications, My Orders, Log out; the gear opens Settings.
- [ ] Settings: language, Privacy Policy and Terms (open the website), app version, and under "सावधानी" the delete-account window text (do not actually delete).
- [ ] Farmer account: dashboard, listings, listing form, payouts and payout detail.

## Dates, numbers, orders

- [ ] Dates read like "8 अक्टूबर 2026"; times like "3:42 PM"; prices like "₹1,500" or "₹1,50,000".
- [ ] Place an order: the order screen shows the Hindi status ("भुगतान बाकी" ...) and the timeline steps with Hindi times.
- [ ] After paying: "भुगतान की पुष्टि का इंतज़ार है…" then "पुष्टि हुई".
- [ ] A cancelled / failed payment shows the Hindi failure sentence.
- [ ] Order number reads "ऑर्डर #SG-..." and the number itself is unchanged.

## Offline

- [ ] Open Weather and Orders online, then switch on airplane mode and reopen: the banner says "आप ऑफ़लाइन हैं" and the
      saved data is still there.
- [ ] The "Last updated" line reads like "3:42 PM पर अपडेट हुआ" (time first), and "कल 9:09 PM पर अपडेट हुआ" for yesterday.
- [ ] Product page offline: "कार्ट में जोड़ने के लिए इंटरनेट से जुड़ें" and the button is disabled.
- [ ] Order screen offline: "आप ऑफ़लाइन हैं, इसलिए ऑर्डर की स्थिति पुरानी हो सकती है।" and no "Pay Now".
- [ ] Turn the network back on and come back to the app: the banner goes away.

## Looks

- [ ] Smallest phone you have (or Settings > Display > Font size > Largest): tab labels still on one line, nothing overlaps.
- [ ] Long Hindi paragraphs (onboarding, delete-account window, order "taking longer" note): vowel signs above and below
      the letters are not cut off.
- [ ] Buttons side by side (order screen, delete window) wrap instead of running off the edge.
- [ ] The "अगले 7 दिन" heading letters are joined normally (not spread out).

## Keyboard and typing

- [ ] Search boxes accept Hindi typing (Store, Crop Marketplace, Weather, farmer listings) and results still come back.
- [ ] Farmer listing form: type a crop name and description in Hindi; it saves and shows the same Hindi text afterwards.
- [ ] Address form: Hindi address text saves and shows back correctly.

## Notifications

- [ ] Receive a push notification for an order and tap it from the lock screen: the app opens the correct order.
- [ ] Same with the app in the background and with the app closed.
- [ ] The notification's own text is whatever the server sent (it is not translated by the app).

## Things that stay English on purpose

- [ ] Product, crop and place names; reviews; notification and chat text; the server's error messages; the Privacy
      and Terms pages (they are website pages).
