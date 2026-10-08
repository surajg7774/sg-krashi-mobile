import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "@/theme/colors";
import { orderService } from "./orderService";
import type { OrderSummary } from "./types";
import { orderStatusColor, orderStatusLabel } from "./orderStatusDisplay";
import type { MainStackParamList } from "@/navigation/MainStackNavigator";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { ListRowSkeletonList } from "@/components/Skeleton";
import { LastUpdated } from "@/components/LastUpdated";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useOfflineData } from "@/offline/useOfflineData";
import { shouldShowFullError, shouldShowOfflineBanner, shouldFetchNextPage } from "@/offline/screenState";
import { LoadMoreFooter } from "@/components/LoadMoreFooter";
import { StaleOrderCue } from "@/components/StaleOrderCue";
import { useT } from "@/i18n/useT";

type Navigation = NativeStackNavigationProp<MainStackParamList, "OrderHistory">;
const PAGE_SIZE = 10;

const OrderRow = ({ order, onPress, stale }: { order: OrderSummary; onPress: () => void; stale: boolean }) => {
  const { t, lang } = useT();
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]} onPress={onPress}>
      <View style={styles.rowMain}>
      <View style={styles.rowLeft}>
        <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
        <Text style={styles.itemCount}>
          {t("common.itemCount", { count: order.itemCount })}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.amount}>₹{order.totalAmount}</Text>
        <View style={[styles.statusChip, stale && styles.statusChipStale, { borderColor: orderStatusColor(order.status), backgroundColor: `${orderStatusColor(order.status)}1A` }]}>
          <Text style={[styles.statusChipText, { color: orderStatusColor(order.status) }]}>{orderStatusLabel(order.status, lang)}</Text>
        </View>
      </View>
      </View>
      {/* A status read from the saved copy may have moved on: say so on the row itself, next to the chip. */}
      {stale && <StaleOrderCue align="right" />}
    </Pressable>
  );
};

export const OrderHistoryScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { t } = useT();

  const ordersQuery = useInfiniteQuery({
    queryKey: ["orders", "my"],
    queryFn: ({ pageParam }) => orderService.listMyOrders(pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });

  const orders = useMemo(() => ordersQuery.data?.pages.flatMap((p) => p.items) ?? [], [ordersQuery.data]);
  const offline = useOfflineData(ordersQuery);

  if (ordersQuery.isLoading) {
    return (
      <View style={styles.list}>
        <ListRowSkeletonList count={6} lines={2} trailing />
      </View>
    );
  }

  // Full-screen error only when there is nothing to show; with saved orders a failed refresh keeps the list.
  if (shouldShowFullError(ordersQuery)) {
    return (
      <View style={styles.centered}>
        <ErrorState message={t("orders.loadError")} onRetry={() => void ordersQuery.refetch()} />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.centered}>
        <EmptyState
          icon="📦"
          message={t("orders.empty")}
          action={
            <Pressable
              style={({ pressed }) => [styles.browseButton, pressed && { opacity: 0.6 }]}
              onPress={() => navigation.navigate("MainTabs", { screen: "Store", params: { screen: "StoreList" } })}
            >
              <Text style={styles.browseButtonText}>{t("cart.browseStore")}</Text>
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
        <OrderRow order={item} stale={offline.isShowingOfflineData} onPress={() => navigation.navigate("OrderConfirmation", { orderId: item.id })} />
      )}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <>
          <OfflineBanner visible={shouldShowOfflineBanner(offline)} onRetry={() => void ordersQuery.refetch()} />
          <LastUpdated timestamp={offline.lastUpdatedAt} isShowingOfflineData={offline.isShowingOfflineData} />
        </>
      }
      onEndReachedThreshold={0.4}
      onEndReached={() => {
            if (shouldFetchNextPage(ordersQuery)) void ordersQuery.fetchNextPage();
          }}
      ListFooterComponent={<LoadMoreFooter query={ordersQuery} />}
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 14,
    marginBottom: 10,
  },
  rowMain: { flexDirection: "row", justifyContent: "space-between" },
  rowLeft: {},
  orderNumber: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  itemCount: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  rowRight: { alignItems: "flex-end" },
  amount: { fontSize: 14, fontWeight: "700", color: colors.primary },
  statusChip: { marginTop: 4, borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  statusChipStale: { borderStyle: "dashed" },
  statusChipText: { fontSize: 11, fontWeight: "700" },
  footerLoader: { marginVertical: 16 },
});
