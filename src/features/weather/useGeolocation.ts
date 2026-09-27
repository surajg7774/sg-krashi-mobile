import { useCallback, useState } from "react";
import * as Location from "expo-location";

export type GeolocationStatus = "idle" | "loading" | "granted" | "denied" | "unavailable";

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
}

/**
 * Native counterpart to sg-krashi-client's useGeolocation.ts — same
 * "request() rather than fire-on-mount" contract, same collapse of every
 * failure mode (permission denied, services off, timeout) into one fallback
 * outcome for the caller (useWeatherLocation only ever checks `denied` vs
 * `unavailable` to decide whether to show the manual-search prompt, never
 * to branch behavior differently).
 */
export const useGeolocation = () => {
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [coords, setCoords] = useState<GeolocationCoords | null>(null);

  const request = useCallback(async () => {
    setStatus("loading");
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setStatus("unavailable");
        return;
      }

      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== "granted") {
        setStatus("denied");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setStatus("granted");
    } catch {
      setStatus("unavailable");
    }
  }, []);

  return { status, coords, request };
};
