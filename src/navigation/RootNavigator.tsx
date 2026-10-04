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
import { OnboardingScreen } from "@/features/onboarding/OnboardingScreen";
import { useOnboardingStatus } from "@/features/onboarding/useOnboardingStatus";

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
  const { hasSeenOnboarding, isLoading: onboardingLoading, markSeen } = useOnboardingStatus();
  useNotificationTapHandler();

  if (isLoading || onboardingLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Rendered outside NavigationContainer entirely — a one-time, linear
  // intro has no navigation needs of its own (no back button to manage, no
  // route to accidentally return to), so it doesn't need to be a screen in
  // GuestStackNavigator. Only shown pre-login, per the task's own framing
  // ("before login/register") — an already-authenticated session (e.g. a
  // token surviving a reinstall-adjacent edge case) skips straight past it.
  if (!isAuthenticated && !hasSeenOnboarding) {
    return <OnboardingScreen onDone={markSeen} />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <MainStackNavigator /> : <GuestStackNavigator />}
    </NavigationContainer>
  );
};
