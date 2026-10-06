import { useQuery } from "@tanstack/react-query";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, type CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";
import { MEDIA_WIDTH, resizedMediaUrl } from "@/shared/media";
import { cropService } from "@/features/crop-marketplace/cropService";
import { asRailItem } from "@/features/crop-marketplace/railItem";
import { cropStrings } from "@/features/crop-marketplace/strings";
import { productService } from "@/features/store/productService";
import { cartService, CART_QUERY_KEY } from "@/features/cart/cartService";
import { recommendationService } from "@/features/recommendations/recommendationService";
import { RecommendationRail } from "@/features/recommendations/RecommendationRail";
import { notificationService } from "@/features/notifications/notificationService";
import type { ProductSummary } from "@/features/store/types";
import type { TabParamList } from "@/navigation/TabNavigator";
import type { MainStackParamList } from "@/navigation/MainStackNavigator";
import { CardSkeletonGrid, BlockSkeleton } from "@/components/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { PricePill } from "@/components/PricePill";
import { NewBadge } from "@/components/NewBadge";
import { Rating } from "@/components/Rating";
import { cardShadow } from "@/theme/shadow";

// Composite because Home needs to navigate both within its own tab
// navigator (Store, Weather) AND up to the parent stack (Cart, which lives
// above the tabs — see MainStackNavigator.tsx for why).
type Navigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Home">,
  NativeStackNavigationProp<MainStackParamList>
>;

interface QuickLink {
  label: string;
  emoji: string;
  onPress: (navigation: Navigation) => void;
}

const QUICK_LINKS: QuickLink[] = [
  // 🏪 (storefront), not 🛒 — the cart look now belongs to the header's
  // dedicated Cart button, so Store needs a visually distinct icon.
  { label: "Store", emoji: "🏪", onPress: (nav) => nav.navigate("Store", { screen: "StoreList" }) },
  { label: "Crop Doctor", emoji: "🌿", onPress: (nav) => nav.navigate("CropDoctor", { screen: "CropDoctorHome" }) },
  { label: "Weather", emoji: "☀️", onPress: (nav) => nav.navigate("Weather") },
  { label: "Mandi Prices", emoji: "📈", onPress: (nav) => nav.navigate("Mandi") },
  { label: "AI Assistant", emoji: "🤖", onPress: (nav) => nav.navigate("Chat") },
  { label: "Crop Marketplace", emoji: "🌾", onPress: (nav) => nav.navigate("Store", { screen: "CropList" }) },
];

const ProductCard = ({ item, onPress }: { item: ProductSummary; onPress: () => void }) => (
  <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.6 }]} onPress={onPress}>
    <View style={styles.imageWrap}>
      <Image
        source={resizedMediaUrl(item.thumbnailUrl, MEDIA_WIDTH.card)}
        style={styles.cardImage}
        contentFit="cover"
        transition={150}
      />
      <View style={styles.badgeSlot}>
        <NewBadge createdAt={item.createdAt} />
      </View>
    </View>
    <Text style={styles.cardName} numberOfLines={2}>
      {item.name}
    </Text>
    <PricePill label={`₹${item.price}`} />
    <Rating avgRating={item.avgRating} reviewCount={item.reviewCount} />
  </Pressable>
);

export const HomeScreen = () => {
  const { user, isAuthenticated } = useAuth();
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();

  // "Latest products" — the recommendation endpoints ("for you"/similar)
  // need real order history to return anything meaningful, and this test
  // account (and most fresh accounts) has none, so they'd render an empty
  // section most of the time. Plain /products (page 0) is the honestly
  // reliable "featured" source for this pass.
  const productsQuery = useQuery({
    queryKey: ["products", "home"],
    queryFn: () => productService.getProducts({ page: 0, size: 8 }),
  });

  // Latest crop listings (public, like /products): a short rail under the products, with its own loading, empty and error states.
  const cropsQuery = useQuery({
    queryKey: ["crop-listings", "home"],
    queryFn: () => cropService.getListings({ page: 0, size: 8 }),
  });

  // Genuinely requires auth (unlike /products above) — see the Milestone 2
  // verification report for why an endpoint that doesn't need auth can't
  // prove a refresh flow. Polling keeps a long-lived session's access token
  // naturally exercising the refresh interceptor.
  const cartQuery = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: () => cartService.getCart(),
    refetchInterval: 60_000,
  });

  const forYouQuery = useQuery({
    queryKey: ["recommendations", "for-you"],
    queryFn: () => recommendationService.getForYou(8),
    enabled: isAuthenticated,
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () => notificationService.getMyNotifications(0, 1),
    refetchInterval: 60_000,
  });

  const isRefreshing = productsQuery.isRefetching || cartQuery.isRefetching || cropsQuery.isRefetching;
  const onRefresh = () => {
    void productsQuery.refetch();
    void cartQuery.refetch();
    void cropsQuery.refetch();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTopRow}>
          <Text style={styles.greeting} numberOfLines={1}>
            Welcome{user ? `, ${user.name}` : ""}
          </Text>
          <View style={styles.headerIcons}>
            <Pressable style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]} onPress={() => navigation.navigate("Cart")}>
              <Text style={styles.iconEmoji}>🛒</Text>
              {!!cartQuery.data?.itemCount && (
                <View style={styles.iconBadge}>
                  <Text style={styles.iconBadgeText}>
                    {cartQuery.data.itemCount > 9 ? "9+" : cartQuery.data.itemCount}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]} onPress={() => navigation.navigate("Notifications")}>
              <Text style={styles.iconEmoji}>🔔</Text>
              {!!notificationsQuery.data?.unreadCount && (
                <View style={styles.iconBadge}>
                  <Text style={styles.iconBadgeText}>
                    {notificationsQuery.data.unreadCount > 9 ? "9+" : notificationsQuery.data.unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.quickLinksRow}>
        {QUICK_LINKS.map((link) => (
          <Pressable key={link.label} style={({ pressed }) => [styles.quickLink, pressed && { opacity: 0.6 }]} onPress={() => link.onPress(navigation)}>
            <Text style={styles.quickLinkEmoji}>{link.emoji}</Text>
            <Text style={styles.quickLinkLabel}>{link.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Featured Products</Text>

      {productsQuery.isLoading && <CardSkeletonGrid count={4} />}

      {productsQuery.isError && (
        <ErrorState message="Could not load products." onRetry={() => void productsQuery.refetch()} />
      )}

      {productsQuery.data && productsQuery.data.items.length === 0 && (
        <EmptyState icon="📦" message="No featured products right now — check back soon." />
      )}

      {productsQuery.data && productsQuery.data.items.length > 0 && (
        <FlatList
          data={productsQuery.data.items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onPress={() =>
                navigation.navigate("Store", { screen: "ProductDetail", params: { idOrSlug: item.slug } })
              }
            />
          )}
          numColumns={2}
          columnWrapperStyle={styles.row}
          scrollEnabled={false}
        />
      )}

      {/* the rail prints its own title when there are crops; the other states need one here */}
      {!(cropsQuery.data && cropsQuery.data.items.length > 0) && <Text style={styles.sectionTitle}>{cropStrings.browse.homeSection}</Text>}

      {cropsQuery.isLoading && (
        <View style={styles.cropSkeleton}>
          <BlockSkeleton height={180} />
        </View>
      )}

      {cropsQuery.isError && <ErrorState message={cropStrings.browse.loadError} onRetry={() => void cropsQuery.refetch()} />}

      {cropsQuery.data && cropsQuery.data.items.length === 0 && <EmptyState icon="🌾" message={cropStrings.browse.homeEmpty} />}

      {cropsQuery.data && cropsQuery.data.items.length > 0 && (
        <RecommendationRail
          title={cropStrings.browse.homeSection}
          items={cropsQuery.data.items.map(asRailItem)}
          onPressItem={(item) => navigation.navigate("Store", { screen: "CropDetail", params: { idOrSlug: item.slug } })}
        />
      )}

      {forYouQuery.data && forYouQuery.data.items.length > 0 && (
        <RecommendationRail
          title="For You"
          items={forYouQuery.data.items}
          onPressItem={(item) =>
            navigation.navigate("Store", {
              screen: item.itemType === "CROP_LISTING" ? "CropDetail" : "ProductDetail",
              params: { idOrSlug: item.slug },
            })
          }
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
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    marginRight: 12,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  // minWidth/minHeight (not just padding) so the tappable area hits the
  // 44x44pt minimum regardless of the emoji glyph's own rendered box —
  // confirmed undersized before this fix: padding:4 around a 22px emoji
  // computed to roughly 30x30pt.
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: {
    fontSize: 22,
  },
  // top/right account for iconButton's new 44x44 hit area (centered
  // content) — without this the badge would anchor to the enlarged box's
  // corner instead of staying visually tight to the emoji glyph itself.
  iconBadge: {
    position: "absolute",
    top: 9,
    right: 9,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  iconBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  quickLinksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
    gap: 10,
  },
  quickLink: {
    width: "22%",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: 12,
  },
  quickLinkEmoji: {
    fontSize: 22,
  },
  quickLinkLabel: {
    fontSize: 10,
    color: colors.textPrimary,
    marginTop: 4,
    textAlign: "center",
  },
  cropSkeleton: { paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
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
  cardName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});
