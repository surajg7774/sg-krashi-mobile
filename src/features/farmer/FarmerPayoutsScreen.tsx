import { useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "@/theme/colors";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { ListRowSkeletonList } from "@/components/Skeleton";
import { farmerPayoutService } from "./farmerPayoutService";
import type { FarmerPayoutSummary, PayoutStatus } from "./types";
import type { FarmerStackParamList } from "@/navigation/FarmerStackNavigator";

const PAGE_SIZE = 20;

type Navigation = NativeStackNavigationProp<FarmerStackParamList, "FarmerPayouts">;

const statusColor: Record<PayoutStatus, string> = {
  BATCHED: colors.warning,
  APPROVED: colors.info,
  PAID: colors.success,
};

const PayoutRow = ({ item, onPress }: { item: FarmerPayoutSummary; onPress: () => void }) => (
  <Pressable style={styles.row} onPress={onPress}>
    <View style={{ flex: 1 }}>
      <Text style={styles.cycleText}>
        {item.cycleStartDate} → {item.cycleEndDate}
      </Text>
      <Text style={styles.amountText}>₹{item.netAmount.toFixed(2)} net</Text>
    </View>
    <Text style={[styles.statusBadge, { color: statusColor[item.status] }]}>{item.status}</Text>
  </Pressable>
);

export const FarmerPayoutsScreen = () => {
  const navigation = useNavigation<Navigation>();

  const pendingQuery = useQuery({
    queryKey: ["farmer-payouts-pending"],
    queryFn: farmerPayoutService.getPending,
  });

  const payoutsQuery = useInfiniteQuery({
    queryKey: ["farmer-payouts"],
    queryFn: ({ pageParam }) => farmerPayoutService.listOwnPayouts(pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });

  const payouts = useMemo(() => payoutsQuery.data?.pages.flatMap((page) => page.items) ?? [], [payoutsQuery.data]);

  return (
    <View style={styles.container}>
      {pendingQuery.data && (
        <View style={styles.pendingCard}>
          <Text style={styles.pendingLabel}>Pending (accrued, not yet batched)</Text>
          <Text style={styles.pendingAmount}>₹{pendingQuery.data.netAmount.toFixed(2)}</Text>
          <Text style={styles.pendingMeta}>{pendingQuery.data.itemCount} item(s)</Text>
        </View>
      )}

      {payoutsQuery.isLoading && <ListRowSkeletonList count={6} lines={2} trailing />}

      {payoutsQuery.isError && (
        <ErrorState message="Could not load your payout history." onRetry={() => void payoutsQuery.refetch()} />
      )}

      {!payoutsQuery.isLoading && !payoutsQuery.isError && payouts.length === 0 && (
        <EmptyState icon="💰" message="No payouts yet — these are created weekly once your delivered orders accrue." />
      )}

      {payouts.length > 0 && (
        <FlatList
          data={payouts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PayoutRow item={item} onPress={() => navigation.navigate("FarmerPayoutDetail", { payoutId: item.id })} />
          )}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (payoutsQuery.hasNextPage && !payoutsQuery.isFetchingNextPage) {
              void payoutsQuery.fetchNextPage();
            }
          }}
          ListFooterComponent={
            payoutsQuery.isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} color={colors.primary} /> : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16, paddingTop: 12 },
  pendingCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
    marginBottom: 14,
  },
  pendingLabel: { fontSize: 12, color: colors.textSecondary },
  pendingAmount: { fontSize: 22, fontWeight: "700", color: colors.textPrimary, marginTop: 4 },
  pendingMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  list: { paddingBottom: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 14,
    marginBottom: 10,
  },
  cycleText: { fontSize: 13, color: colors.textSecondary },
  amountText: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginTop: 4 },
  statusBadge: { fontSize: 11, fontWeight: "700" },
  footerLoader: { marginVertical: 16 },
});
