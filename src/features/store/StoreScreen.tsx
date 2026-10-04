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
import { productService } from "./productService";
import type { ProductSummary } from "./types";
import type { StoreStackParamList } from "@/navigation/StoreStackNavigator";
import { CardSkeletonGrid } from "@/components/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";

const PAGE_SIZE = 12;

type Navigation = NativeStackNavigationProp<StoreStackParamList, "StoreList">;

const ProductCard = ({ item, onPress }: { item: ProductSummary; onPress: () => void }) => (
  <Pressable style={styles.card} onPress={onPress}>
    <Image
      source={item.thumbnailUrl ?? undefined}
      style={styles.cardImage}
      contentFit="cover"
      placeholder={require("../../../assets/icon.png")}
      placeholderContentFit="contain"
      transition={150}
    />
    <Text style={styles.cardName} numberOfLines={2}>
      {item.name}
    </Text>
    <Text style={styles.cardPrice}>₹{item.price}</Text>
    {item.stockQty === 0 && <Text style={styles.outOfStock}>Out of stock</Text>}
  </Pressable>
);

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
              style={[styles.chip, categoryId === item.id && styles.chipActive]}
              onPress={() => setCategoryId(categoryId === item.id ? undefined : item.id)}
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
              <Pressable style={styles.clearSearchButton} onPress={() => setSearchInput("")}>
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
    borderWidth: 1,
    borderColor: colors.divider,
  },
  cardImage: {
    width: "100%",
    height: 110,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.grey100,
  },
  cardName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 4,
  },
  outOfStock: {
    fontSize: 12,
    color: colors.error,
    marginTop: 2,
  },
  footerLoader: {
    marginVertical: 16,
  },
});
