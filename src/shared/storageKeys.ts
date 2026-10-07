// AsyncStorage keys in one place, so the session cleanup and the hooks that own the data cannot drift apart.
// Pure constants (no imports) so tests can read them under Node.

/** Saved manual weather location (latitude, longitude, label). Personal: removed when a session ends. */
export const WEATHER_LOCATION_KEY = "sgkrashi.weatherLocation";

/** "This device has shown the onboarding slides". Belongs to the device: must survive logout and deletion. */
export const ONBOARDING_SEEN_KEY = "sgkrashi.hasSeenOnboarding";
