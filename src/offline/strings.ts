// Wording for the offline UI, in one place. The app is not localized yet and every existing string is plain English,
// so these are too; when the Hindi work (roadmap item 8) lands this is the file to translate.
export const OFFLINE_STRINGS = {
  bannerTitle: "You're offline",
  bannerBody: "Showing the last saved information.",
  retry: "Retry",
  lastUpdated: "Last updated",
  justNow: "just now",
  yesterday: "yesterday",
  orderMayBeOutOfDate: "Order status may be out of date while you're offline.",
  addressOnlineOnly: "Address shown when online",
  addToCartNeedsInternet: "Connect to the internet to add to cart",
  payNeedsInternet: "Connect to the internet to pay.",
} as const;
