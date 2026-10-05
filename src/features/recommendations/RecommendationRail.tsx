import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { colors } from "@/theme/colors";
import { cardShadow } from "@/theme/shadow";
import { PricePill } from "@/components/PricePill";
import { Rating } from "@/components/Rating";
import type { RecommendationItem } from "./types";

interface RecommendationRailProps {
  title: string;
  items: RecommendationItem[];
  onPressItem: (item: RecommendationItem) => void;
}

// Shared by Home ("For You") and Product Detail ("Frequently bought with")
// — same card shape, same navigable-only-if-PRODUCT filtering (Crop
// Marketplace isn't built in the mobile app, so a CROP_LISTING
// recommendation has nowhere to navigate to yet).
export const RecommendationRail = ({ title, items, onPressItem }: RecommendationRailProps) => {
  const productItems = items.filter((item) => item.itemType === "PRODUCT");
  if (productItems.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={productItems}
        keyExtractor={(item) => `${item.itemType}-${item.id}`}
        contentContainerStyle={styles.row}
        renderItem={({ item }) => (
          <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.6 }]} onPress={() => onPressItem(item)}>
            <Image source={item.thumbnailUrl ?? undefined} style={styles.image} contentFit="cover" transition={150} />
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            <PricePill label={`₹${item.price}`} />
            <Rating avgRating={item.avgRating} reviewCount={item.reviewCount} />
          </Pressable>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 20 },
  title: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, marginHorizontal: 16, marginBottom: 10 },
  row: { paddingHorizontal: 16, gap: 12 },
  card: {
    width: 130,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    ...cardShadow,
  },
  image: { width: "100%", aspectRatio: 1, borderRadius: 8, marginBottom: 8, backgroundColor: colors.grey100 },
  name: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
});
