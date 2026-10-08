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

## UI fixes round (chips, status bar, Settings, Google messages)

- [ ] Store: the category chips ("Grains", "Pulses & Lentils", ...) show fully, text not cut, and nothing from the product
      grid peeks out under them. Same on Crop Marketplace (crop types) and Mandi (states and commodities).
- [ ] Repeat with Settings > Display > Font size set to Largest, and in हिन्दी: chips stay whole.
- [ ] Weather, Home, Profile, Login, Register, OTP: the title/first line is clear of the clock and battery icons. Try a
      phone with a notch / camera hole too.
- [ ] Profile: gear at the top right opens Settings (big enough to tap easily). Log out is still at the bottom of Profile.
- [ ] Settings: language switch works and is remembered; Privacy Policy and Terms open the website; the app version shows;
      Delete account is alone in the bottom section and its confirmation window is the same as before.
- [ ] Login: tap "Sign in with Google" and back out of the account picker: no red message.
- [ ] Login with airplane mode on, tap Google: "Couldn't reach Google..." (हिन्दी: "Google से जुड़ा नहीं जा सका...").
- [ ] A Google account that the server does not accept: "Google sign-in didn't work. Please try again or log in with
      your email." No codes, no English text in हिन्दी, nothing about Cloud Console.

## Final round: offline on Home, "load more", friendly errors, icons

### Offline: Home and lists
- [ ] Open Home online (products and crops load), then airplane mode and reopen the app: both sections still show, with
      ONE "You're offline" banner and "Last updated ..." (the older of the two). No red error box over saved data.
- [ ] A section that has never loaded and is offline shows its error box with Retry (and works after reconnecting).
- [ ] Orders list offline: every row's status chip has a dashed border and the line "Order status may be out of date
      while you're offline." (हिन्दी: "आप ऑफ़लाइन हैं, इसलिए ऑर्डर की स्थिति पुरानी हो सकती है।"). Same line under the
      status on an order's own page. Back online: the cue disappears.
- [ ] Scroll to the bottom of Store / Crop Marketplace / Orders / Notifications / Mandi with a long list, turn airplane
      mode on, scroll more: a small line "Connect to the internet to load more." appears (हिन्दी: "और देखने के लिए
      इंटरनेट से जुड़ें।"). Tap it after reconnecting: the next page loads. It does not flicker or retry by itself in a loop.
- [ ] Same for "Show more reviews" on a crop page.

### Friendly error messages (try each in English and in हिन्दी; no code, no number, no server wording)
- [ ] Login with a wrong password -> "Wrong email or password..." (and a hint to verify a new account first).
- [ ] Register with an email that already exists -> "This email is already registered. Try logging in instead."
- [ ] Register with a bad email / short password -> the field-specific line (email / "at least 8 characters").
- [ ] OTP: a wrong code -> "That code isn't right or has expired..."; many wrong codes -> "Too many wrong codes..."; tap Resend
      straight away (before the timer) -> "Please wait a little before asking for another code."
- [ ] Many wrong logins in a row -> "Too many attempts. Please try again in about N minutes." (or "wait a short while").
- [ ] Airplane mode: any action -> "No internet connection or the connection is slow. Please try again."
- [ ] Checkout with an item that went out of stock -> "Some items are out of stock or not available in that quantity..."
- [ ] Start a payment, then cancel/fail it -> "The payment didn't go through. Please try again." (Razorpay's own wording is not shown.)
- [ ] Account deletion with the wrong password -> "That password isn't right."; with an order in progress -> "Your account
      can't be deleted while an order, booking or payout is still in progress..."
- [ ] Leave the app open until the login expires, then act -> "Your session has expired. Please log in again."
- [ ] Anything that fails on the server -> "Something went wrong on our side. Please try again in a little while."
- [ ] Upload a very large photo on a listing -> "That photo couldn't be used. Please choose a smaller photo (under 5 MB)..."

### Icons and tab bar
- [ ] Bottom tab bar: outline icons, the open tab is filled and green, the others grey; labels unchanged (Home, Store, Crop
      Doctor, Weather, Profile, plus Farmer for farmers). Tap each tab: the icon switches to filled.
- [ ] Home: cart and bell icons (with the number badge when there is something), six quick-link tiles with icons.
- [ ] Profile: gear icon top right; Notifications row with an icon and arrow. Settings: icons on Privacy, Terms, Version, Delete.
- [ ] Password field: the eye shows and hides the password.
- [ ] Crop Doctor and farmer photo buttons: camera and gallery icons next to the text.
- [ ] Empty screens (empty cart, no orders, no notifications) show a soft grey line icon, not an emoji.
- [ ] No icon shows as an empty space or a "?" box, even on the very first screen after starting the app.
- [ ] Still emoji on purpose: the five big onboarding pictures, star ratings, check marks inside sentences.
