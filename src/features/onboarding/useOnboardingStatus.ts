import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ONBOARDING_SEEN_KEY as STORAGE_KEY } from "@/shared/storageKeys";

/**
 * Same AsyncStorage try/catch/finally shape as useWeatherLocation.ts's
 * storage read — storage being unavailable just means onboarding shows
 * again next launch, never blocks the app from loading.
 */
export const useOnboardingStatus = () => {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        setHasSeenOnboarding(raw === "true");
      } catch {
        // Proceed as if onboarding hasn't been seen — harmless if it
        // reappears once more than strictly necessary.
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const markSeen = () => {
    setHasSeenOnboarding(true);
    AsyncStorage.setItem(STORAGE_KEY, "true").catch(() => {
      // Onboarding still completes for this session even if persisting
      // the flag fails — just means it may show again next launch.
    });
  };

  return { hasSeenOnboarding, isLoading, markSeen };
};
