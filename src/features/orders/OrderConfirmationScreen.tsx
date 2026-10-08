import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "@/theme/colors";
import { MEDIA_WIDTH, resizedMediaUrl } from "@/shared/media";
import { trimName } from "@/features/crop-marketplace/cropLogic";
import { useAuth } from "@/context/AuthContext";
import { orderService } from "./orderService";
import { paymentService } from "@/features/payment/paymentService";
import { RazorpayWebView, type RazorpaySuccessPayload } from "@/features/payment/RazorpayWebView";
import type { PaymentInitiation } from "@/features/payment/types";
import { OrderTimeline } from "./OrderTimeline";
import { isActiveOrderStatus } from "./orderTimelineSteps";
import { orderStatusColor, orderStatusLabel, orderStatusTitle } from "./orderStatusDisplay";
import type { MainStackParamList } from "@/navigation/MainStackNavigator";
import { ErrorState } from "@/components/ErrorState";
import { LastUpdated } from "@/components/LastUpdated";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useOfflineData } from "@/offline/useOfflineData";
import { canOfferPayment, orderAddressView, shouldShowFullError, shouldShowOfflineBanner } from "@/offline/screenState";
import { useT } from "@/i18n/useT";

type Navigation = NativeStackNavigationProp<MainStackParamList, "OrderConfirmation">;
type ConfirmationRoute = RouteProp<MainStackParamList, "OrderConfirmation">;

// Same polling shape as sg-krashi-client's useOrderDetail.ts: keep polling
// only while the order is still waiting on the async webhook to resolve it.
const ACTIVE_POLL_INTERVAL_MS = 3000;

// Once paid, an order keeps moving (shipped, delivered) without any push reaching
// a screen that is already open in the background — re-check gently, and let a
// foreground push refresh it immediately (see useOrderPushRefresh).
const IN_PROGRESS_POLL_INTERVAL_MS = 30_000;

// The web app polls forever with no fallback — fine there, since a page
// reload is trivial. On mobile, a spinner with no end in sight reads as
// "the app is broken," not "the webhook is slow." This doesn't stop the
// polling (the webhook might still land any moment, and the query above
// keeps refetching regardless) — it just stops presenting it as an
// active wait after a while and hands the user a real next step instead.
const POLL_TIMEOUT_MS = 45_000;

export const OrderConfirmationScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { params } = useRoute<ConfirmationRoute>();
  const { user } = useAuth();
  const { t, lang } = useT();
  const queryClient = useQueryClient();
  const [initiation, setInitiation] = useState<PaymentInitiation | null>(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pollTimedOut, setPollTimedOut] = useState(false);

  const orderQuery = useQuery({
    queryKey: ["order", params.orderId],
    queryFn: () => orderService.getOrderDetail(params.orderId),
    refetchInterval: (query) => {
      const current = query.state.data?.status;
      if (current === "PENDING_PAYMENT") return ACTIVE_POLL_INTERVAL_MS;
      return current && isActiveOrderStatus(current) ? IN_PROGRESS_POLL_INTERVAL_MS : false;
    },
  });

  const status = orderQuery.data?.status;
  const offline = useOfflineData(orderQuery);

  // Covers both "just paid, waiting on the webhook" and "came back later to
  // an order that's still pending" — starts counting whenever this screen
  // is looking at a PENDING_PAYMENT order, not only right after Pay Now.
  useEffect(() => {
    if (status !== "PENDING_PAYMENT") {
      setPollTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setPollTimedOut(true), POLL_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [status, params.orderId]);

  const initiateMutation = useMutation({
    mutationFn: () => paymentService.initiatePayment({ payableType: "ORDER", payableId: params.orderId }),
    onSuccess: setInitiation,
    onError: () => setPaymentError(t("orders.startPaymentError")),
  });

  const handlePayNow = () => {
    setPaymentError(null);
    initiateMutation.mutate();
  };

  const handlePaymentSuccess = (_payload: RazorpaySuccessPayload) => {
    // Same caveat as the web app's RazorpayCheckoutButton: this confirms
    // only that the customer completed the checkout modal, not that the
    // payment actually succeeded — the real status is decided server-side
    // by Razorpay's webhook, which orderQuery above is already polling for.
    setInitiation(null);
    setPaymentSubmitted(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handlePaymentDismiss = () => {
    setInitiation(null);
  };

  const handlePaymentError = (message: string) => {
    setInitiation(null);
    setPaymentError(message);
  };

  if (orderQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // "Couldn't find that order" only when there is no order to show; with a saved copy a failed refresh keeps it.
  if (shouldShowFullError(orderQuery) || !orderQuery.data) {
    return (
      <View style={styles.centered}>
        <ErrorState message={t("orders.notFound")} onRetry={() => void orderQuery.refetch()} />
      </View>
    );
  }

  const order = orderQuery.data;
  const addressView = orderAddressView(order, lang);
  const offerPayment = canOfferPayment({ status: order.status, isShowingOfflineData: offline.isShowingOfflineData });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.containerContent}>
      <View style={styles.card}>
        <Text style={styles.title}>{orderStatusTitle(order.status, lang)}</Text>
        <Text style={styles.orderNumber}>{t("orders.orderNumber", { number: order.orderNumber })}</Text>
        <Text style={[styles.statusBadge, { color: orderStatusColor(order.status) }]}>{orderStatusLabel(order.status, lang)}</Text>
        <Text style={styles.amount}>₹{order.totalAmount}</Text>
        <OfflineBanner visible={shouldShowOfflineBanner(offline)} onRetry={() => void orderQuery.refetch()} />
        <LastUpdated
          timestamp={offline.lastUpdatedAt}
          isShowingOfflineData={offline.isShowingOfflineData}
          offlineNote={t("offline.orderMayBeOutOfDate")}
        />

        {order.items.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [styles.itemRow, pressed && { opacity: 0.6 }]}
            onPress={() =>
              navigation.navigate("MainTabs", {
                screen: "Store",
                // the order keeps the item's id, not its slug; the server accepts either
                params: { screen: item.itemType === "CROP_LISTING" ? "CropDetail" : "ProductDetail", params: { idOrSlug: String(item.itemId) } },
              })
            }
            accessibilityRole="button"
            accessibilityLabel={t("orders.openItem", { name: trimName(item.itemName), quantity: item.quantity, total: item.lineTotal })}
          >
            <Image source={resizedMediaUrl(item.thumbnailUrl, MEDIA_WIDTH.row)} style={styles.itemThumb} contentFit="cover" accessible={false} />
            <Text style={styles.itemName}>
              {trimName(item.itemName)} × {item.quantity}
            </Text>
            <Text style={styles.itemTotal}>₹{item.lineTotal}</Text>
          </Pressable>
        ))}

        {order.status === "PENDING_PAYMENT" && !paymentSubmitted && !offerPayment && offline.isShowingOfflineData && (
          <Text style={styles.waitingText}>{t("offline.payNeedsInternet")}</Text>
        )}

        {offerPayment && !paymentSubmitted && (
          <>
            {paymentError && <Text style={styles.errorText}>{paymentError}</Text>}
            <Pressable
              style={({ pressed }) => [styles.payButton, initiateMutation.isPending && styles.disabledButton, pressed && { opacity: 0.6 }]}
              disabled={initiateMutation.isPending}
              onPress={handlePayNow}
            >
              {initiateMutation.isPending ? (
                <ActivityIndicator color={colors.primaryContrastText} />
              ) : (
                <Text style={styles.payButtonText}>{t("orders.payNow")}</Text>
              )}
            </Pressable>
          </>
        )}

        {order.status === "PENDING_PAYMENT" && paymentSubmitted && !pollTimedOut && (
          <View style={styles.waitingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.waitingText}>{t("orders.waitingConfirmation")}</Text>
          </View>
        )}

        {order.status === "PENDING_PAYMENT" && pollTimedOut && (
          <View style={styles.timeoutBox}>
            <Text style={styles.timeoutText}>{t("orders.takingLong")}</Text>
            <Pressable style={({ pressed }) => [styles.refreshButton, pressed && { opacity: 0.6 }]} onPress={() => void orderQuery.refetch()}>
              <Text style={styles.refreshButtonText}>{t("orders.checkAgain")}</Text>
            </Pressable>
          </View>
        )}

        {order.status === "PAYMENT_FAILED" && (
          <Text style={styles.failedText}>{t("orders.paymentFailed")}</Text>
        )}

        {addressView.kind === "online-only" && <Text style={styles.waitingText}>{addressView.note}</Text>}

        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>{t("orders.statusSection")}</Text>
          <OrderTimeline events={order.statusHistory} status={order.status} />
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.6 }]}
            onPress={() => navigation.navigate("MainTabs", { screen: "Store", params: { screen: "StoreList" } })}
          >
            <Text style={styles.secondaryButtonText}>{t("orders.continueShopping")}</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.6 }]} onPress={() => navigation.navigate("OrderHistory")}>
            <Text style={styles.secondaryButtonText}>{t("orders.viewOrders")}</Text>
          </Pressable>
        </View>
      </View>

      {initiation && (
        <RazorpayWebView
          visible
          initiation={initiation}
          description={t("orders.paymentDescription", { number: order.orderNumber })}
          prefill={{ name: user?.name, email: user?.email }}
          onSuccess={(payload) => {
            void queryClient.invalidateQueries({ queryKey: ["order", params.orderId] });
            handlePaymentSuccess(payload);
          }}
          onDismiss={handlePaymentDismiss}
          onError={handlePaymentError}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  containerContent: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 20,
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  orderNumber: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  statusBadge: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
    textTransform: "uppercase",
  },
  amount: { fontSize: 22, fontWeight: "700", color: colors.primary, marginTop: 8, marginBottom: 12 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 4,
    minHeight: 44,
  },
  itemThumb: { width: 40, height: 40, borderRadius: 6, backgroundColor: colors.grey100, marginRight: 10 },
  itemName: { fontSize: 14, color: colors.textPrimary, flex: 1 },
  itemTotal: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  payButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 16,
  },
  disabledButton: { opacity: 0.6 },
  payButtonText: { color: colors.primaryContrastText, fontSize: 16, fontWeight: "600" },
  waitingRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 },
  waitingText: { color: colors.textSecondary },
  timeoutBox: { alignItems: "center", marginTop: 16 },
  timeoutText: { color: colors.textSecondary, textAlign: "center", fontSize: 13 },
  refreshButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minHeight: 44,
    justifyContent: "center",
  },
  refreshButtonText: { color: colors.primary, fontWeight: "600" },
  failedText: { color: colors.textSecondary, textAlign: "center", marginTop: 16 },
  errorText: { color: colors.error, marginTop: 12, textAlign: "center" },
  timelineSection: {
    alignSelf: "stretch",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginBottom: 12 },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 24 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { color: colors.primary, fontWeight: "600" },
});
