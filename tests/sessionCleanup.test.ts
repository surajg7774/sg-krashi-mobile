import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { clearLocalUserData, subscribeSessionCleared } from "../src/shared/sessionCleanup.ts";
import { LANGUAGE_KEY, ONBOARDING_SEEN_KEY, WEATHER_LOCATION_KEY } from "../src/shared/storageKeys.ts";

const fakeQueryClient = (cancelFails = false) => {
  const calls: string[] = [];
  return {
    calls,
    cancelQueries: async () => {
      calls.push("cancelQueries");
      if (cancelFails) throw new Error("boom");
    },
    clear: () => {
      calls.push("clear");
    },
  };
};

const fakeStorage = (removeFails = false) => {
  const removed: string[] = [];
  return {
    removed,
    removeItem: async (key: string) => {
      removed.push(key);
      if (removeFails) throw new Error("storage unavailable");
    },
  };
};

test("in-flight queries are cancelled, then the whole cache is cleared", async () => {
  const queryClient = fakeQueryClient();
  await clearLocalUserData({ queryClient, storage: fakeStorage() });
  assert.deepEqual(queryClient.calls, ["cancelQueries", "clear"]);
});

test("the saved weather location is removed and the onboarding flag is never touched", async () => {
  const storage = fakeStorage();
  await clearLocalUserData({ queryClient: fakeQueryClient(), storage });
  assert.deepEqual(storage.removed, [WEATHER_LOCATION_KEY]);
  assert.ok(!storage.removed.includes(ONBOARDING_SEEN_KEY));
  assert.notEqual(WEATHER_LOCATION_KEY, ONBOARDING_SEEN_KEY);
});

test("the app language survives logout, account deletion and a forced logout (all go through this cleanup)", async () => {
  const storage = fakeStorage();
  await clearLocalUserData({ queryClient: fakeQueryClient(), storage, offlineCache: { clearPrivate: async () => {} } });
  assert.ok(!storage.removed.includes(LANGUAGE_KEY));
  assert.equal(LANGUAGE_KEY, "sgkrashi.language");
  assert.notEqual(LANGUAGE_KEY, WEATHER_LOCATION_KEY);
  assert.notEqual(LANGUAGE_KEY, ONBOARDING_SEEN_KEY);
});

test("the storage keys are the ones the hooks have always used (existing installs keep working)", () => {
  assert.equal(WEATHER_LOCATION_KEY, "sgkrashi.weatherLocation");
  assert.equal(ONBOARDING_SEEN_KEY, "sgkrashi.hasSeenOnboarding");
});

test("in-memory state is reset through the subscription, and unsubscribing works", async () => {
  let resets = 0;
  const unsubscribe = subscribeSessionCleared(() => {
    resets++;
  });
  await clearLocalUserData({ queryClient: fakeQueryClient(), storage: fakeStorage() });
  assert.equal(resets, 1);
  unsubscribe();
  await clearLocalUserData({ queryClient: fakeQueryClient(), storage: fakeStorage() });
  assert.equal(resets, 1);
});

test("a failing cancel, a failing storage or a throwing listener never stops the rest of the cleanup", async () => {
  let reached = false;
  const unsubscribeBad = subscribeSessionCleared(() => {
    throw new Error("bad listener");
  });
  const unsubscribeGood = subscribeSessionCleared(() => {
    reached = true;
  });
  const queryClient = fakeQueryClient(true);
  const storage = fakeStorage(true);
  await clearLocalUserData({ queryClient, storage });
  assert.deepEqual(queryClient.calls, ["cancelQueries", "clear"]);
  assert.deepEqual(storage.removed, [WEATHER_LOCATION_KEY]);
  assert.ok(reached);
  unsubscribeBad();
  unsubscribeGood();
});

// ---- wiring: all three session-ending paths reach clearLocalUserData (source checks; comments stripped) ----
const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\/\/.*$/gm, "");

test("logout() clears local user data", () => {
  const auth = read("../src/context/AuthContext.tsx");
  const logout = auth.slice(auth.indexOf("const logout = useCallback"), auth.indexOf("const refreshTokens"));
  assert.match(logout, /clearLocalUserData\(\{\s*queryClient,\s*storage:\s*AsyncStorage,\s*offlineCache\s*\}\)/);
});

test("forced logout (refresh rejected) calls logout()", () => {
  const auth = read("../src/context/AuthContext.tsx");
  assert.match(auth.slice(auth.indexOf("registerAuthHandlers({")), /onAuthFailure:\s*\(\)\s*=>\s*\{\s*void logout\(\);/);
});

test("account deletion ends in logout()", () => {
  const modal = read("../src/features/profile/DeleteAccountModal.tsx");
  const handler = modal.slice(modal.indexOf("const handleDelete"), modal.indexOf("const canSubmit"));
  assert.match(handler, /await accountService\.deleteAccount\([\s\S]*?await logout\(\)/);
});

test("the app and AuthContext share one QueryClient instance (no second client to forget)", () => {
  assert.match(read("../App.tsx"), /import \{ queryClient \} from "@\/shared\/queryClient"/);
  assert.doesNotMatch(read("../App.tsx"), /new QueryClient/);
  assert.match(read("../src/context/AuthContext.tsx"), /import \{ queryClient \} from "@\/shared\/queryClient"/);
});

test("the onboarding hook still reads its own flag and the weather hook subscribes to the reset", () => {
  assert.match(read("../src/features/onboarding/useOnboardingStatus.ts"), /ONBOARDING_SEEN_KEY as STORAGE_KEY/);
  const weather = read("../src/features/weather/useWeatherLocation.ts");
  assert.match(weather, /WEATHER_LOCATION_KEY as STORAGE_KEY/);
  assert.match(weather, /subscribeSessionCleared\(\(\) => setManualLocationState\(null\)\)/);
});
