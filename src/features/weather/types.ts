// Mirrors sg-krashi-client/src/features/weather/types.ts exactly — same
// backend endpoint (public, unauthenticated /api/v1/weather/*).
export interface CurrentWeather {
  temperatureCelsius: number;
  humidityPercent: number;
  recentRainfallMm: number;
  forecastSummary: string;
  forecastMinTempCelsius: number;
  forecastPrecipitationNext24hMm: number;
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
  name: "Khandwa",
  admin1: "Madhya Pradesh",
  country: "India",
  latitude: 21.83,
  longitude: 76.35,
};
