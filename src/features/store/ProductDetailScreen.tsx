import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { StoreStackParamList } from "@/navigation/StoreStackNavigator";
import { colors } from "@/theme/colors";
import { productService } from "./productService";
import { cartService, CART_QUERY_KEY } from "@/features/cart/cartService";
import { recommendationService } from "@/features/recommendations/recommendationService";
import { RecommendationRail } from "@/features/recommendations/RecommendationRail";
import { ErrorState } from "@/components/ErrorState";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type DetailRoute = RouteProp<StoreStackParamList, "ProductDetail">;
type Navigation = NativeStackNavigationProp<StoreStackParamList, "ProductDetail">;

export const ProductDetailScreen = () => {
  const { params } = useRoute<DetailRoute>();
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const { data: product, isLoading, isError, refetch } = useQuery({
    queryKey: ["product-detail", params.idOrSlug],
    queryFn: () => productService.getProductDetail(params.idOrSlug),
  });

  const addToCartMutation = useMutation({
    mutationFn: () => cartService.addItem({ itemType: "PRODUCT", itemId: product!.id, quantity: 1 }),
    onSuccess: () => {
      // Cache invalidation (not a manual refetch call from here) — Home's
      // cart-count query shares this exact key, so it refetches on its own
      // next render without this screen needing to know Home exists.
      void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setAddedFeedback(true);
      setTimeout(() => setAddedFeedback(false), 2000);
    },
  });

  const frequentlyBoughtQuery = useQuery({
    queryKey: ["recommendations", "frequently-bought-with", product?.id],
    queryFn: () => recommendationService.getFrequentlyBoughtWith(product!.id),
    enabled: product !== undefined,
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View style={styles.centered}>
        <ErrorState message="Could not load this product." onRetry={() => void refetch()} />
      </View>
    );
  }

  const images = product.media.length > 0 ? product.media : [];

  return (
    <ScrollView style={styles.container}>
      {images.length > 0 ? (
        <>
          <FlatList
            data={images}
            keyExtractor={(m) => String(m.id)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveImageIndex(index);
            }}
            renderItem={({ item }) => (
              <Image
                source={item.url}
                style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
                contentFit="cover"
                transition={150}
              />
            )}
          />
          {images.length > 1 && (
            <View style={styles.dotsRow}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, i === activeImageIndex && styles.dotActive]} />
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={[styles.imagePlaceholder, { width: SCREEN_WIDTH, height: SCREEN_WIDTH }]}>
          <Text style={styles.imagePlaceholderText}>No image available</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.name}>{product.name}</Text>
        {product.category && <Text style={styles.category}>{product.category.name}</Text>}
        <Text style={styles.price}>₹{product.price}</Text>

        {product.isOrganicCertified && (
          <View style={styles.organicBadge}>
            <Text style={styles.organicBadgeText}>Organic Certified</Text>
          </View>
        )}

        <Text style={styles.stockStatus}>
          {product.stockQty > 0 ? `${product.stockQty} in stock` : "Out of stock"}
        </Text>

        <Text style={styles.description}>{product.description}</Text>

        <Pressable
          style={({ pressed }) => [styles.addButton, (product.stockQty === 0 || addToCartMutation.isPending) && styles.addButtonDisabled, pressed && { opacity: 0.6 }]}
          disabled={product.stockQty === 0 || addToCartMutation.isPending}
          onPress={() => addToCartMutation.mutate()}
        >
          {addToCartMutation.isPending ? (
            <ActivityIndicator color={colors.primaryContrastText} />
          ) : (
            <Text style={styles.addButtonText}>{addedFeedback ? "Added ✓" : "Add to Cart"}</Text>
          )}
        </Pressable>

        {addToCartMutation.isError && (
          <Text style={styles.errorText}>Could not add to cart. Please try again.</Text>
        )}
      </View>

      {frequentlyBoughtQuery.data && frequentlyBoughtQuery.data.items.length > 0 && (
        <RecommendationRail
          title="Frequently Bought Together"
          items={frequentlyBoughtQuery.data.items}
          onPressItem={(item) => navigation.push("ProductDetail", { idOrSlug: item.slug })}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  imagePlaceholder: {
    backgroundColor: colors.grey100,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    color: colors.textSecondary,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.grey300,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  category: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 10,
  },
  organicBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.secondaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
  },
  organicBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  stockStatus: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
  },
  description: {
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: 16,
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: colors.primaryContrastText,
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: colors.error,
    marginTop: 10,
    textAlign: "center",
  },
});
