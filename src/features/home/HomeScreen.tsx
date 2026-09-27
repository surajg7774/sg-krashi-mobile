import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useNavigation, type CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";
import { productService } from "@/features/store/productService";
import { cartService, CART_QUERY_KEY } from "@/features/cart/cartService";
import { recommendationService } from "@/features/recommendations/recommendationService";
import { RecommendationRail } from "@/features/recommendations/RecommendationRail";
import { notificationService } from "@/features/notifications/notificationService";
import type { ProductSummary } from "@/features/store/types";
import type { TabParamList } from "@/navigation/TabNavigator";
import type { MainStackParamList } from "@/navigation/MainStackNavigator";
import { CardSkeletonGrid } from "@/components/Skeleton";
import { ErrorState } from "@/components/ErrorState";

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
  { label: "Store", emoji: "🛒", onPress: (nav) => nav.navigate("Store", { screen: "StoreList" }) },
  { label: "Crop Doctor", emoji: "🌿", onPress: (nav) => nav.navigate("CropDoctor", { screen: "CropDoctorHome" }) },
  { label: "Weather", emoji: "☀️", onPress: (nav) => nav.navigate("Weather") },
  { label: "Mandi Prices", emoji: "📈", onPress: (nav) => nav.navigate("Mandi") },
  { label: "Chat", emoji: "💬", onPress: (nav) => nav.navigate("Chat") },
  {
    label: "Crop Marketplace",
    emoji: "🌾",
    onPress: () => Alert.alert("Coming soon", "Crop Marketplace isn't built in the mobile app yet."),
  },
];

const ProductCard = ({ item, onPress }: { item: ProductSummary; onPress: () => void }) => (
  <Pressable style={styles.card} onPress={onPress}>
    <Image
      source={item.thumbnailUrl ?? undefined}
      style={styles.cardImage}
      contentFit="cover"
      transition={150}
    />
    <Text style={styles.cardName} numberOfLines={2}>
      {item.name}
    </Text>
    <Text style={styles.cardPrice}>₹{item.price}</Text>
  </Pressable>
);

export const HomeScreen = () => {
  const { user, isAuthenticated } = useAuth();
  const navigation = useNavigation<Navigation>();

  // "Latest products" — the recommendation endpoints ("for you"/similar)
  // need real order history to return anything meaningful, and this test
  // account (and most fresh accounts) has none, so they'd render an empty
  // section most of the time. Plain /products (page 0) is the honestly
  // reliable "featured" source for this pass.
  const productsQuery = useQuery({
    queryKey: ["products", "home"],
    queryFn: () => productService.getProducts({ page: 0, size: 8 }),
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

  const isRefreshing = productsQuery.isRefetching || cartQuery.isRefetching;
  const onRefresh = () => {
    void productsQuery.refetch();
    void cartQuery.refetch();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.greeting}>Welcome{user ? `, ${user.name}` : ""}</Text>
          <Pressable style={styles.bellButton} onPress={() => navigation.navigate("Notifications")}>
            <Text style={styles.bellEmoji}>🔔</Text>
            {!!notificationsQuery.data?.unreadCount && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {notificationsQuery.data.unreadCount > 9 ? "9+" : notificationsQuery.data.unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
        {cartQuery.data && (
          <Pressable onPress={() => navigation.navigate("Cart")}>
            <Text style={styles.subheadingLink}>
              Cart: {cartQuery.data.itemCount} item{cartQuery.data.itemCount === 1 ? "" : "s"} →
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.quickLinksRow}>
        {QUICK_LINKS.map((link) => (
          <Pressable key={link.label} style={styles.quickLink} onPress={() => link.onPress(navigation)}>
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

      {productsQuery.data && (
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

      {forYouQuery.data && forYouQuery.data.items.length > 0 && (
        <RecommendationRail
          title="For You"
          items={forYouQuery.data.items}
          onPressItem={(item) =>
            navigation.navigate("Store", { screen: "ProductDetail", params: { idOrSlug: item.slug } })
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
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  bellButton: {
    padding: 4,
  },
  bellEmoji: {
    fontSize: 22,
  },
  bellBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  subheading: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  subheadingLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 4,
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
    borderWidth: 1,
    borderColor: colors.divider,
  },
  cardImage: {
    width: "100%",
    height: 100,
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
});
