import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "@/theme/colors";
import { orderService } from "./orderService";
import type { OrderSummary } from "./types";
import type { MainStackParamList } from "@/navigation/MainStackNavigator";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { ListRowSkeletonList } from "@/components/Skeleton";

type Navigation = NativeStackNavigationProp<MainStackParamList, "OrderHistory">;
const PAGE_SIZE = 10;

const OrderRow = ({ order, onPress }: { order: OrderSummary; onPress: () => void }) => (
  <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]} onPress={onPress}>
    <View style={styles.rowLeft}>
      <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
      <Text style={styles.itemCount}>
        {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
      </Text>
    </View>
    <View style={styles.rowRight}>
      <Text style={styles.amount}>₹{order.totalAmount}</Text>
      <Text style={styles.status}>{order.status.replace("_", " ")}</Text>
    </View>
  </Pressable>
);

export const OrderHistoryScreen = () => {
  const navigation = useNavigation<Navigation>();

  const ordersQuery = useInfiniteQuery({
    queryKey: ["orders", "my"],
    queryFn: ({ pageParam }) => orderService.listMyOrders(pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });

  const orders = useMemo(() => ordersQuery.data?.pages.flatMap((p) => p.items) ?? [], [ordersQuery.data]);

  if (ordersQuery.isLoading) {
    return (
      <View style={styles.list}>
        <ListRowSkeletonList count={6} lines={2} trailing />
      </View>
    );
  }

  if (ordersQuery.isError) {
    return (
      <View style={styles.centered}>
        <ErrorState message="Could not load your orders." onRetry={() => void ordersQuery.refetch()} />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.centered}>
        <EmptyState
          icon="📦"
          message="You haven't placed any orders yet."
          action={
            <Pressable
              style={({ pressed }) => [styles.browseButton, pressed && { opacity: 0.6 }]}
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
    <FlatList
      data={orders}
      keyExtractor={(o) => String(o.id)}
      renderItem={({ item }) => (
        <OrderRow order={item} onPress={() => navigation.navigate("OrderConfirmation", { orderId: item.id })} />
      )}
      contentContainerStyle={styles.list}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (ordersQuery.hasNextPage && !ordersQuery.isFetchingNextPage) {
          void ordersQuery.fetchNextPage();
        }
      }}
      ListFooterComponent={
        ordersQuery.isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} color={colors.primary} /> : null
      }
    />
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background, padding: 24 },
  browseButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
  },
  browseButtonText: { color: colors.primaryContrastText, fontWeight: "600" },
  list: { padding: 16, backgroundColor: colors.background },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 14,
    marginBottom: 10,
  },
  rowLeft: {},
  orderNumber: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  itemCount: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  rowRight: { alignItems: "flex-end" },
  amount: { fontSize: 14, fontWeight: "700", color: colors.primary },
  status: { fontSize: 11, color: colors.textSecondary, marginTop: 2, textTransform: "uppercase" },
  footerLoader: { marginVertical: 16 },
});
