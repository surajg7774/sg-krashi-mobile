import AsyncStorage from "@react-native-async-storage/async-storage";
import { queryClient } from "@/shared/queryClient";
import { createOfflineCache } from "./persistence.ts";

// The app's single offline cache controller, bound to the app's QueryClient and AsyncStorage.
export const offlineCache = createOfflineCache({ client: queryClient, storage: AsyncStorage });

export { describeOfflineData, isOfflineError } from "./offlineError.ts";
export { useOfflineData } from "./useOfflineData.ts";
export { isAddressRedacted } from "./sanitize.ts";
