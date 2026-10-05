import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { NOTIFICATIONS_QUERY_KEY } from "@/features/notifications/NotificationCenterScreen";
import { parseNotificationDeepLink } from "./pushNotifications";

/**
 * While the app is open, a push about an order lands as a banner but, on its
 * own, leaves an already-open order screen showing the old status until the
 * next poll. This refreshes exactly what that push is about: the order's own
 * screen, the order list, and the notification list. Pushes about anything
 * else are ignored.
 */
export const useOrderPushRefresh = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const link = parseNotificationDeepLink(notification.request.content.data ?? {});
      if (!link || link.relatedType !== "ORDER" || link.relatedId === null) return;
      void queryClient.invalidateQueries({ queryKey: ["order", link.relatedId] });
      void queryClient.invalidateQueries({ queryKey: ["orders", "my"] });
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    });
    return () => subscription.remove();
  }, [queryClient]);
};
