// Every piece of text the Crop Marketplace screens show, in one place.
//
// The structure and key names follow the website's translation file (sg-krashi-client/src/shared/i18n/locales/en/
// cropMarketplace.json, with a Hindi twin in .../hi/cropMarketplace.json) so that Item 8 (Hindi) can fill this in from
// the web's wording without touching the screens. Keys that exist only on mobile are marked "mobile".
// Placeholders use the same {{name}} style; fill them with `fill()` from cropLogic.ts.

export const cropStrings = {
  browse: {
    title: "Crop Marketplace",
    subtitle: "Fresh grain, pulse, and vegetable batches, sold directly from the farm.",
    filters: "Filters",
    empty: "No crop listings match your filters.",
    emptySearch: 'No crop listings found for "{{search}}".', // mobile
    emptyNone: "There are no crop listings right now. Please check back soon.", // mobile
    clearFilters: "Clear filters",
    clearSearch: "Clear search", // mobile
    showResults: "Show Results",
    loadError: "Could not load crop listings.", // mobile
    retry: "Retry", // mobile
    storeEntrySubtitle: "Browse fresh crops from farms", // mobile (the Store screen's shortcut)
    homeSection: "Fresh Crops", // mobile (Home section title)
    homeEmpty: "No crop listings right now. Check back soon.", // mobile
  },
  filters: {
    search: "Search",
    searchLabel: "Search crop listings",
    searchPlaceholder: "Search crops…", // mobile
    cropType: "Crop Type",
    all: "All",
    priceRange: "Price Range",
    minPrice: "Min (₹)", // mobile
    maxPrice: "Max (₹)", // mobile
    organicOnly: "Organic certified only",
    harvestDate: "Harvest Date",
    from: "From",
    to: "To",
    anyDate: "Any date", // mobile
    errors: {
      priceInvalid: "Enter prices as numbers, for example 20 or 20.50.", // mobile
      priceOrder: "The lowest price is higher than the highest price.", // mobile
      harvestInvalid: "Enter dates as YYYY-MM-DD.", // mobile
      harvestOrder: "The start date is after the end date.", // mobile
    },
  },
  detail: {
    notFound: "We couldn't find that crop listing.",
    loadError: "Could not load this crop listing.", // mobile
    organicCertified: "Organic Certified",
    organic: "Organic", // mobile (card chip)
    soldOut: "Sold Out",
    available: "{{count}} available", // mobile
    addToCart: "Add to Cart",
    addedToCart: "Added to cart",
    addError: "Could not add to cart. Please try again.", // mobile
    similarItems: "Similar Items",
    youMightAlsoLike: "You Might Also Like", // web: RelatedCropListings
    reviews: "Reviews",
    decreaseQuantity: "Decrease quantity",
    increaseQuantity: "Increase quantity",
    quantity: "Quantity", // mobile
    noImage: "No image available", // mobile
    photoOf: "Photo {{index}} of {{total}}", // mobile
  },
  reviews: {
    empty: "No reviews yet.", // mobile
    anonymous: "Anonymous", // same fallback as the website's review list
    loadError: "Could not load reviews.", // mobile
    showMore: "Show more reviews", // mobile
    summary: "{{rating}} out of 5, {{count}} reviews", // mobile (screen reader)
  },
  // The farmer's own listings (mobile only: the website's farmer screens are not translated from this file).
  farmer: {
    active: "Active",
    inactive: "Inactive",
    soldOut: "Sold out",
    available: "{{count}} available",
    uncategorized: "Uncategorized",
    markSoldOut: "Mark Sold Out",
    markSoldOutTitle: "Mark as sold out",
    markSoldOutBody: '"{{name}}" will show as Sold Out and buyers will not be able to add it to their cart. To sell it again, enter a new Quantity Available and save.',
    markSoldOutDoneTitle: "Marked as sold out",
    markSoldOutDoneBody: "This listing now shows as Sold Out.",
    markSoldOutError: "Could not mark this listing as sold out.",
    cancel: "Cancel",
    listingRow: "{{name}}, {{category}}, {{status}}, {{price}}",
  },
  a11y: {
    listing: "Open {{label}}", // mobile
    categoryChip: "Crop type {{name}}", // mobile
    filtersButton: "Filters, {{count}} active", // mobile
    filtersButtonNone: "Filters", // mobile
    searchField: "Search crop listings", // mobile
  },
} as const;
