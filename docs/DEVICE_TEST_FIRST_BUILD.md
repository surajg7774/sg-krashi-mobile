# First phone test of the next build: the 15 checks that matter

Do these on a real Android phone, in order, with the new build installed (uninstall the old app first). Tick each one.
The full 76-item list (`I18N_DEVICE_TEST_CHECKLIST.md`) is for later.

**Backend and data**
1. [ ] Open the app: the Home screen loads with no error banner (this proves the new backend address works).
2. [ ] Store: products and categories load, and the product photos show (they come from Cloudinary).
3. [ ] Open a product: the detail page loads with its photos and price.
4. [ ] Crop Marketplace: listings load with photos; open one.
5. [ ] Log in with an existing account (email and password). Then open **My Orders**: your old orders are there.
6. [ ] Open one order: status, items, address and timeline show.

**Buying**
7. [ ] Add a product to the cart, change the quantity, open the cart and see the total.
8. [ ] Go through checkout up to the payment screen (stop there unless you want a real test payment).

**Language and look**
9. [ ] Profile, then the language switch: change to Hindi. Home, Store, Cart and Profile are all in Hindi with no cut-off text.
10. [ ] Switch back to English; the choice is still there after closing and reopening the app.
11. [ ] Theme: the Home header, tab bar, Store cards, Weather and the coloured order status chips look right and the text is readable.
12. [ ] Settings (gear on Profile): language, Privacy Policy and Terms open, version shows, and the Delete Account button is there (do not confirm it).

**Phone features**
13. [ ] Push permission: the app asks for notification permission once; allow it. Afterwards the Notifications screen opens.
14. [ ] Weather asks for location permission and shows the weather (or lets you search a city).
15. [ ] Airplane mode on, open the app: it shows saved data with an "offline" note instead of crashing; turn airplane mode off and pull to refresh.

Updates (only after the first build is installed): a JS-only fix published to the matching channel should arrive after the app
is closed and opened again (it may need two opens: one to download, one to apply).
