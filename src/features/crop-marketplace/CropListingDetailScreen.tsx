import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { StoreStackParamList } from "@/navigation/StoreStackNavigator";
import { colors } from "@/theme/colors";
import { ICONS } from "@/theme/icons";
import { ErrorState } from "@/components/ErrorState";
import { LastUpdated } from "@/components/LastUpdated";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useOfflineData } from "@/offline/useOfflineData";
import { canAddToCart, shouldShowFullError, shouldShowOfflineBanner } from "@/offline/screenState";
import { EmptyState } from "@/components/EmptyState";
import { Rating } from "@/components/Rating";
import { cartService, CART_QUERY_KEY } from "@/features/cart/cartService";
import { recommendationService } from "@/features/recommendations/recommendationService";
import { RecommendationRail } from "@/features/recommendations/RecommendationRail";
import { cropService } from "./cropService";
import { CropImageGallery } from "./CropImageGallery";
import { CropReviews } from "./CropReviews";
import { asRailItem } from "./railItem";
import { QuantityStepper } from "./QuantityStepper";
import { clampQuantity, formatRupees, harvestLabel, isSoldOut, maxQuantity, trimName } from "./cropLogic";
import { useT } from "@/i18n/useT";

type DetailRoute = RouteProp<StoreStackParamList, "CropDetail">;
type Navigation = NativeStackNavigationProp<StoreStackParamList, "CropDetail">;

export const CropListingDetailScreen = () => {
  const { params } = useRoute<DetailRoute>();
  const navigation = useNavigation<Navigation>();
  const { t, lang, errorText } = useT();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (addedTimer.current) clearTimeout(addedTimer.current);
  }, []);

  const detailQuery = useQuery({
    queryKey: ["crop-listing-detail", params.idOrSlug],
    queryFn: () => cropService.getDetail(params.idOrSlug),
    // Retries come from the shared cached-query policy (src/offline/queryPolicy.ts): none for a 404 (a listing that is
    // gone answers 404 - an answer, not a failure) or when offline, one for other failures.
  });
  const listing = detailQuery.data;
  const offline = useOfflineData(detailQuery);
  const cartAllowed = canAddToCart(offline);

  const similarQuery = useQuery({
    queryKey: ["recommendations", "similar", "CROP_LISTING", listing?.id],
    queryFn: () => recommendationService.getSimilar("CROP_LISTING", listing!.id),
    enabled: listing !== undefined,
  });

  const addMutation = useMutation({
    mutationFn: () => cartService.addItem({ itemType: "CROP_LISTING", itemId: listing!.id, quantity }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setAdded(true);
      if (addedTimer.current) clearTimeout(addedTimer.current);
      addedTimer.current = setTimeout(() => setAdded(false), 2000);
    },
    onError: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Stock may have changed since this screen loaded; show the current amount.
      void queryClient.invalidateQueries({ queryKey: ["crop-listing-detail", params.idOrSlug] });
    },
  });

  if (detailQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // The error box only when there is no listing to show; a saved copy stays on screen after a failed refresh.
  if (shouldShowFullError(detailQuery)) {
    const notFound = (detailQuery.error as { status?: number } | null)?.status === 404;
    return (
      <View style={styles.centered}>
        {notFound ? <EmptyState icon={ICONS.cropMarketplace} message={t("crops.detail.notFound")} /> : <ErrorState message={t("crops.detail.loadError")} onRetry={() => void detailQuery.refetch()} />}
      </View>
    );
  }

  if (!listing) return null;

  const soldOut = isSoldOut(listing.quantityAvailable);
  const cap = maxQuantity(listing.quantityAvailable);
  const shownQuantity = clampQuantity(quantity, listing.quantityAvailable);
  const harvest = harvestLabel(listing.harvestDate, undefined, lang);
  const related = listing.relatedListings.map(asRailItem);
  const relatedIds = new Set(related.map((r) => r.id));
  const similar = (similarQuery.data?.items ?? []).filter((item) => item.id !== listing.id && !relatedIds.has(item.id));
  const addErrorMessage = errorText(addMutation.error, "cart");

  return (
    <ScrollView style={styles.container}>
      <CropImageGallery media={listing.media} listingName={listing.name} />

      <View style={styles.content}>
        <OfflineBanner visible={shouldShowOfflineBanner(offline)} onRetry={() => void detailQuery.refetch()} />
        <LastUpdated timestamp={offline.lastUpdatedAt} isShowingOfflineData={offline.isShowingOfflineData} />
        {listing.category && <Text style={styles.category}>{listing.category.name}</Text>}
        <Text style={styles.name} accessibilityRole="header">
          {trimName(listing.name)}
        </Text>
        <Rating avgRating={listing.avgRating} reviewCount={listing.reviewCount} />

        <View style={styles.chipsRow}>
          {listing.isOrganicCertified && (
            <View style={styles.organicChip}>
              <Text style={styles.organicChipText}>{t("crops.detail.organicCertified")}</Text>
            </View>
          )}
          {harvest.text ? (
            <View style={[styles.harvestChip, harvest.upcoming && styles.harvestChipUpcoming]}>
              <Text style={[styles.harvestChipText, harvest.upcoming && { color: colors.info }]}>{harvest.text}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.price}>{formatRupees(listing.unitPrice)}</Text>

        <Text style={[styles.availability, soldOut && styles.soldOutText]}>
          {soldOut ? t("crops.detail.soldOut") : t("crops.detail.available", { count: listing.quantityAvailable })}
        </Text>

        <Text style={styles.description}>{listing.description}</Text>

        {!soldOut && (
          <View style={styles.buyRow}>
            <QuantityStepper value={shownQuantity} max={cap} onChange={setQuantity} />
            <Pressable
              style={({ pressed }) => [styles.addButton, (addMutation.isPending || !cartAllowed) && styles.addButtonDisabled, pressed && { opacity: 0.6 }]}
              disabled={addMutation.isPending || !cartAllowed}
              onPress={() => addMutation.mutate()}
              accessibilityRole="button"
              accessibilityLabel={added ? t("crops.detail.addedToCart") : t("crops.detail.addToCart")}
              accessibilityState={{ busy: addMutation.isPending }}
            >
              {addMutation.isPending ? (
                <ActivityIndicator color={colors.primaryContrastText} />
              ) : (
                <Text style={styles.addButtonText}>{added ? `${t("crops.detail.addedToCart")} ✓` : t("crops.detail.addToCart")}</Text>
              )}
            </Pressable>
          </View>
        )}

        {!soldOut && !cartAllowed && (
          <Text style={styles.errorText} accessibilityLiveRegion="polite">
            {t("offline.addToCartNeedsInternet")}
          </Text>
        )}

        {addMutation.isError && (
          <Text style={styles.errorText} accessibilityLiveRegion="polite">
            {addErrorMessage}
          </Text>
        )}
      </View>

      <RecommendationRail
        title={t("crops.detail.youMightAlsoLike")}
        items={related}
        onPressItem={(item) => navigation.push(item.itemType === "CROP_LISTING" ? "CropDetail" : "ProductDetail", { idOrSlug: item.slug })}
      />
      <RecommendationRail
        title={t("crops.detail.similarItems")}
        items={similar}
        onPressItem={(item) => navigation.push(item.itemType === "CROP_LISTING" ? "CropDetail" : "ProductDetail", { idOrSlug: item.slug })}
      />

      <CropReviews listingId={listing.id} />
      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  content: { padding: 16 },
  category: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  name: { fontSize: 22, fontWeight: "700", color: colors.textPrimary },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  organicChip: { backgroundColor: colors.success, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  organicChipText: { color: colors.primaryContrastText, fontSize: 12, fontWeight: "700" },
  harvestChip: { borderWidth: 1, borderColor: colors.divider, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  harvestChipUpcoming: { borderColor: colors.info },
  harvestChipText: { color: colors.textSecondary, fontSize: 12 },
  price: { fontSize: 26, fontWeight: "700", color: colors.secondaryDark, marginTop: 12 },
  availability: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  soldOutText: { color: colors.error, fontWeight: "700" },
  description: { fontSize: 15, color: colors.textPrimary, lineHeight: 22, marginTop: 14 },
  buyRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 20 },
  addButton: { flex: 1, minHeight: 48, backgroundColor: colors.primary, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  addButtonDisabled: { opacity: 0.6 },
  addButtonText: { color: colors.primaryContrastText, fontWeight: "700", fontSize: 16 },
  errorText: { color: colors.error, marginTop: 10, fontSize: 14 },
});
