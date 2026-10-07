// Mirrors sg-krashi-client/src/features/weather/types.ts exactly — same
// backend endpoint (public, unauthenticated /api/v1/weather/*).
// One day of the 7-day forecast, in the location's own timezone ("YYYY-MM-DD").
export interface DailyForecastPoint {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  rainMm: number;
}

export interface CurrentWeather {
  temperatureCelsius: number;
  humidityPercent: number;
  recentRainfallMm: number;
  forecastSummary: string;
  forecastMinTempCelsius: number;
  forecastPrecipitationNext24hMm: number;
  // Empty when the server's separate daily-forecast call failed; absent on
  // servers older than this field.
  daily?: DailyForecastPoint[];
}

export interface GeocodingResult {
  name: string;
  admin1: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

export type WeatherLocationSource = "geolocation" | "manual";

export interface WeatherLocation {
  latitude: number;
  longitude: number;
  label: string;
  source: WeatherLocationSource;
}

// Deliberate, clickable-only last-resort suggestion — same coordinates as
// the web app's KHANDWA_SUGGESTION and the backend's own hardcoded farm
// location (WeatherServiceImpl.java).
export const KHANDWA_SUGGESTION: GeocodingResult = {
  name: "Khandwa", // i18n-ignore (place-name data for the default suggestion)
  admin1: "Madhya Pradesh", // i18n-ignore
  country: "India", // i18n-ignore
  latitude: 21.83,
  longitude: 76.35,
};
