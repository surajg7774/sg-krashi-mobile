import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDebouncedValue } from "@/shared/useDebouncedValue";
import { colors } from "@/theme/colors";
import { MEDIA_WIDTH, resizedMediaUrl } from "@/shared/media";
import { farmerListingStatus, formatRupees, trimName, type FarmerListingStatus } from "@/features/crop-marketplace/cropLogic";
import type { MessageKey } from "@/i18n";
import { shouldFetchNextPage } from "@/offline/screenState";
import { LoadMoreFooter } from "@/components/LoadMoreFooter";
import { useT } from "@/i18n/useT";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { ListRowSkeletonList } from "@/components/Skeleton";
import { PricePill } from "@/components/PricePill";
import { cardShadow } from "@/theme/shadow";
import { farmerService } from "./farmerService";
import type { CropListingSummary } from "./types";
import type { FarmerStackParamList } from "@/navigation/FarmerStackNavigator";

const PAGE_SIZE = 20;

type Navigation = NativeStackNavigationProp<FarmerStackParamList, "FarmerListings">;

const STATUS_LABEL: Record<FarmerListingStatus, MessageKey> = { active: "crops.farmer.active", inactive: "crops.farmer.inactive", soldOut: "crops.farmer.soldOut" };

const ListingRow = ({ item, onPress }: { item: CropListingSummary; onPress: () => void }) => {
  const { t } = useT();
  const status = farmerListingStatus(item);
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t("crops.farmer.listingRow", {
        name: trimName(item.name),
        category: item.categoryName ?? t("crops.farmer.uncategorized"),
        status: t(STATUS_LABEL[status]),
        price: formatRupees(item.unitPrice),
      })}
    >
      <Image source={resizedMediaUrl(item.thumbnailUrl, MEDIA_WIDTH.row)} style={styles.thumb} contentFit="cover" accessible={false} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {trimName(item.name)}
        </Text>
        <Text style={styles.meta}>
          {item.categoryName ?? t("crops.farmer.uncategorized")} · {status === "soldOut" ? t("crops.farmer.soldOut") : t("crops.farmer.available", { count: item.quantityAvailable })}
        </Text>
        <PricePill label={formatRupees(item.unitPrice)} />
      </View>
      <Text style={[styles.statusBadge, status === "active" && styles.statusActive, status === "soldOut" && styles.statusSoldOut, status === "inactive" && styles.statusInactive]}>
        {t(STATUS_LABEL[status])}
      </Text>
    </Pressable>
  );
};

export const FarmerListingsScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { t } = useT();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 400);

  const listingsQuery = useInfiniteQuery({
    queryKey: ["farmer-listings", search],
    queryFn: ({ pageParam }) => farmerService.listOwnListings(search, pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });

  const listings = useMemo(() => listingsQuery.data?.pages.flatMap((page) => page.items) ?? [], [listingsQuery.data]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TextInput
          style={styles.searchInput}
          placeholder={t("farmer.listings.searchPlaceholder")}
          placeholderTextColor={colors.textSecondary}
          value={searchInput}
          onChangeText={setSearchInput}
        />
        <Pressable style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.6 }]} onPress={() => navigation.navigate("FarmerListingForm", {})}>
          <Text style={styles.addButtonText}>{t("farmer.listings.add")}</Text>
        </Pressable>
      </View>

      {listingsQuery.isLoading && <ListRowSkeletonList count={6} thumbnailSize={56} lines={2} trailing />}

      {listingsQuery.isError && (
        <ErrorState message={t("farmer.listings.loadError")} onRetry={() => void listingsQuery.refetch()} />
      )}

      {!listingsQuery.isLoading && !listingsQuery.isError && listings.length === 0 && (
        <EmptyState
          icon="🌾"
          message={t("farmer.listings.empty")}
          action={
            <Pressable style={({ pressed }) => [styles.emptyAddButton, pressed && { opacity: 0.6 }]} onPress={() => navigation.navigate("FarmerListingForm", {})}>
              <Text style={styles.emptyAddButtonText}>{t("farmer.listings.addFirst")}</Text>
            </Pressable>
          }
        />
      )}

      {listings.length > 0 && (
        <FlatList
          data={listings}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ListingRow item={item} onPress={() => navigation.navigate("FarmerListingForm", { listingId: item.id })} />
          )}
          contentContainerStyle={styles.list}
          refreshing={listingsQuery.isRefetching && !listingsQuery.isFetchingNextPage}
          onRefresh={() => void listingsQuery.refetch()}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (shouldFetchNextPage(listingsQuery)) void listingsQuery.fetchNextPage();
          }}
          ListFooterComponent={<LoadMoreFooter query={listingsQuery} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16, paddingTop: 12 },
  headerRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
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
  },
  // minHeight/minWidth — previously relied entirely on stretching to match
  // searchInput's intrinsic height (~42pt), just under the 44pt minimum.
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: { color: colors.primaryContrastText, fontWeight: "600" },
  emptyAddButton: {
    marginTop: 4,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
  },
  emptyAddButtonText: { color: colors.primaryContrastText, fontWeight: "600" },
  list: { paddingBottom: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    ...cardShadow,
  },
  thumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: colors.grey100 },
  name: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statusBadge: { fontSize: 11, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: "hidden" },
  statusActive: { color: colors.success, backgroundColor: colors.grey100 },
  statusSoldOut: { color: colors.error, backgroundColor: colors.grey100 },
  statusInactive: { color: colors.textSecondary, backgroundColor: colors.grey100 },
  footerLoader: { marginVertical: 16 },
});
