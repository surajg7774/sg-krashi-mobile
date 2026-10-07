// What must disappear from this device when a session ends (logout, account deletion, forced logout after a
// failed token refresh): every cached server response, and the saved weather location. The onboarding flag
// stays - it belongs to the device, not the person.
//
// Pure and free of React Native imports (the query client and the storage are passed in) so it can be
// unit-tested with Node (tests/sessionCleanup.test.ts).
import { WEATHER_LOCATION_KEY } from "./storageKeys.ts";

export interface ClearableQueryClient {
  cancelQueries: () => Promise<unknown>;
  clear: () => void;
}

export interface RemovableStorage {
  removeItem: (key: string) => Promise<void>;
}

type Listener = () => void;
const listeners = new Set<Listener>();

/** Lets in-memory state (e.g. the weather screen's saved location) reset itself when a session is cleared. */
export const subscribeSessionCleared = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const clearLocalUserData = async (deps: { queryClient: ClearableQueryClient; storage: RemovableStorage }): Promise<void> => {
  try {
    // In-flight requests first: a response landing after the clear would put the old user's data straight back.
    await deps.queryClient.cancelQueries();
  } catch {
    // Clear regardless: leaking the previous user's data is the worse failure.
  }
  deps.queryClient.clear();

  try {
    await deps.storage.removeItem(WEATHER_LOCATION_KEY);
  } catch {
    // Storage unavailable: the in-memory reset below still happens.
  }

  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // One misbehaving listener must not stop the others.
    }
  });
};
