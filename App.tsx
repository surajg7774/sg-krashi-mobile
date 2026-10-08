import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { I18nProvider } from "@/i18n/I18nProvider";
import { RootNavigator } from "@/navigation/RootNavigator";
import { OfflineCacheProvider } from "@/offline/OfflineCacheProvider";
import { queryClient } from "@/shared/queryClient";

// Start loading the icon font now (the tab bar draws it on the first frame). Nothing waits for it: an icon whose font
// is not there yet simply renders empty for a moment, and a failure only means the icons stay empty.
void Ionicons.loadFont().catch(() => undefined);

// I18nProvider never holds rendering back: it starts in the device language and switches once if the saved choice
// differs (that read starts when the i18n module loads, before this renders). See docs/I18N_DECISIONS.md, D10.
export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <OfflineCacheProvider>
              <RootNavigator />
            </OfflineCacheProvider>
            <StatusBar style="dark" />
          </AuthProvider>
        </QueryClientProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
