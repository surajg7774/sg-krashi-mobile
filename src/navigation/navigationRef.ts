import { createNavigationContainerRef } from "@react-navigation/native";
import type { NotificationDeepLink } from "@/notifications/pushNotifications";

// Untyped on purpose — used from exactly one place (notification-tap
// deep-linking) that needs to reach across whichever top-level navigator is
// currently mounted (GuestStackNavigator vs MainStackNavigator), which
// don't share a single param-list type. navigate() calls below are cast
// per-call instead of forcing a global RootParamList merge for this one
// use case.
export const navigationRef = createNavigationContainerRef();

/**
 * Only ORDER and PAYOUT currently have a real screen to land on — BOOKING/
 * INQUIRY/FARMER_PROFILE notifications exist on the backend (other business
 * lines already fire them) but those areas aren't built in this mobile app
 * yet, so there's genuinely nowhere to navigate; the notification is still
 * readable in the Notification Center itself either way.
 */
export const navigateToNotificationTarget = (link: NotificationDeepLink) => {
  if (!navigationRef.isReady()) {
    return;
  }

  // Cast to `any` at the call site only — this ref deliberately has no
  // global RootParamList (see the const's own comment), so its `navigate`
  // overloads resolve to `never` for any args, not just the wrong ones.
  const navigate = (navigationRef as unknown as { navigate: (...args: unknown[]) => void }).navigate;

  if (link.relatedType === "ORDER") {
    navigate("OrderConfirmation", { orderId: link.relatedId });
    return;
  }

  if (link.relatedType === "PAYOUT") {
    navigate("MainTabs", { screen: "Farmer", params: { screen: "FarmerPayoutDetail", params: { payoutId: link.relatedId } } });
    return;
  }

  console.warn(`No mobile screen yet for notification relatedType=${link.relatedType}`);
};
