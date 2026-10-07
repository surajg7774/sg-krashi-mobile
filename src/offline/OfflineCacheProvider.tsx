import { useEffect, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { queryClient } from "@/shared/queryClient";
import { refetchOfflineErrors } from "./foregroundRefetch";
import { offlineCache } from "./index";

// Longest the app waits for the stored copy before rendering anyway. The restore normally takes a few
// milliseconds; on a slow or failing storage the app must still start.
const RESTORE_CAP_MS = 1000;

interface Props {
  children: ReactNode;
}

/**
 * Sits inside AuthProvider. Restores the public copy before the first render (capped), restores the signed-in user's
 * private copy once the user is known, saves in the background while the app runs, and saves at once when the app
 * goes to the background. Nothing here can throw into the app: every storage call is already guarded.
 */
export const OfflineCacheProvider = ({ children }: Props) => {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const cap = setTimeout(() => alive && setReady(true), RESTORE_CAP_MS);
    offlineCache
      .restorePublic()
      .catch(() => 0)
      .finally(() => {
        clearTimeout(cap);
        if (alive) setReady(true);
      });
    const stop = offlineCache.start();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        void offlineCache.saveNow();
      } else {
        // Back in the app: refresh only the saved-data screens that are showing an offline error, so the banner clears.
        void refetchOfflineErrors(queryClient);
      }
    });
    return () => {
      alive = false;
      clearTimeout(cap);
      stop();
      subscription.remove();
    };
  }, []);

  const userId = user?.id ?? null;
  useEffect(() => {
    offlineCache.setActiveUser(userId);
    if (userId !== null) {
      void offlineCache.restorePrivate(userId).catch(() => 0);
    }
  }, [userId]);

  return ready ? <>{children}</> : null;
};
