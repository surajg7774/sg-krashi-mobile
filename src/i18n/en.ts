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
  auth: {
    login: {
      title: "Log in",
      email: "Email",
      password: "Password",
      submit: "Log in",
      failed: "Login failed. Please try again.",
      signUpLink: "Don't have an account? Sign up",
      guestCropDoctor: "Try AI Crop Doctor without an account →",
    },
    register: {
      title: "Create Account",
      fullName: "Full name",
      email: "Email",
      phone: "Phone (optional)",
      password: "Password (min. 8 characters)",
      submit: "Create Account",
      failed: "Could not create your account. Please try again.",
      consent: "By signing up you agree to the {terms} and {privacy}.",
      terms: "Terms",
      privacy: "Privacy Policy",
      loginLink: "Already have an account? Log in",
    },
    otp: {
      title: "Verify your email",
      sentTo: "We've sent a 6-digit code to\n{email}",
      verify: "Verify",
      verifyFailed: "Could not verify this code. Please try again.",
      didntGetCode: "Didn't get a code?",
      resendIn: "Resend in {seconds}s",
      sending: "Sending...",
      resend: "Resend code",
      resendFailed: "Could not resend the code. Please try again.",
      backToLogin: "Back to Log In",
    },
    google: {
      cancelled: "Google sign-in was cancelled or rejected.",
      unexpected: "Google sign-in did not complete (unexpected response). Please try again.",
      failedWithCode: "Google sign-in failed ({code}): {message}",
      failed: "Could not sign in with Google. Please try again.",
    },
  },
  onboarding: {
    skip: "Skip",
    getStarted: "Get Started",
    welcomeTitle: "Welcome to SG Krashi",
    welcomeBody:
      "One platform connecting farmers and buyers — shop fresh produce, manage your farm, and get smart farming help, all in one app.",
    storeTitle: "Shop the Store",
    storeBody: "Browse fresh, organic produce and farm essentials sourced directly from local farms.",
    cropsTitle: "Crop Marketplace",
    cropsBody: "Buy fresh grain, pulse and vegetable batches listed directly by farms, and see when each was harvested.",
    doctorTitle: "AI Crop Doctor & Assistant",
    doctorBody: "Snap a photo of your crop to instantly diagnose issues, or chat with our AI Assistant for farming advice anytime.",
    weatherTitle: "Weather & Mandi Prices",
    weatherBody: "Check live weather forecasts for your farm and track daily mandi (market) prices before you sell.",
  },
  home: {
    welcome: "Welcome",
    welcomeName: "Welcome, {name}",
    links: {
      store: "Store",
      cropDoctor: "Crop Doctor",
      weather: "Weather",
      mandi: "Mandi Prices",
      assistant: "AI Assistant",
      cropMarketplace: "Crop Marketplace",
    },
    featuredProducts: "Featured Products",
    productsLoadError: "Could not load products.",
    productsEmpty: "No featured products right now — check back soon.",
    forYou: "For You",
  },
  weather: {
    title: "Weather",
    location: "Location",
    searchPlaceholder: "Search a city or place…",
    noPlaces: "No places found.",
    trySuggestion: "Try {place}",
    currentLocation: "Your current location",
    useCurrentLocation: "Use current location",
    finding: "Finding your location…",
    locationUnavailable: "Couldn't access your location. Search for a city above to see its weather.",
    loadError: "Could not load weather for this location.",
    humidity: "Humidity",
    recentRainfall: "Recent rainfall",
    tonightLow: "Tonight's low",
    next24hRain: "Next 24h rain",
    next7Days: "NEXT 7 DAYS",
    trendUnavailable: "The 7-day trend is unavailable right now.",
    chart: {
      high: "High °C",
      low: "Low °C",
      rain: "Rain mm",
      summary:
        "{days}-day forecast: highs {highMin} to {highMax} degrees, lows {lowMin} to {lowMax} degrees, rain up to {rainMax} millimetres in a day",
    },
  },
  // The Crop Marketplace (moved here unchanged from the former crop-marketplace/strings.ts; the key names still follow
  // the website's cropMarketplace.json, and the Hindi reuses the website's wording where the two overlap).
  crops: {
    browse: {
      title: "Crop Marketplace",
      subtitle: "Fresh grain, pulse, and vegetable batches, sold directly from the farm.",
      filters: "Filters",
      empty: "No crop listings match your filters.",
      emptySearch: 'No crop listings found for "{search}".',
      emptyNone: "There are no crop listings right now. Please check back soon.",
      clearFilters: "Clear filters",
      clearSearch: "Clear search",
      showResults: "Show Results",
      loadError: "Could not load crop listings.",
      storeEntrySubtitle: "Browse fresh crops from farms",
      homeSection: "Fresh Crops",
      homeEmpty: "No crop listings right now. Check back soon.",
    },
    filters: {
      searchPlaceholder: "Search crops…",
      all: "All",
      priceRange: "Price Range",
      minPrice: "Min (₹)",
      maxPrice: "Max (₹)",
      organicOnly: "Organic certified only",
      harvestDate: "Harvest Date",
      from: "From",
      to: "To",
      anyDate: "Any date",
      close: "Close filters",
      errors: {
        priceInvalid: "Enter prices as numbers, for example 20 or 20.50.",
        priceOrder: "The lowest price is higher than the highest price.",
        harvestInvalid: "Enter dates as YYYY-MM-DD.",
        harvestOrder: "The start date is after the end date.",
      },
    },
    detail: {
      notFound: "We couldn't find that crop listing.",
      loadError: "Could not load this crop listing.",
      organicCertified: "Organic Certified",
      organic: "Organic",
      soldOut: "Sold Out",
      available: "{count} available",
      addToCart: "Add to Cart",
      addedToCart: "Added to cart",
      addError: "Could not add to cart. Please try again.",
      similarItems: "Similar Items",
      youMightAlsoLike: "You Might Also Like",
      reviews: "Reviews",
      decreaseQuantity: "Decrease quantity",
      increaseQuantity: "Increase quantity",
      quantity: "Quantity",
      noImage: "No image available",
      photoOf: "Photo {index} of {total}",
    },
    reviews: {
      empty: "No reviews yet.",
      anonymous: "Anonymous",
      loadError: "Could not load reviews.",
      showMore: "Show more reviews",
      summary: "{rating} out of 5, {count} reviews",
      reviewA11y: "{name}, {rating} out of 5. {comment}",
    },
    harvest: {
      upcoming: "Harvest: {date}",
      past: "Harvested: {date}",
    },
    farmer: {
      active: "Active",
      inactive: "Inactive",
      soldOut: "Sold out",
      available: "{count} available",
      uncategorized: "Uncategorized",
      markSoldOut: "Mark Sold Out",
      markSoldOutTitle: "Mark as sold out",
      markSoldOutBody:
        '"{name}" will show as Sold Out and buyers will not be able to add it to their cart. To sell it again, enter a new Quantity Available and save.',
      markSoldOutDoneTitle: "Marked as sold out",
      markSoldOutDoneBody: "This listing now shows as Sold Out.",
      markSoldOutError: "Could not mark this listing as sold out.",
      listingRow: "{name}, {category}, {status}, {price}",
    },
    a11y: {
      listing: "Open {label}",
      categoryChip: "Crop type {name}",
      filtersButton: "Filters, {count} active",
      filtersButtonNone: "Filters",
      searchField: "Search crop listings",
      organicCertified: "Organic certified",
      soldOut: "Sold out",
      available: "Available",
    },
  },
} as const;

type Widen<T> = T extends string ? string : T extends PluralForms ? PluralForms : { readonly [K in keyof T]: Widen<T[K]> };

/** The shape every language must provide: the same keys as English, any wording. */
export type Messages = Widen<typeof en>;
