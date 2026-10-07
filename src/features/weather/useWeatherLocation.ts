import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WEATHER_LOCATION_KEY as STORAGE_KEY } from "@/shared/storageKeys";
import { subscribeSessionCleared } from "@/shared/sessionCleanup";
import { useGeolocation } from "./useGeolocation";
import type { WeatherLocation } from "./types";

interface StoredManualLocation {
  latitude: number;
  longitude: number;
  label: string;
}

/**
 * Native counterpart to sg-krashi-client's useWeatherLocation.ts — same
 * precedence rule (a saved manual pick always wins over geolocation, and
 * geolocation is only requested when there isn't one). AsyncStorage reads
 * are async (unlike the web version's synchronous localStorage), so this
 * adds a `hasLoadedStorage` gate purely to avoid a one-frame flash where
 * geolocation gets requested before the storage read has even had a chance
 * to find a saved override.
 */
export const useWeatherLocation = () => {
  const [manualLocation, setManualLocationState] = useState<StoredManualLocation | null>(null);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const geolocation = useGeolocation();

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setManualLocationState(JSON.parse(raw) as StoredManualLocation);
        }
      } catch {
        // Storage unavailable — proceed as if nothing was saved.
      } finally {
        setHasLoadedStorage(true);
      }
    })();
  }, []);

  // When a session ends (logout, account deletion, forced logout) the saved pick is removed from storage by
  // clearLocalUserData; this resets the copy held in memory too, so a mounted screen cannot show it afterwards.
  useEffect(() => subscribeSessionCleared(() => setManualLocationState(null)), []);

  useEffect(() => {
    if (hasLoadedStorage && !manualLocation) {
      void geolocation.request();
    }
    // Deliberately only re-runs when the storage load finishes or the
    // manual override is cleared (useCurrentLocation below) — not on every
    // render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoadedStorage, manualLocation === null]);

  const setManualLocation = (next: StoredManualLocation) => {
    setManualLocationState(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
      // The pick still works for this session even if persisting it fails.
    });
  };

  const useCurrentLocation = () => {
    setManualLocationState(null);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  };

  const location: WeatherLocation | null = manualLocation
    ? { ...manualLocation, source: "manual" }
    : geolocation.status === "granted" && geolocation.coords
      ? { ...geolocation.coords, label: "Your current location", source: "geolocation" } // i18n-ignore (the screen shows the translated text for this source)
      : null;

  const needsManualPrompt =
    hasLoadedStorage && !manualLocation && (geolocation.status === "denied" || geolocation.status === "unavailable");
  const isResolving =
    !hasLoadedStorage || (!manualLocation && (geolocation.status === "idle" || geolocation.status === "loading"));

  return {
    location,
    needsManualPrompt,
    isResolving,
    setManualLocation,
    useCurrentLocation,
    retryGeolocation: geolocation.request,
  };
};
