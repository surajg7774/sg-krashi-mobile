import { QueryClient } from "@tanstack/react-query";
import { applyCachedQueryDefaults } from "@/offline/queryPolicy";

// The app's single QueryClient. Lives in its own module (not App.tsx) so AuthContext can clear it when a
// session ends without importing App, which would be circular. Settings are unchanged from the old inline
// `new QueryClient()`.
export const queryClient = new QueryClient();

// Fewer retries (and fail fast when offline) for the screens that have an offline copy, and only for those.
applyCachedQueryDefaults(queryClient);
