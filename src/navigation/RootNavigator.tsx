import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { useAuth } from "@/context/AuthContext";
import { GuestStackNavigator } from "./GuestStackNavigator";
import { MainStackNavigator } from "./MainStackNavigator";
import { navigationRef, navigateToNotificationTarget } from "./navigationRef";
import { parseNotificationDeepLink } from "@/notifications/pushNotifications";
import { colors } from "@/theme/colors";

// Handles both cases a notification tap can reach the app through: the live
// listener (app already running, backgrounded) and getLastNotificationResponseAsync
// (app was killed — the tap is what launched this process, so there's no
// "already running" listener to have caught it).
const useNotificationTapHandler = () => {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const link = parseNotificationDeepLink(response.notification.request.content.data ?? {});
      if (link) navigateToNotificationTarget(link);
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const link = parseNotificationDeepLink(response.notification.request.content.data ?? {});
      if (link) navigateToNotificationTarget(link);
    });

    return () => subscription.remove();
  }, []);
};

export const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  useNotificationTapHandler();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <MainStackNavigator /> : <GuestStackNavigator />}
    </NavigationContainer>
  );
};
