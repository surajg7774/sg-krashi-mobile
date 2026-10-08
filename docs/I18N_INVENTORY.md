# Hindi (i18n) inventory - hard-coded user-facing text

> **Snapshot.** This is the list found *before* the migration (stage 1). After stage 4 the scanner finds 0 hard-coded
> strings; what remains in English on purpose is listed in `docs/I18N_DECISIONS.md` and marked `i18n-ignore` in the code.
> How the text is organised now: `docs/I18N.md`.

Stage 1 of roadmap item 8. Generated on 2026-10-08 from `master` at the branch point,
by `node scripts/i18n-scan.cjs`, then reviewed by hand. The scanner reads the code with the TypeScript parser. It is a
best-effort list: it can miss text that is built at runtime, and it can flag a string that never reaches a screen.

## Totals

- **470 findings** in 53 files. That is **401 unique texts**;
  the rest are repeats such as "Retry", "Cancel" and "Remove".
- The scanner already skips route names, storage keys, HTTP headers, comparison values and developer-only assertions.
- **5 more visible strings are not literals in the code:** the bottom tab labels "Home", "Store", "Weather", "Farmer"
  and "Profile". They are the route names, which React Navigation shows when no title is set.
- 71 strings in `src/features/crop-marketplace/strings.ts` and 9 in `src/offline/strings.ts` already live in
  string tables. Those tables are the starting point; their wording moves into `src/i18n/en.ts` unchanged.

## Per feature

Column meanings:

- **text:** JSX text.
- **prop:** a visible prop such as `title`, `label` or `message`.
- **placeholder:** an input placeholder.
- **a11y:** a screen-reader label.
- **alert:** an `Alert.alert` title or body.
- **table:** a value in a string table or option list.
- **code:** a string built in code (for example an error fallback or a label function).

| Feature | text | prop | placeholder | a11y | alert | table | code | total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| features/crop-marketplace | 0 | 0 | 1 | 2 | 0 | 71 | 12 | 86 |
| features/farmer | 30 | 12 | 4 | 0 | 6 | 4 | 5 | 61 |
| features/crop-doctor | 25 | 14 | 1 | 0 | 0 | 9 | 3 | 52 |
| features/orders | 12 | 4 | 0 | 1 | 0 | 18 | 5 | 40 |
| features/weather | 14 | 4 | 1 | 0 | 0 | 4 | 11 | 34 |
| features/auth | 17 | 0 | 6 | 0 | 0 | 0 | 6 | 29 |
| offline | 0 | 0 | 0 | 0 | 0 | 9 | 13 | 22 |
| navigation | 0 | 0 | 0 | 0 | 0 | 16 | 2 | 18 |
| features/profile | 13 | 0 | 1 | 0 | 0 | 0 | 3 | 17 |
| features/mandi | 6 | 5 | 0 | 0 | 0 | 0 | 4 | 15 |
| features/store | 5 | 4 | 1 | 0 | 0 | 0 | 4 | 14 |
| features/address | 7 | 1 | 5 | 0 | 0 | 0 | 0 | 13 |
| features/onboarding | 1 | 0 | 0 | 0 | 0 | 10 | 2 | 13 |
| components | 2 | 0 | 0 | 1 | 0 | 0 | 9 | 12 |
| features/home | 2 | 3 | 0 | 0 | 0 | 6 | 0 | 11 |
| features/cart | 6 | 2 | 0 | 1 | 0 | 0 | 0 | 9 |
| features/notifications | 2 | 2 | 0 | 0 | 0 | 0 | 4 | 8 |
| features/checkout | 5 | 1 | 0 | 0 | 0 | 0 | 0 | 6 |
| features/chat | 2 | 1 | 1 | 0 | 0 | 0 | 1 | 5 |
| features/payment | 1 | 0 | 0 | 0 | 0 | 0 | 2 | 3 |
| api | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| notifications | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| **all** | **150** | **53** | **21** | **5** | **6** | **148** | **87** | **470** |

## What stays in English (see docs/I18N_DECISIONS.md)

These are counted in the table above, but they will not be translated:

| What | Where | Why |
|---|---|---|
| Google sign-in setup diagnostics (4) | `components/GoogleSignInButton.tsx` | Developer hints (DEVELOPER_ERROR, Cloud Console, Metro console). D5. The user-facing sentence of each is translated. |
| Razorpay checkout page | `features/payment/RazorpayWebView.tsx` | Third-party HTML page, not app text. |
| Report-language names (5) | `features/crop-doctor/types.ts` | Already each in its own script; the list sets the AI report language. D6. |
| Default weather place ("Khandwa", "Madhya Pradesh", "India") | `features/weather/types.ts` | Place-name data for the default location; the hint around it is translated. |
| Android notification channel name ("Default") | `notifications/pushNotifications.ts` | System-level name, fixed when the channel is first created. |
| Offline-cache key fragments (".user.") | `offline/scoping.ts` | Storage keys, not text (scanner false positive). |
| Month and weekday short names (31) | `cropLogic.ts`, `offline/screenState.ts`, `weather/WeatherForecastChart.tsx` | Not left in English: they move to `src/i18n/format.ts` with Hindi equivalents. |

Server data is never translated, because it is not in the app's code. This includes names, descriptions, reviews,
notifications, chat replies, scan results, mandi names and the server's own error messages (D1, D2).

## Every finding

The list is grouped by file, in the format "line [kind] text".


### src/api/client.ts

- 129 [string] Network error

### src/components/ErrorState.tsx

- 13 [jsx-text] Retry

### src/components/GoogleSignInButton.tsx

- 36 [string] {…} did not resolve within {…}ms
- 80 [string] Google sign-in was cancelled or rejected. If you selected an account, check whether that account is
- 81 [string] added under Google Cloud Console → OAuth consent screen → Test users.
- 85 [string] Google sign-in did not complete (unexpected response). Please try again.
- 94 [string] Google sign-in configuration error (DEVELOPER_ERROR) — package name, SHA-1, or client ID mismatch. See Metro console for details.
- 97 [string] Google sign-in failed ({…}): {…}
- 102 [string] Google sign-in hung on {…} — see Metro console. This is a real, reported issue in this library's version.
- 108 [string] Could not sign in with Google. Please try again.

### src/components/NewBadge.tsx

- 22 [jsx-text] New

### src/components/OfflineBanner.tsx

- 27 [jsx-prop:accessibilityLabel] {…}: try to refresh

### src/components/SelectField.tsx

- 22 [string] Select…

### src/features/address/AddressSelectScreen.tsx

- 30 [jsx-text] Default
- 68 [jsx-prop:message] Could not load your addresses.
- 90 [jsx-text] You don't have any saved addresses yet.
- 96 [jsx-text] + Add a new address
- 104 [jsx-prop:placeholder] Address line 1
- 111 [jsx-prop:placeholder] Address line 2 (optional)
- 118 [jsx-prop:placeholder] City
- 125 [jsx-prop:placeholder] State
- 132 [jsx-prop:placeholder] Pincode
- 139 [jsx-text] Could not save this address. Please try again.
- 143 [jsx-text] Cancel
- 153 [jsx-text] Save Address
- 167 [jsx-text] Continue to Review

### src/features/auth/LoginScreen.tsx

- 42 [string] Login failed. Please try again.
- 54 [jsx-text] Log in
- 60 [jsx-prop:placeholder] Email
- 69 [jsx-prop:placeholder] Password
- 83 [jsx-text] Log in
- 94 [jsx-text] Don't have an account? Sign up
- 102 [jsx-text] Try AI Crop Doctor without an account →

### src/features/auth/RegisterScreen.tsx

- 68 [string] Could not create your account. Please try again.
- 77 [jsx-text] Create Account
- 83 [jsx-prop:placeholder] Full name
- 91 [jsx-prop:placeholder] Email
- 101 [jsx-prop:placeholder] Phone (optional)
- 109 [jsx-prop:placeholder] Password (min. 8 characters)
- 123 [jsx-text] Create Account
- 128 [jsx-text] By signing up you agree to the
- 130 [jsx-text] Terms
- 132 [jsx-text] and
- 134 [jsx-text] Privacy Policy
- 146 [jsx-text] Already have an account? Log in

### src/features/auth/VerifyOtpScreen.tsx

- 60 [string] Could not verify this code. Please try again.
- 74 [string] Could not resend the code. Please try again.
- 83 [jsx-text] Verify your email
- 85 [jsx-text] We&apos;ve sent a 6-digit code to
- 111 [jsx-text] Verify
- 116 [jsx-text] Didn&apos;t get a code?
- 118 [jsx-text] Resend in
- 121 [string] Sending...
- 121 [string] Resend code
- 131 [jsx-text] Back to Log In

### src/features/cart/CartScreen.tsx

- 37 [jsx-prop:accessibilityLabel] Open {…}
- 42 [jsx-text] each
- 67 [jsx-text] Remove
- 107 [jsx-prop:message] Could not load your cart.
- 119 [jsx-prop:message] Your cart is empty. Add products from the Store or crops from the Crop Marketplace to see them here.
- 126 [jsx-text] Browse Store
- 132 [jsx-text] Browse Crops
- 166 [jsx-text] Total
- 170 [jsx-text] Proceed to Checkout

### src/features/chat/ChatScreen.tsx

- 57 [string] Could not send message. Please try again.
- 67 [jsx-text] The chat assistant is temporarily unavailable. Please check back later.
- 91 [jsx-prop:message] Ask me anything about SG Krashi — orders, bookings, how the platform works, or farming questions.
- 108 [jsx-prop:placeholder] Type a message…
- 124 [jsx-text] Send

### src/features/checkout/CheckoutScreen.tsx

- 52 [jsx-prop:message] Could not load checkout details.
- 60 [jsx-text] Shipping to
- 69 [jsx-text] Items (
- 81 [jsx-text] Total
- 87 [jsx-text] Could not place your order. Please try again.
- 100 [jsx-text] Place Order

### src/features/crop-doctor/CropDoctorScreen.tsx

- 32 [object:HIGH] High confidence
- 32 [object:MODERATE] Moderate confidence
- 32 [object:LOW] Low confidence
- 41 [string] No issue detected
- 88 [string] {…} (limited AI coverage)
- 90 [object:label] Other / Not listed
- 141 [jsx-text] AI Crop Doctor
- 142 [jsx-text] Photograph a crop or leaf and get an instant AI-powered health check.
- 147 [jsx-text] Analyzing your photo…
- 166 [jsx-text] This photo doesn't look like the crop you selected — the analysis below may be less reliable.
- 173 [jsx-text] The AI wasn't fully confident in this result. Treat it as a starting point, not a diagnosis.
- 178 [jsx-text] Problem:
- 180 [jsx-text] Pathogen:
- 182 [jsx-text] Severity:
- 184 [jsx-prop:heading] Symptoms
- 185 [jsx-prop:heading] Possible causes
- 186 [jsx-prop:heading] Environmental factors
- 187 [jsx-prop:heading] What to do now
- 188 [jsx-prop:heading] Prevention
- 191 [jsx-text] Monitoring guidance
- 195 [jsx-prop:heading] Escalate if you see
- 199 [jsx-text] Sources
- 219 [jsx-text] Download / Share PDF Report
- 227 [jsx-text] Want to keep this result?
- 228 [jsx-text] Log in to save this scan to your history and download a PDF report.
- 237 [jsx-text] Scan another photo
- 245 [jsx-prop:label] What crop is this?
- 247 [jsx-prop:label] Report language
- 253 [jsx-prop:placeholder] Type the crop's name
- 279 [jsx-text] 📷 Take Photo
- 282 [jsx-text] 🖼️ Add from Gallery
- 288 [string] Something went wrong analyzing this photo.
- 297 [jsx-text] Analyze
- 304 [jsx-text] Scan History
- 309 [jsx-prop:message] Could not load scan history.
- 312 [jsx-prop:message] No scans yet — analyze your first photo above.
- 325 [jsx-text] Previous
- 328 [jsx-text] Page
- 328 [jsx-text] of
- 336 [jsx-text] Next

### src/features/crop-doctor/ScanDetailScreen.tsx

- 37 [jsx-prop:message] Could not load this scan.
- 52 [jsx-text] Problem:
- 53 [jsx-text] Severity:
- 55 [jsx-prop:heading] Symptoms
- 56 [jsx-prop:heading] What to do now
- 57 [jsx-prop:heading] Prevention
- 69 [jsx-text] Download / Share PDF Report

### src/features/crop-doctor/types.ts

- 66 [object:label] English
- 67 [object:label] हिन्दी (Hindi)
- 68 [object:label] मराठी (Marathi)
- 69 [object:label] ગુજરાતી (Gujarati)
- 70 [object:label] Hinglish

### src/features/crop-marketplace/CropFilterSheet.tsx

- 23 [jsx-prop:placeholder] YYYY-MM-DD
- 87 [jsx-prop:accessibilityLabel] Close filters

### src/features/crop-marketplace/cropLogic.ts

- 37 [string] Jan
- 37 [string] Feb
- 37 [string] Mar
- 37 [string] Apr
- 37 [string] May
- 37 [string] Jun
- 37 [string] Jul
- 37 [string] Aug
- 37 [string] Sep
- 37 [string] Oct
- 37 [string] Nov
- 37 [string] Dec

### src/features/crop-marketplace/CropReviews.tsx

- 48 [jsx-prop:accessibilityLabel] {…}, {…} out of 5. {…}

### src/features/crop-marketplace/strings.ts

- 10 [object:title] Crop Marketplace
- 11 [object:subtitle] Fresh grain, pulse, and vegetable batches, sold directly from the farm.
- 12 [object:filters] Filters
- 13 [object:empty] No crop listings match your filters.
- 14 [object:emptySearch] No crop listings found for "{{search}}".
- 15 [object:emptyNone] There are no crop listings right now. Please check back soon.
- 16 [object:clearFilters] Clear filters
- 17 [object:clearSearch] Clear search
- 18 [object:showResults] Show Results
- 19 [object:loadError] Could not load crop listings.
- 20 [object:retry] Retry
- 21 [object:storeEntrySubtitle] Browse fresh crops from farms
- 22 [object:homeSection] Fresh Crops
- 23 [object:homeEmpty] No crop listings right now. Check back soon.
- 26 [object:search] Search
- 27 [object:searchLabel] Search crop listings
- 28 [object:searchPlaceholder] Search crops…
- 29 [object:cropType] Crop Type
- 30 [object:all] All
- 31 [object:priceRange] Price Range
- 32 [object:minPrice] Min (₹)
- 33 [object:maxPrice] Max (₹)
- 34 [object:organicOnly] Organic certified only
- 35 [object:harvestDate] Harvest Date
- 36 [object:from] From
- 37 [object:to] To
- 38 [object:anyDate] Any date
- 40 [object:priceInvalid] Enter prices as numbers, for example 20 or 20.50.
- 41 [object:priceOrder] The lowest price is higher than the highest price.
- 42 [object:harvestInvalid] Enter dates as YYYY-MM-DD.
- 43 [object:harvestOrder] The start date is after the end date.
- 47 [object:notFound] We couldn't find that crop listing.
- 48 [object:loadError] Could not load this crop listing.
- 49 [object:organicCertified] Organic Certified
- 50 [object:organic] Organic
- 51 [object:soldOut] Sold Out
- 52 [object:available] {{count}} available
- 53 [object:addToCart] Add to Cart
- 54 [object:addedToCart] Added to cart
- 55 [object:addError] Could not add to cart. Please try again.
- 56 [object:similarItems] Similar Items
- 57 [object:youMightAlsoLike] You Might Also Like
- 58 [object:reviews] Reviews
- 59 [object:decreaseQuantity] Decrease quantity
- 60 [object:increaseQuantity] Increase quantity
- 61 [object:quantity] Quantity
- 62 [object:noImage] No image available
- 63 [object:photoOf] Photo {{index}} of {{total}}
- 66 [object:empty] No reviews yet.
- 67 [object:anonymous] Anonymous
- 68 [object:loadError] Could not load reviews.
- 69 [object:showMore] Show more reviews
- 70 [object:summary] {{rating}} out of 5, {{count}} reviews
- 74 [object:active] Active
- 75 [object:inactive] Inactive
- 76 [object:soldOut] Sold out
- 77 [object:available] {{count}} available
- 78 [object:uncategorized] Uncategorized
- 79 [object:markSoldOut] Mark Sold Out
- 80 [object:markSoldOutTitle] Mark as sold out
- 81 [object:markSoldOutBody] "{{name}}" will show as Sold Out and buyers will not be able to add it to their cart. To sell it again, enter a new Quantity Available and save.
- 82 [object:markSoldOutDoneTitle] Marked as sold out
- 83 [object:markSoldOutDoneBody] This listing now shows as Sold Out.
- 84 [object:markSoldOutError] Could not mark this listing as sold out.
- 85 [object:cancel] Cancel
- 86 [object:listingRow] {{name}}, {{category}}, {{status}}, {{price}}
- 89 [object:listing] Open {{label}}
- 90 [object:categoryChip] Crop type {{name}}
- 91 [object:filtersButton] Filters, {{count}} active
- 92 [object:filtersButtonNone] Filters
- 93 [object:searchField] Search crop listings

### src/features/farmer/FarmerDashboardScreen.tsx

- 44 [jsx-prop:message] Could not load your dashboard.
- 54 [jsx-prop:label] Total Listings
- 55 [jsx-prop:label] Active Listings
- 56 [jsx-prop:label] Orders w/ Your Crops
- 57 [jsx-prop:label] Units Sold
- 62 [jsx-text] Pending payout (accrued, not yet batched)
- 64 [jsx-text] item(s) delivered, awaiting the weekly batch
- 69 [jsx-text] My Crop Listings
- 70 [jsx-text] Manage your listings on the Crop Marketplace →
- 74 [jsx-text] Payout History
- 75 [jsx-text] View your batched, approved, and paid payouts →

### src/features/farmer/FarmerListingFormScreen.tsx

- 109 [string] Could not save this listing.
- 118 [alert] Saved
- 118 [alert] Your changes have been saved.
- 120 [string] Could not save this listing.
- 175 [alert] Deactivate listing
- 176 [alert] Are you sure you want to deactivate "{…}"? It will immediately disappear from the Crop Marketplace, on the website and in the app.
- 178 [object:text] Cancel
- 179 [object:text] Deactivate
- 220 [alert] Remove photo
- 220 [alert] Remove this photo from the listing?
- 221 [object:text] Cancel
- 223 [object:text] Remove
- 260 [jsx-prop:message] Could not load this listing.
- 269 [jsx-prop:label] Category
- 276 [jsx-text] Name
- 281 [jsx-prop:placeholder] e.g. Alphonso Mangoes
- 285 [jsx-text] Slug (optional)
- 290 [jsx-prop:placeholder] Leave blank to auto-generate from name
- 295 [jsx-text] Description
- 301 [jsx-prop:placeholder] Describe your crop…
- 307 [jsx-text] Unit Price (₹)
- 318 [jsx-text] Quantity Available
- 329 [jsx-text] Harvest Date
- 332 [string] Select a date
- 348 [jsx-text] Organic Certified
- 359 [string] Save Changes
- 359 [string] Create Listing
- 376 [jsx-text] Photos
- 403 [jsx-text] Remove
- 412 [jsx-text] 📷 Take Photo
- 415 [jsx-text] 🖼️ Add from Gallery
- 424 [jsx-text] Deactivate Listing

### src/features/farmer/FarmerListingsScreen.tsx

- 77 [jsx-prop:placeholder] Search your listings…
- 83 [jsx-text] + Add
- 90 [jsx-prop:message] Could not load your listings.
- 96 [jsx-prop:message] You haven't added any crop listings yet.
- 99 [jsx-text] + Add Your First Listing

### src/features/farmer/FarmerPayoutDetailScreen.tsx

- 37 [jsx-prop:message] Could not load this payout.
- 54 [jsx-text] Gross
- 58 [jsx-text] Commission
- 62 [jsx-text] Net
- 67 [jsx-text] Approved:
- 68 [jsx-text] Paid:
- 71 [jsx-text] Line Items
- 78 [jsx-text] Order #

### src/features/farmer/FarmerPayoutsScreen.tsx

- 30 [jsx-text] net
- 57 [jsx-text] Pending (accrued, not yet batched)
- 59 [jsx-text] item(s)
- 66 [jsx-prop:message] Could not load your payout history.
- 70 [jsx-prop:message] No payouts yet — these are created weekly once your delivered orders accrue.

### src/features/home/HomeScreen.tsx

- 55 [object:label] Store
- 56 [object:label] Crop Doctor
- 57 [object:label] Weather
- 58 [object:label] Mandi Prices
- 59 [object:label] AI Assistant
- 60 [object:label] Crop Marketplace
- 142 [jsx-text] Welcome
- 178 [jsx-text] Featured Products
- 183 [jsx-prop:message] Could not load products.
- 187 [jsx-prop:message] No featured products right now — check back soon.
- 231 [jsx-prop:title] For You

### src/features/mandi/MandiScreen.tsx

- 27 [jsx-text] Min ₹
- 27 [jsx-text] · Max ₹
- 79 [string] Last synced {…}
- 80 [string] Not yet synced
- 81 [jsx-text] records
- 132 [jsx-prop:message] Awaiting Agmarknet data
- 133 [jsx-prop:description] Mandi prices will appear here once the daily sync has data.
- 138 [jsx-prop:message] Could not load mandi prices.
- 142 [jsx-prop:message] No mandi price records match these filters.

### src/features/mandi/MandiTrendCard.tsx

- 41 [jsx-prop:message] Could not load the price trend.
- 54 [string] Awaiting Agmarknet data
- 55 [string] Awaiting Agmarknet data — a trend needs at least {…} days of prices (have {…}).
- 71 [jsx-text] · avg across markets
- 76 [jsx-text] % over
- 76 [jsx-text] days

### src/features/notifications/NotificationCenterScreen.tsx

- 18 [string] just now
- 19 [string] {…}m ago
- 21 [string] {…}h ago
- 22 [string] {…}d ago
- 81 [jsx-text] Mark all
- 81 [jsx-text] as read
- 88 [jsx-prop:message] Could not load notifications.
- 92 [jsx-prop:message] You have no notifications yet.

### src/features/onboarding/OnboardingScreen.tsx

- 34 [object:title] Welcome to SG Krashi
- 36 [object:description] One platform connecting farmers and buyers — shop fresh produce, manage your farm, and get smart farming help, all in one app.
- 40 [object:title] Shop the Store
- 42 [object:description] Browse fresh, organic produce and farm essentials sourced directly from local farms.
- 46 [object:title] Crop Marketplace
- 47 [object:description] Buy fresh grain, pulse and vegetable batches listed directly by farms, and see when each was harvested.
- 51 [object:title] AI Crop Doctor & Assistant
- 53 [object:description] Snap a photo of your crop to instantly diagnose issues, or chat with our AI Assistant for farming advice anytime.
- 57 [object:title] Weather & Mandi Prices
- 59 [object:description] Check live weather forecasts for your farm and track daily mandi (market) prices before you sell.
- 97 [jsx-text] Skip
- 125 [string] Get Started
- 125 [string] Next

### src/features/orders/OrderConfirmationScreen.tsx

- 85 [string] Unable to start payment. Please try again.
- 124 [jsx-prop:message] We couldn't find that order.
- 136 [string] Order
- 137 [jsx-text] Order #
- 159 [jsx-prop:accessibilityLabel] Open {…}, quantity {…}, ₹{…}
- 184 [jsx-text] Pay Now
- 193 [jsx-text] Waiting for payment confirmation…
- 200 [jsx-text] This is taking longer than expected. Your payment may still be processing — check Order History in a few minutes, or come back to this order later.
- 204 [jsx-text] Check Again
- 211 [jsx-text] Your payment didn't go through and the reserved stock has been released. Please place a new order to try again.
- 219 [jsx-text] Order status
- 228 [jsx-text] Continue Shopping
- 231 [jsx-text] View Orders
- 240 [jsx-prop:description] Order {…}

### src/features/orders/OrderHistoryScreen.tsx

- 28 [jsx-text] item
- 65 [jsx-prop:message] Could not load your orders.
- 75 [jsx-prop:message] You haven't placed any orders yet.
- 81 [jsx-text] Browse Store

### src/features/orders/orderStatusDisplay.ts

- 6 [object:PENDING_PAYMENT] Pending Payment
- 7 [object:CONFIRMED] Confirmed
- 8 [object:SHIPPED] Shipped
- 9 [object:DELIVERED] Delivered
- 10 [object:PAYMENT_FAILED] Payment Failed
- 11 [object:REFUNDED] Refunded
- 25 [object:PENDING_PAYMENT] Order Placed
- 26 [object:CONFIRMED] Order Confirmed!
- 27 [object:SHIPPED] Order Shipped
- 28 [object:DELIVERED] Order Delivered
- 29 [object:PAYMENT_FAILED] Payment Failed
- 30 [object:REFUNDED] Order Refunded

### src/features/orders/OrderTimeline.tsx

- 41 [string] , current step
- 41 [string] , not yet
- 79 [jsx-text] Current

### src/features/orders/orderTimelineSteps.ts

- 21 [object:PENDING_PAYMENT] Order placed
- 22 [object:CONFIRMED] Payment confirmed
- 23 [object:SHIPPED] Shipped
- 24 [object:DELIVERED] Delivered
- 25 [object:PAYMENT_FAILED] Payment failed
- 26 [object:REFUNDED] Refunded
- 68 [string] Waiting for payment

### src/features/payment/RazorpayWebView.tsx

- 44 [string] <!DOCTYPE html> <html> <head> <meta name="viewport" content="width=device-width, initial-scale=1" /> </head> <body style="margin:0;background:#fff;"> <script sr
- 108 [string] Could not read the payment result. Please try again.
- 120 [jsx-text] Cancel

### src/features/profile/DeleteAccountModal.tsx

- 79 [string] Google confirmation did not complete. Please try again.
- 85 [string] Couldn't confirm with Google. Please try again.
- 100 [string] Couldn't delete your account. Please try again.
- 111 [jsx-text] Delete your account?
- 113 [jsx-text] This can&apos;t be undone. You&apos;ll be signed out, and your addresses, cart, chat history, scan history and notifications will be deleted. Orders and payment
- 121 [jsx-text] See exactly what is deleted and kept
- 129 [jsx-prop:placeholder] Confirm with your password
- 138 [jsx-text] Confirmed with Google ✓
- 148 [jsx-text] Confirm with Google
- 159 [jsx-text] Cancel
- 173 [jsx-text] Delete permanently

### src/features/profile/ProfileScreen.tsx

- 55 [jsx-text] Notifications
- 59 [jsx-text] Privacy Policy
- 63 [jsx-text] Terms &amp; Conditions
- 67 [jsx-text] Delete account
- 77 [jsx-text] My Orders
- 80 [jsx-text] Log out

### src/features/store/ProductDetailScreen.tsx

- 82 [jsx-prop:message] Could not load this product.
- 122 [jsx-text] No image available
- 135 [jsx-text] Organic Certified
- 140 [string] {…} in stock
- 140 [string] Out of stock
- 153 [string] Added ✓
- 153 [string] Add to Cart
- 160 [jsx-text] Could not add to cart. Please try again.
- 166 [jsx-prop:title] Frequently Bought Together

### src/features/store/StoreScreen.tsx

- 53 [jsx-text] Out of Stock
- 116 [jsx-prop:placeholder] Search products…
- 146 [jsx-prop:message] Could not load products.
- 154 [jsx-prop:message] No products found{…}.
- 158 [jsx-text] Clear search

### src/features/weather/types.ts

- 44 [object:name] Khandwa
- 45 [object:admin1] Madhya Pradesh
- 46 [object:country] India

### src/features/weather/useWeatherLocation.ts

- 72 [object:label] Your current location

### src/features/weather/WeatherForecastChart.tsx

- 10 [string] Sun
- 10 [string] Mon
- 10 [string] Tue
- 10 [string] Wed
- 10 [string] Thu
- 10 [string] Fri
- 10 [string] Sat
- 37 [string] {…}-day forecast: highs {…} to {…} degrees,
- 38 [string] lows {…} to {…} degrees,
- 39 [string] rain up to {…} millimetres in a day
- 98 [jsx-prop:label] High °C
- 99 [jsx-prop:label] Low °C
- 100 [jsx-prop:label] Rain mm

### src/features/weather/WeatherScreen.tsx

- 69 [jsx-text] Weather
- 70 [jsx-text] Location
- 74 [jsx-prop:placeholder] Search a city or place…
- 104 [jsx-text] No places found.
- 113 [jsx-text] Try Khandwa, Madhya Pradesh
- 126 [string] · Use current location
- 136 [jsx-text] Finding your location…
- 142 [jsx-text] Couldn't access your location. Search for a city above to see its weather.
- 157 [jsx-prop:message] Could not load weather for this location.
- 174 [jsx-text] Humidity
- 178 [jsx-text] Recent rainfall
- 179 [jsx-text] mm
- 185 [jsx-text] Tonight's low
- 189 [jsx-text] Next 24h rain
- 190 [jsx-text] mm
- 198 [jsx-text] NEXT 7 DAYS
- 202 [jsx-text] The 7-day trend is unavailable right now.

### src/navigation/CropDoctorStackNavigator.tsx

- 26 [object:title] AI Crop Doctor
- 27 [object:title] Scan Detail

### src/navigation/FarmerStackNavigator.tsx

- 30 [object:title] Farmer Dashboard
- 31 [object:title] My Listings
- 35 [string] Edit Listing
- 35 [string] Add Listing
- 37 [object:title] Payout History
- 38 [object:title] Payout Detail

### src/navigation/MainStackNavigator.tsx

- 42 [object:title] Cart
- 43 [object:title] Select Address
- 44 [object:title] Review Order
- 48 [object:title] Order
- 50 [object:title] My Orders
- 51 [object:title] Mandi Prices
- 52 [object:title] AI Assistant
- 53 [object:title] Notifications

### src/navigation/StoreStackNavigator.tsx

- 28 [object:title] Store

### src/navigation/TabNavigator.tsx

- 60 [object:title] Crop Doctor

### src/notifications/pushNotifications.ts

- 60 [object:name] Default

### src/offline/scoping.ts

- 9 [string] {…}.user.

### src/offline/screenState.ts

- 33 [string] Jan
- 33 [string] Feb
- 33 [string] Mar
- 33 [string] Apr
- 33 [string] May
- 33 [string] Jun
- 33 [string] Jul
- 33 [string] Aug
- 33 [string] Sep
- 33 [string] Oct
- 33 [string] Nov
- 33 [string] Dec

### src/offline/strings.ts

- 4 [object:bannerTitle] You're offline
- 5 [object:bannerBody] Showing the last saved information.
- 6 [object:retry] Retry
- 7 [object:lastUpdated] Last updated
- 8 [object:justNow] just now
- 10 [object:orderMayBeOutOfDate] Order status may be out of date while you're offline.
- 11 [object:addressOnlineOnly] Address shown when online
- 12 [object:addToCartNeedsInternet] Connect to the internet to add to cart
- 13 [object:payNeedsInternet] Connect to the internet to pay.
