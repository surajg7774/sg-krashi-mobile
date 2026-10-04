import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "@/theme/colors";
import { useAuth } from "@/context/AuthContext";
import { orderService } from "./orderService";
import { paymentService } from "@/features/payment/paymentService";
import { RazorpayWebView, type RazorpaySuccessPayload } from "@/features/payment/RazorpayWebView";
import type { PaymentInitiation } from "@/features/payment/types";
import type { MainStackParamList } from "@/navigation/MainStackNavigator";
import { ErrorState } from "@/components/ErrorState";

type Navigation = NativeStackNavigationProp<MainStackParamList, "OrderConfirmation">;
type ConfirmationRoute = RouteProp<MainStackParamList, "OrderConfirmation">;

// Same polling shape as sg-krashi-client's useOrderDetail.ts: keep polling
// only while the order is still waiting on the async webhook to resolve it.
const ACTIVE_POLL_INTERVAL_MS = 3000;

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
  const queryClient = useQueryClient();
  const [initiation, setInitiation] = useState<PaymentInitiation | null>(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pollTimedOut, setPollTimedOut] = useState(false);

  const orderQuery = useQuery({
    queryKey: ["order", params.orderId],
    queryFn: () => orderService.getOrderDetail(params.orderId),
    refetchInterval: (query) => (query.state.data?.status === "PENDING_PAYMENT" ? ACTIVE_POLL_INTERVAL_MS : false),
  });

  const status = orderQuery.data?.status;

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
    onError: () => setPaymentError("Unable to start payment. Please try again."),
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

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <View style={styles.centered}>
        <ErrorState message="We couldn't find that order." onRetry={() => void orderQuery.refetch()} />
      </View>
    );
  }

  const order = orderQuery.data;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{order.status === "CONFIRMED" ? "Order Confirmed!" : "Order Placed"}</Text>
        <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
        <Text style={styles.statusBadge}>{order.status.replace("_", " ")}</Text>
        <Text style={styles.amount}>₹{order.totalAmount}</Text>

        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName}>
              {item.itemName} × {item.quantity}
            </Text>
            <Text style={styles.itemTotal}>₹{item.lineTotal}</Text>
          </View>
        ))}

        {order.status === "PENDING_PAYMENT" && !paymentSubmitted && (
          <>
            {paymentError && <Text style={styles.errorText}>{paymentError}</Text>}
            <Pressable
              style={[styles.payButton, initiateMutation.isPending && styles.disabledButton]}
              disabled={initiateMutation.isPending}
              onPress={handlePayNow}
            >
              {initiateMutation.isPending ? (
                <ActivityIndicator color={colors.primaryContrastText} />
              ) : (
                <Text style={styles.payButtonText}>Pay Now</Text>
              )}
            </Pressable>
          </>
        )}

        {order.status === "PENDING_PAYMENT" && paymentSubmitted && !pollTimedOut && (
          <View style={styles.waitingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.waitingText}>Waiting for payment confirmation…</Text>
          </View>
        )}

        {order.status === "PENDING_PAYMENT" && pollTimedOut && (
          <View style={styles.timeoutBox}>
            <Text style={styles.timeoutText}>
              This is taking longer than expected. Your payment may still be processing — check Order History in
              a few minutes, or come back to this order later.
            </Text>
            <Pressable style={styles.refreshButton} onPress={() => void orderQuery.refetch()}>
              <Text style={styles.refreshButtonText}>Check Again</Text>
            </Pressable>
          </View>
        )}

        {order.status === "PAYMENT_FAILED" && (
          <Text style={styles.failedText}>
            Your payment didn't go through and the reserved stock has been released. Please place a new order to
            try again.
          </Text>
        )}

        <View style={styles.buttonRow}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("MainTabs", { screen: "Store", params: { screen: "StoreList" } })}
          >
            <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("OrderHistory")}>
            <Text style={styles.secondaryButtonText}>View Orders</Text>
          </Pressable>
        </View>
      </View>

      {initiation && (
        <RazorpayWebView
          visible
          initiation={initiation}
          description={`Order ${order.orderNumber}`}
          prefill={{ name: user?.name, email: user?.email }}
          onSuccess={(payload) => {
            void queryClient.invalidateQueries({ queryKey: ["order", params.orderId] });
            handlePaymentSuccess(payload);
          }}
          onDismiss={handlePaymentDismiss}
          onError={handlePaymentError}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
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
    fontWeight: "600",
    color: colors.primary,
    marginTop: 8,
    textTransform: "uppercase",
  },
  amount: { fontSize: 22, fontWeight: "700", color: colors.primary, marginTop: 8, marginBottom: 12 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 4,
  },
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
  buttonRow: { flexDirection: "row", gap: 12, marginTop: 24 },
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
