import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "@/theme/colors";
import { cartService, CART_QUERY_KEY } from "./cartService";
import type { CartItem } from "./types";
import type { MainStackParamList } from "@/navigation/MainStackNavigator";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";

type Navigation = NativeStackNavigationProp<MainStackParamList, "Cart">;

const CartItemRow = ({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  isMutating,
}: {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  isMutating: boolean;
}) => (
  <View style={styles.row}>
    <Image source={item.thumbnailUrl ?? undefined} style={styles.thumb} contentFit="cover" />
    <View style={styles.rowMiddle}>
      <Text style={styles.itemName} numberOfLines={2}>
        {item.itemName}
      </Text>
      <Text style={styles.unitPrice}>₹{item.unitPrice} each</Text>
      <View style={styles.qtyRow}>
        <Pressable
          style={styles.qtyButton}
          onPress={onDecrement}
          disabled={isMutating || item.quantity <= 1}
        >
          <Text style={styles.qtyButtonText}>−</Text>
        </Pressable>
        <Text style={styles.qtyValue}>{item.quantity}</Text>
        <Pressable
          style={styles.qtyButton}
          onPress={onIncrement}
          disabled={isMutating || item.quantity >= item.availableQuantity}
        >
          <Text style={styles.qtyButtonText}>+</Text>
        </Pressable>
        <Pressable style={styles.removeButton} onPress={onRemove} disabled={isMutating}>
          <Text style={styles.removeButtonText}>Remove</Text>
        </Pressable>
      </View>
    </View>
    <Text style={styles.lineTotal}>₹{item.lineTotal}</Text>
  </View>
);

export const CartScreen = () => {
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();

  const cartQuery = useQuery({ queryKey: CART_QUERY_KEY, queryFn: cartService.getCart });

  const invalidateCart = () => void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      cartService.updateItem(itemId, { quantity }),
    onSuccess: invalidateCart,
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: number) => cartService.removeItem(itemId),
    onSuccess: invalidateCart,
  });

  const isMutating = updateMutation.isPending || removeMutation.isPending;

  if (cartQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (cartQuery.isError) {
    return (
      <View style={styles.centered}>
        <ErrorState message="Could not load your cart." onRetry={() => void cartQuery.refetch()} />
      </View>
    );
  }

  const cart = cartQuery.data!;

  if (cart.items.length === 0) {
    return (
      <View style={styles.centered}>
        <EmptyState
          icon="🛒"
          message="Your cart is empty. Add products from the Store to see them here."
          action={
            <Pressable
              style={styles.browseButton}
              onPress={() => navigation.navigate("MainTabs", { screen: "Store", params: { screen: "StoreList" } })}
            >
              <Text style={styles.browseButtonText}>Browse Store</Text>
            </Pressable>
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cart.items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            isMutating={isMutating}
            onIncrement={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
            onDecrement={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
            onRemove={() => removeMutation.mutate(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{cart.subtotal}</Text>
        </View>
        <Pressable style={styles.checkoutButton} onPress={() => navigation.navigate("AddressSelect")}>
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingHorizontal: 32,
  },
  browseButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  browseButtonText: {
    color: colors.primaryContrastText,
    fontWeight: "600",
  },
  list: {
    padding: 16,
  },
  row: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 10,
    marginBottom: 12,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.grey100,
  },
  rowMiddle: {
    flex: 1,
    marginLeft: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  unitPrice: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    minWidth: 20,
    textAlign: "center",
  },
  removeButton: {
    marginLeft: 8,
  },
  removeButtonText: {
    fontSize: 12,
    color: colors.error,
  },
  lineTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    alignSelf: "flex-start",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  checkoutButtonText: {
    color: colors.primaryContrastText,
    fontSize: 16,
    fontWeight: "600",
  },
});
