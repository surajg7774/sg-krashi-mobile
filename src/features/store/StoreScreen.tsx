import { useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDebouncedValue } from "@/shared/useDebouncedValue";
import { colors } from "@/theme/colors";
import { MEDIA_WIDTH, resizedMediaUrl } from "@/shared/media";
import { cardShadow } from "@/theme/shadow";
import { productService } from "./productService";
import type { ProductSummary } from "./types";
import type { StoreStackParamList } from "@/navigation/StoreStackNavigator";
import { CardSkeletonGrid } from "@/components/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { PricePill } from "@/components/PricePill";
import { NewBadge } from "@/components/NewBadge";
import { Rating } from "@/components/Rating";
import { cropStrings } from "@/features/crop-marketplace/strings";

const PAGE_SIZE = 12;

type Navigation = NativeStackNavigationProp<StoreStackParamList, "StoreList">;

const ProductCard = ({ item, onPress }: { item: ProductSummary; onPress: () => void }) => {
  const outOfStock = item.stockQty === 0;
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.6 }]} onPress={onPress}>
      <View style={styles.imageWrap}>
        <Image
          source={resizedMediaUrl(item.thumbnailUrl, MEDIA_WIDTH.card)}
          style={styles.cardImage}
          contentFit="cover"
          placeholder={require("../../../assets/icon.png")}
          placeholderContentFit="contain"
          transition={150}
        />
        {outOfStock ? (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        ) : (
          <View style={styles.badgeSlot}>
            <NewBadge createdAt={item.createdAt} />
          </View>
        )}
      </View>
      <Text style={styles.cardName} numberOfLines={2}>
        {item.name}
      </Text>
      <PricePill label={`₹${item.price}`} />
      <Rating avgRating={item.avgRating} reviewCount={item.reviewCount} />
    </Pressable>
  );
};

export const StoreScreen = () => {
  const navigation = useNavigation<Navigation>();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 400);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);

  const categoriesQuery = useQuery({
    queryKey: ["product-categories"],
    queryFn: productService.getCategories,
  });

  const productsQuery = useInfiniteQuery({
    queryKey: ["products", "store", search, categoryId],
    queryFn: ({ pageParam }) =>
      productService.getProducts({ page: pageParam, size: PAGE_SIZE, search: search || undefined, categoryId }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });

  const products = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [productsQuery.data]
  );

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.cropBanner, pressed && { opacity: 0.6 }]}
        onPress={() => navigation.navigate("CropList")}
        accessibilityRole="button"
        accessibilityLabel={`${cropStrings.browse.title}. ${cropStrings.browse.storeEntrySubtitle}`}
      >
        <Text style={styles.cropBannerEmoji}>🌾</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.cropBannerTitle}>{cropStrings.browse.title}</Text>
          <Text style={styles.cropBannerSubtitle} numberOfLines={1}>
            {cropStrings.browse.storeEntrySubtitle}
          </Text>
        </View>
        <Text style={styles.cropBannerArrow}>→</Text>
      </Pressable>

      <TextInput
        style={styles.searchInput}
        placeholder="Search products…"
        placeholderTextColor={colors.textSecondary}
        value={searchInput}
        onChangeText={setSearchInput}
        returnKeyType="search"
      />

      {categoriesQuery.data && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categoriesQuery.data}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.chip, categoryId === item.id && styles.chipActive, pressed && { opacity: 0.6 }]}
              onPress={() => setCategoryId(categoryId === item.id ? undefined : item.id)}
              hitSlop={{ top: 7, bottom: 7 }}
            >
              <Text style={[styles.chipText, categoryId === item.id && styles.chipTextActive]}>{item.name}</Text>
            </Pressable>
          )}
        />
      )}

      {productsQuery.isLoading && <CardSkeletonGrid count={6} />}

      {productsQuery.isError && (
        <ErrorState
          message="Could not load products."
          onRetry={() => void productsQuery.refetch()}
        />
      )}

      {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 && (
        <EmptyState
          icon="📦"
          message={`No products found${search ? ` for "${search}"` : ""}.`}
          action={
            search ? (
              <Pressable style={({ pressed }) => [styles.clearSearchButton, pressed && { opacity: 0.6 }]} onPress={() => setSearchInput("")}>
                <Text style={styles.clearSearchButtonText}>Clear search</Text>
              </Pressable>
            ) : undefined
          }
        />
      )}

      {products.length > 0 && (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onPress={() => navigation.navigate("ProductDetail", { idOrSlug: item.slug })}
            />
          )}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          refreshing={productsQuery.isRefetching && !productsQuery.isFetchingNextPage}
          onRefresh={() => void productsQuery.refetch()}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (productsQuery.hasNextPage && !productsQuery.isFetchingNextPage) {
              void productsQuery.fetchNextPage();
            }
          }}
          ListFooterComponent={
            productsQuery.isFetchingNextPage ? (
              <ActivityIndicator style={styles.footerLoader} color={colors.primary} />
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  cropBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  cropBannerEmoji: { fontSize: 24 },
  cropBannerTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  cropBannerSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  cropBannerArrow: { fontSize: 18, color: colors.primary },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    marginBottom: 10,
  },
  chipRow: {
    gap: 8,
    paddingBottom: 12,
  },
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
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.primaryContrastText,
    fontWeight: "600",
  },
  clearSearchButton: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  clearSearchButtonText: {
    color: colors.primary,
    fontWeight: "600",
  },
  list: {
    paddingBottom: 24,
  },
  row: {
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    width: "48%",
    marginBottom: 14,
    ...cardShadow,
  },
  imageWrap: {
    position: "relative",
  },
  cardImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.grey100,
  },
  badgeSlot: {
    position: "absolute",
    top: 6,
    left: 6,
  },
  outOfStockBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: colors.error,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  outOfStockText: {
    color: colors.primaryContrastText,
    fontSize: 10,
    fontWeight: "700",
  },
  cardName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  footerLoader: {
    marginVertical: 16,
  },
});
