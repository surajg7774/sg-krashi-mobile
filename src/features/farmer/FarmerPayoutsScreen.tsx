import { useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "@/theme/colors";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { ListRowSkeletonList } from "@/components/Skeleton";
import { farmerPayoutService } from "./farmerPayoutService";
import type { FarmerPayoutSummary, PayoutStatus } from "./types";
import type { FarmerStackParamList } from "@/navigation/FarmerStackNavigator";
import { PAYOUT_STATUS_KEY } from "./payoutLabels";
import { shouldFetchNextPage } from "@/offline/screenState";
import { LoadMoreFooter } from "@/components/LoadMoreFooter";
import { useT } from "@/i18n/useT";

const PAGE_SIZE = 20;

type Navigation = NativeStackNavigationProp<FarmerStackParamList, "FarmerPayouts">;

const statusColor: Record<PayoutStatus, string> = {
  BATCHED: colors.warning,
  APPROVED: colors.info,
  PAID: colors.success,
};

const PayoutRow = ({ item, onPress }: { item: FarmerPayoutSummary; onPress: () => void }) => {
  const { t } = useT();
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cycleText}>
          {item.cycleStartDate} → {item.cycleEndDate}
        </Text>
        <Text style={styles.amountText}>{t("farmer.payouts.net", { amount: item.netAmount.toFixed(2) })}</Text>
      </View>
      <Text style={[styles.statusBadge, { color: statusColor[item.status] }]}>
        {PAYOUT_STATUS_KEY[item.status] ? t(PAYOUT_STATUS_KEY[item.status]) : item.status}
      </Text>
    </Pressable>
  );
};

export const FarmerPayoutsScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { t } = useT();

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
          <Text style={styles.pendingLabel}>{t("farmer.payouts.pending")}</Text>
          <Text style={styles.pendingAmount}>₹{pendingQuery.data.netAmount.toFixed(2)}</Text>
          <Text style={styles.pendingMeta}>{t("farmer.payouts.pendingItems", { count: pendingQuery.data.itemCount })}</Text>
        </View>
      )}

      {payoutsQuery.isLoading && <ListRowSkeletonList count={6} lines={2} trailing />}

      {payoutsQuery.isError && (
        <ErrorState message={t("farmer.payouts.loadError")} onRetry={() => void payoutsQuery.refetch()} />
      )}

      {!payoutsQuery.isLoading && !payoutsQuery.isError && payouts.length === 0 && (
        <EmptyState icon="💰" message={t("farmer.payouts.empty")} />
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
            if (shouldFetchNextPage(payoutsQuery)) void payoutsQuery.fetchNextPage();
          }}
          ListFooterComponent={<LoadMoreFooter query={payoutsQuery} />}
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
