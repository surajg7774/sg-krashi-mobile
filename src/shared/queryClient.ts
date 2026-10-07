import { QueryClient } from "@tanstack/react-query";

// The app's single QueryClient. Lives in its own module (not App.tsx) so AuthContext can clear it when a
// session ends without importing App, which would be circular. Settings are unchanged from the old inline
// `new QueryClient()`.
export const queryClient = new QueryClient();
