import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { colors } from "@/theme/colors";
import { MEDIA_WIDTH, resizedMediaUrl } from "@/shared/media";
import { cardShadow } from "@/theme/shadow";
import { PricePill } from "@/components/PricePill";
import { Rating } from "@/components/Rating";
import { formatRupees, trimName } from "@/features/crop-marketplace/cropLogic";
import type { RecommendationItem } from "./types";

interface RecommendationRailProps {
  title: string;
  items: RecommendationItem[];
  onPressItem: (item: RecommendationItem) => void;
}

// Shared by Home ("For You"), Product Detail ("Frequently bought with") and Crop Listing Detail — same card
// shape for products and crops. The caller decides where a tap goes, from item.itemType (PRODUCT or CROP_LISTING).
export const RecommendationRail = ({ title, items, onPressItem }: RecommendationRailProps) => {
  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={items}
        keyExtractor={(item) => `${item.itemType}-${item.id}`}
        contentContainerStyle={styles.row}
        renderItem={({ item }) => (
          <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.6 }]} onPress={() => onPressItem(item)}>
            <Image source={resizedMediaUrl(item.thumbnailUrl, MEDIA_WIDTH.rail)} style={styles.image} contentFit="cover" transition={150} />
            <Text style={styles.name} numberOfLines={2}>
              {trimName(item.name)}
            </Text>
            <PricePill label={item.itemType === "CROP_LISTING" ? formatRupees(item.price) : `₹${item.price}`} />
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
