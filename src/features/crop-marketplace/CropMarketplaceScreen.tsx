import { useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDebouncedValue } from "@/shared/useDebouncedValue";
import { colors } from "@/theme/colors";
import { CardSkeletonGrid } from "@/components/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import type { StoreStackParamList } from "@/navigation/StoreStackNavigator";
import { cropService } from "./cropService";
import { CropListingCard } from "./CropListingCard";
import { CropFilterSheet } from "./CropFilterSheet";
import { EMPTY_FILTERS, activeFilterCount, toListingQuery, type CropFilters } from "./cropLogic";
import { ChipRow } from "@/components/ChipRow";
import { useT } from "@/i18n/useT";
import { LastUpdated } from "@/components/LastUpdated";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useOfflineData } from "@/offline/useOfflineData";
import { shouldShowFullError, shouldShowOfflineBanner } from "@/offline/screenState";

const PAGE_SIZE = 12;

type Navigation = NativeStackNavigationProp<StoreStackParamList, "CropList">;

export const CropMarketplaceScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { t } = useT();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 400);
  const [filters, setFilters] = useState<CropFilters>(EMPTY_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);

  const categoriesQuery = useQuery({ queryKey: ["crop-categories"], queryFn: cropService.getCategories });

  const listingsQuery = useInfiniteQuery({
    queryKey: ["crop-listings", "browse", search, filters],
    queryFn: ({ pageParam }) => cropService.getListings(toListingQuery(search, filters, pageParam, PAGE_SIZE)),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });

  const listings = useMemo(() => listingsQuery.data?.pages.flatMap((page) => page.items) ?? [], [listingsQuery.data]);
  const offline = useOfflineData(listingsQuery);
  const filterCount = activeFilterCount(filters);
  const hasConstraints = search.trim() !== "" || filterCount > 0;
  const clearAll = () => {
    setSearchInput("");
    setFilters(EMPTY_FILTERS);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder={t("crops.filters.searchPlaceholder")}
          placeholderTextColor={colors.textSecondary}
          value={searchInput}
          onChangeText={setSearchInput}
          returnKeyType="search"
          accessibilityLabel={t("crops.a11y.searchField")}
        />
        <Pressable
          style={({ pressed }) => [styles.filterButton, filterCount > 0 && styles.filterButtonActive, pressed && { opacity: 0.6 }]}
          onPress={() => setSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={filterCount > 0 ? t("crops.a11y.filtersButton", { count: filterCount }) : t("crops.a11y.filtersButtonNone")}
        >
          <Text style={[styles.filterButtonText, filterCount > 0 && styles.filterButtonTextActive]}>
            {t("crops.browse.filters")}
            {filterCount > 0 ? ` (${filterCount})` : ""}
          </Text>
        </Pressable>
      </View>

      {categoriesQuery.data && categoriesQuery.data.length > 0 && (
        <ChipRow
          items={[{ id: 0, name: t("crops.filters.all"), slug: "" }, ...categoriesQuery.data].map((item) => {
            const selected = item.slug === "" ? !filters.cropType : filters.cropType === item.slug;
            return {
              key: String(item.id),
              label: item.name,
              selected,
              onPress: () => setFilters((f) => ({ ...f, cropType: item.slug === "" || f.cropType === item.slug ? undefined : item.slug })),
              accessibilityLabel: item.slug === "" ? t("crops.filters.all") : t("crops.a11y.categoryChip", { name: item.name }),
            };
          })}
        />
      )}

      {listingsQuery.isLoading && <CardSkeletonGrid count={6} />}

      {/* Full-screen error only when there is nothing to show; saved listings stay on screen after a failed refresh. */}
      {shouldShowFullError(listingsQuery) && <ErrorState message={t("crops.browse.loadError")} onRetry={() => void listingsQuery.refetch()} />}

      {!listingsQuery.isLoading && !shouldShowFullError(listingsQuery) && listings.length === 0 && (
        <EmptyState
          icon="🌾"
          message={
            search.trim() !== ""
              ? t("crops.browse.emptySearch", { search: search.trim() })
              : filterCount > 0
                ? t("crops.browse.empty")
                : t("crops.browse.emptyNone")
          }
          action={
            hasConstraints ? (
              <Pressable style={({ pressed }) => [styles.clearButton, pressed && { opacity: 0.6 }]} onPress={clearAll} accessibilityRole="button">
                <Text style={styles.clearButtonText}>{filterCount > 0 ? t("crops.browse.clearFilters") : t("crops.browse.clearSearch")}</Text>
              </Pressable>
            ) : undefined
          }
        />
      )}

      {listings.length > 0 && (
        <FlatList
          data={listings}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <CropListingCard item={item} onPress={() => navigation.navigate("CropDetail", { idOrSlug: item.slug })} />}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              <OfflineBanner visible={shouldShowOfflineBanner(offline)} onRetry={() => void listingsQuery.refetch()} />
              <LastUpdated timestamp={offline.lastUpdatedAt} isShowingOfflineData={offline.isShowingOfflineData} />
            </>
          }
          refreshing={listingsQuery.isRefetching && !listingsQuery.isFetchingNextPage}
          onRefresh={() => void listingsQuery.refetch()}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (listingsQuery.hasNextPage && !listingsQuery.isFetchingNextPage) {
              void listingsQuery.fetchNextPage();
            }
          }}
          ListFooterComponent={listingsQuery.isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} color={colors.primary} /> : null}
        />
      )}

      <CropFilterSheet
        visible={sheetOpen}
        value={filters}
        onApply={(next) => {
          setFilters((f) => ({ ...next, cropType: f.cropType })); // the crop-type chips stay as they are
          setSheetOpen(false);
        }}
        onClear={() => {
          setFilters(EMPTY_FILTERS);
          setSheetOpen(false);
        }}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16, paddingTop: 12 },
  searchRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    minHeight: 44,
  },
  filterButton: { minHeight: 44, minWidth: 44, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingHorizontal: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  filterButtonActive: { backgroundColor: colors.primary },
  filterButtonText: { color: colors.primary, fontWeight: "600" },
  filterButtonTextActive: { color: colors.primaryContrastText },
  clearButton: { marginTop: 4, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10, minHeight: 44, justifyContent: "center" },
  clearButtonText: { color: colors.primary, fontWeight: "600" },
  list: { paddingBottom: 24 },
  row: { justifyContent: "space-between" },
  footerLoader: { marginVertical: 16 },
});
