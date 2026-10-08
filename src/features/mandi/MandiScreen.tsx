import { useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { ChipRow } from "@/components/ChipRow";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { ListRowSkeletonList } from "@/components/Skeleton";
import { mandiService } from "./mandiService";
import { resolveMandiAvailability } from "./mandiAvailability";
import { MandiTrendCard } from "./MandiTrendCard";
import type { MandiPrice } from "./types";
import { formatDate } from "@/i18n/format";
import { useT } from "@/i18n/useT";

const PAGE_SIZE = 20;

// Commodity, market, district, state and the price date are Agmarknet data and are shown as sent.
const PriceRow = ({ item }: { item: MandiPrice }) => {
  const { t } = useT();
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.commodity}>{item.commodity}</Text>
        <Text style={styles.modalPrice}>₹{item.modalPrice}</Text>
      </View>
      <Text style={styles.market}>
        {item.marketName}, {item.district ? `${item.district}, ` : ""}
        {item.state}
      </Text>
      <View style={styles.rangeRow}>
        <Text style={styles.rangeText}>{t("mandi.minMax", { min: item.minPrice, max: item.maxPrice })}</Text>
        <Text style={styles.dateText}>{item.priceDate}</Text>
      </View>
    </View>
  );
};

export const MandiScreen = () => {
  const { t, lang } = useT();
  const [commodity, setCommodity] = useState<string | undefined>(undefined);
  const [state, setState] = useState<string | undefined>(undefined);

  const filtersQuery = useQuery({
    queryKey: ["mandi-filters", state],
    queryFn: () => mandiService.getFilterOptions(state),
  });

  const metaQuery = useQuery({
    queryKey: ["mandi-meta"],
    queryFn: () => mandiService.getSyncMeta(),
  });

  const pricesQuery = useInfiniteQuery({
    queryKey: ["mandi-prices", commodity, state],
    queryFn: ({ pageParam }) =>
      mandiService.search({ page: pageParam, size: PAGE_SIZE, commodity, state }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });

  const prices = useMemo(() => pricesQuery.data?.pages.flatMap((page) => page.items) ?? [], [pricesQuery.data]);

  const availability = resolveMandiAvailability({
    meta: { isLoading: metaQuery.isLoading, isError: metaQuery.isError, data: metaQuery.data },
    filters: { isLoading: filtersQuery.isLoading, isError: filtersQuery.isError, data: filtersQuery.data },
    prices: { isError: pricesQuery.isError, itemCount: prices.length },
    state,
  });
  // No chips (and no trend card) when the server says nothing has been synced.
  // Chips stay up in the error state: a failing list under a selected chip
  // must still let the user deselect it (they only render once filters loaded).
  const showChips = availability !== "awaiting";
  const retryFailed = () => {
    if (metaQuery.isError) void metaQuery.refetch();
    if (filtersQuery.isError) void filtersQuery.refetch();
    if (pricesQuery.isError) void pricesQuery.refetch();
  };

  return (
    <View style={styles.container}>
      {metaQuery.data && (
        <Text style={styles.syncText}>
          {metaQuery.data.lastSyncedAt
            ? t("mandi.lastSynced", { date: formatDate(new Date(metaQuery.data.lastSyncedAt), lang) })
            : t("mandi.notSynced")}{" "}
          · {t("mandi.records", { count: metaQuery.data.totalRows })}
        </Text>
      )}

      {showChips && filtersQuery.data && filtersQuery.data.states.length > 0 && (
        <ChipRow
          items={filtersQuery.data.states.map((s) => ({
            key: s,
            label: s,
            selected: state === s,
            onPress: () => setState(state === s ? undefined : s),
          }))}
        />
      )}

      {showChips && filtersQuery.data && filtersQuery.data.commodities.length > 0 && (
        <ChipRow
          items={filtersQuery.data.commodities.map((c) => ({
            key: c,
            label: c,
            selected: commodity === c,
            onPress: () => setCommodity(commodity === c ? undefined : c),
          }))}
        />
      )}

      {availability === "ready" && commodity && <MandiTrendCard commodity={commodity} state={state} />}

      {(availability === "loading" || (availability === "ready" && pricesQuery.isLoading)) && (
        <ListRowSkeletonList count={6} lines={3} />
      )}

      {availability === "awaiting" && (
        <EmptyState
          icon="📈"
          message={t("mandi.awaiting")}
          description={t("mandi.awaitingBody")}
        />
      )}

      {(availability === "error" || (availability === "ready" && pricesQuery.isError)) && (
        <ErrorState message={t("mandi.loadError")} onRetry={retryFailed} />
      )}

      {availability === "ready" && !pricesQuery.isLoading && !pricesQuery.isError && prices.length === 0 && (
        <EmptyState icon="📈" message={t("mandi.noMatch")} />
      )}

      {prices.length > 0 && (
        <FlatList
          data={prices}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <PriceRow item={item} />}
          contentContainerStyle={styles.list}
          refreshing={pricesQuery.isRefetching && !pricesQuery.isFetchingNextPage}
          onRefresh={() => void pricesQuery.refetch()}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (pricesQuery.hasNextPage && !pricesQuery.isFetchingNextPage) {
              void pricesQuery.fetchNextPage();
            }
          }}
          ListFooterComponent={
            pricesQuery.isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} color={colors.primary} /> : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16, paddingTop: 12 },
  syncText: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  list: { paddingBottom: 24 },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 14,
    marginBottom: 10,
  },
  rowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  commodity: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  modalPrice: { fontSize: 16, fontWeight: "700", color: colors.primary },
  market: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  rangeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  rangeText: { fontSize: 12, color: colors.textSecondary },
  dateText: { fontSize: 12, color: colors.textSecondary },
  footerLoader: { marginVertical: 16 },
});
