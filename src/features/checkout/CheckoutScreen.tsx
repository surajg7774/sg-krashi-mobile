import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Pressable } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "@/theme/colors";
import { cartService, CART_QUERY_KEY } from "@/features/cart/cartService";
import { addressService, ADDRESSES_QUERY_KEY } from "@/features/address/addressService";
import { orderService } from "@/features/orders/orderService";
import type { MainStackParamList } from "@/navigation/MainStackNavigator";
import { ErrorState } from "@/components/ErrorState";

type Navigation = NativeStackNavigationProp<MainStackParamList, "Checkout">;
type CheckoutRoute = RouteProp<MainStackParamList, "Checkout">;

export const CheckoutScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { params } = useRoute<CheckoutRoute>();
  const queryClient = useQueryClient();

  // Same cache key AddressSelectScreen already populated — no extra network
  // call, just reading what's already there to find this one address by id.
  const addressesQuery = useQuery({ queryKey: ADDRESSES_QUERY_KEY, queryFn: addressService.listAddresses });
  const cartQuery = useQuery({ queryKey: CART_QUERY_KEY, queryFn: cartService.getCart });

  const checkoutMutation = useMutation({
    mutationFn: orderService.checkout,
    onSuccess: (order) => {
      // The server clears the cart as part of the checkout transaction —
      // same as sg-krashi-client's useCheckout.ts — reflect that immediately.
      queryClient.setQueryData(CART_QUERY_KEY, { items: [], subtotal: 0, itemCount: 0 });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      navigation.replace("OrderConfirmation", { orderId: order.id });
    },
  });

  if (addressesQuery.isLoading || cartQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const address = addressesQuery.data?.find((a) => a.id === params.addressId);
  const cart = cartQuery.data;

  if (!address || !cart) {
    return (
      <View style={styles.centered}>
        <ErrorState message="Could not load checkout details." onRetry={() => void addressesQuery.refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Shipping to</Text>
        <View style={styles.card}>
          <Text style={styles.cardLine}>{address.line1}</Text>
          {address.line2 && <Text style={styles.cardLine}>{address.line2}</Text>}
          <Text style={styles.cardLine}>
            {address.city}, {address.state} - {address.pincode}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Items ({cart.itemCount})</Text>
        <View style={styles.card}>
          {cart.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {item.itemName} × {item.quantity}
              </Text>
              <Text style={styles.itemTotal}>₹{item.lineTotal}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{cart.subtotal}</Text>
          </View>
        </View>

        {checkoutMutation.isError && (
          <Text style={styles.errorText}>Could not place your order. Please try again.</Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.placeOrderButton, checkoutMutation.isPending && styles.disabledButton, pressed && { opacity: 0.6 }]}
          disabled={checkoutMutation.isPending}
          onPress={() => checkoutMutation.mutate({ addressId: params.addressId })}
        >
          {checkoutMutation.isPending ? (
            <ActivityIndicator color={colors.primaryContrastText} />
          ) : (
            <Text style={styles.placeOrderButtonText}>Place Order</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 16 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 14,
  },
  cardLine: { fontSize: 14, color: colors.textPrimary },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  itemName: { fontSize: 14, color: colors.textPrimary, flex: 1, marginRight: 8 },
  itemTotal: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  totalValue: { fontSize: 16, fontWeight: "700", color: colors.primary },
  errorText: { color: colors.error, marginTop: 16, textAlign: "center" },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  placeOrderButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  disabledButton: { opacity: 0.6 },
  placeOrderButtonText: { color: colors.primaryContrastText, fontSize: 16, fontWeight: "600" },
});
