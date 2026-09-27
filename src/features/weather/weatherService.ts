import { apiClient } from "@/api/client";
import type { CurrentWeather, GeocodingResult } from "./types";

// Public, unauthenticated — same contract as sg-krashi-client's weatherService.ts.
export const weatherService = {
  getCurrentWeather: async (latitude: number, longitude: number): Promise<CurrentWeather> => {
    const response = await apiClient.get<CurrentWeather>("/weather/current", {
      params: { lat: latitude, lon: longitude },
    });
    return response.data;
  },

  searchLocations: async (query: string): Promise<GeocodingResult[]> => {
    const response = await apiClient.get<GeocodingResult[]>("/weather/geocode", {
      params: { query },
    });
    return response.data;
  },
};
