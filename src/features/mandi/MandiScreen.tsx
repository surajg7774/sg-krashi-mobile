import { useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { ListRowSkeletonList } from "@/components/Skeleton";
import { mandiService } from "./mandiService";
import { resolveMandiAvailability } from "./mandiAvailability";
import { MandiTrendCard } from "./MandiTrendCard";
import type { MandiPrice } from "./types";

const PAGE_SIZE = 20;

const PriceRow = ({ item }: { item: MandiPrice }) => (
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
      <Text style={styles.rangeText}>
        Min ₹{item.minPrice} · Max ₹{item.maxPrice}
      </Text>
      <Text style={styles.dateText}>{item.priceDate}</Text>
    </View>
  </View>
);

export const MandiScreen = () => {
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
            ? `Last synced ${new Date(metaQuery.data.lastSyncedAt).toLocaleDateString()}`
            : "Not yet synced"}{" "}
          · {metaQuery.data.totalRows} records
        </Text>
      )}

      {showChips && filtersQuery.data && filtersQuery.data.states.length > 0 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filtersQuery.data.states}
          keyExtractor={(s) => s}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.chip, state === item && styles.chipActive, pressed && { opacity: 0.6 }]}
              onPress={() => setState(state === item ? undefined : item)}
              hitSlop={{ top: 7, bottom: 7 }}
            >
              <Text style={[styles.chipText, state === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          )}
        />
      )}

      {showChips && filtersQuery.data && filtersQuery.data.commodities.length > 0 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filtersQuery.data.commodities}
          keyExtractor={(c) => c}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.chip, commodity === item && styles.chipActive, pressed && { opacity: 0.6 }]}
              onPress={() => setCommodity(commodity === item ? undefined : item)}
              hitSlop={{ top: 7, bottom: 7 }}
            >
              <Text style={[styles.chipText, commodity === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          )}
        />
      )}

      {availability === "ready" && commodity && <MandiTrendCard commodity={commodity} state={state} />}

      {(availability === "loading" || (availability === "ready" && pricesQuery.isLoading)) && (
        <ListRowSkeletonList count={6} lines={3} />
      )}

      {availability === "awaiting" && (
        <EmptyState
          icon="📈"
          message="Awaiting Agmarknet data"
          description="Mandi prices will appear here once the daily sync has data."
        />
      )}

      {(availability === "error" || (availability === "ready" && pricesQuery.isError)) && (
        <ErrorState message="Could not load mandi prices." onRetry={retryFailed} />
      )}

      {availability === "ready" && !pricesQuery.isLoading && !pricesQuery.isError && prices.length === 0 && (
        <EmptyState icon="📈" message="No mandi price records match these filters." />
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
  chipRow: { gap: 8, paddingBottom: 10 },
  // paddingVertical:6 renders a ~31pt-tall pill — under the 44pt minimum
  // tap target. Fixed via hitSlop at the call site (not more padding) so
  // the chip's visual size stays the same.
  chip: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textPrimary },
  chipTextActive: { color: colors.primaryContrastText, fontWeight: "600" },
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
