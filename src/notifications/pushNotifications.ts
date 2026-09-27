import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { tokenStorage } from "@/api/tokenStorage";
import { notificationService } from "@/features/notifications/notificationService";
import type { DevicePlatform, NotificationRelatedType } from "@/features/notifications/types";

// Foreground presentation — shouldShowBanner:true makes Android/iOS present
// the system heads-up banner even while the app is open, which is what
// satisfies "in-app banner" here rather than a custom-built toast component
// duplicating the same OS-level surface.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const ANDROID_CHANNEL_ID = "default";

/**
 * Requests permission (only ever called from a real user action point —
 * after login — never on cold app launch) and, if granted, registers this
 * device's real FCM/APNs token with the backend via
 * POST /notifications/device-tokens.
 *
 * Genuinely inert until a real Firebase project exists: on Android,
 * getDevicePushTokenAsync() needs a working native FCM module, which needs
 * google-services.json baked into a real build — this call will reject in
 * Expo Go (no FCM in Expo Go on Android since SDK 53) and in any build made
 * before google-services.json is wired in. Failures here are caught and
 * logged, never thrown up to the login flow — a farmer who can't get push
 * notifications yet should still be able to log in and use everything else.
 */
export const ensurePushPermissionAndRegister = async (): Promise<void> => {
  try {
    if (!Device.isDevice) {
      return; // Simulators/emulators have no real push capability.
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== "granted") {
      return;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: "Default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const devicePushToken = await Notifications.getDevicePushTokenAsync();
    const platform: DevicePlatform = Platform.OS === "ios" ? "IOS" : "ANDROID";

    await notificationService.registerDeviceToken(devicePushToken.data, platform);
    await tokenStorage.setDevicePushToken(devicePushToken.data);
  } catch (error) {
    console.warn("Push notification registration skipped:", error);
  }
};

/** Called on logout — stops the backend from sending push to a device nobody's logged into any more. */
export const unregisterPushToken = async (): Promise<void> => {
  try {
    const token = await tokenStorage.getDevicePushToken();
    if (token) {
      await notificationService.unregisterDeviceToken(token);
      await tokenStorage.clearDevicePushToken();
    }
  } catch (error) {
    console.warn("Push token unregistration failed:", error);
  }
};

export interface NotificationDeepLink {
  relatedType: NotificationRelatedType | null;
  relatedId: number | null;
}

/** Parses the data payload FcmNotificationSender attaches (see its Javadoc) into a typed deep-link target, or null if the notification carries no navigable target. */
export const parseNotificationDeepLink = (data: Record<string, unknown>): NotificationDeepLink | null => {
  const relatedType = typeof data.relatedType === "string" && data.relatedType ? (data.relatedType as NotificationRelatedType) : null;
  const relatedIdRaw = typeof data.relatedId === "string" ? data.relatedId : "";
  const relatedId = relatedIdRaw ? Number(relatedIdRaw) : null;
  if (!relatedType || relatedId === null || Number.isNaN(relatedId)) {
    return null;
  }
  return { relatedType, relatedId };
};
