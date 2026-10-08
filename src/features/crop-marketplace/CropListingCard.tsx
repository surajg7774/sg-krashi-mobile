import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { colors } from "@/theme/colors";
import { cardShadow } from "@/theme/shadow";
import { MEDIA_WIDTH, resizedMediaUrl } from "@/shared/media";
import { PricePill } from "@/components/PricePill";
import { NewBadge } from "@/components/NewBadge";
import { Rating } from "@/components/Rating";
import { formatRupees, harvestLabel, isSoldOut, listingAccessibilityLabel, trimName } from "./cropLogic";
import { useT } from "@/i18n/useT";
import type { CropListingSummary } from "./types";

/** One crop in the two-column grid: photo, Sold Out / New and Organic badges, name, rupee price, harvest date, rating. */
export const CropListingCard = ({ item, onPress }: { item: CropListingSummary; onPress: () => void }) => {
  const { t, lang } = useT();
  const soldOut = isSoldOut(item.quantityAvailable);
  const harvest = harvestLabel(item.harvestDate, undefined, lang);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.6 }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t("crops.a11y.listing", { label: listingAccessibilityLabel(item, lang) })}
    >
      <View style={styles.imageWrap}>
        <Image
          source={resizedMediaUrl(item.thumbnailUrl, MEDIA_WIDTH.card)}
          style={[styles.image, soldOut && styles.imageSoldOut]}
          contentFit="cover"
          placeholder={require("../../../assets/icon.png")}
          placeholderContentFit="contain"
          transition={150}
          accessible={false}
        />
        {soldOut ? (
          <View style={styles.soldOutBadge}>
            <Text style={styles.badgeText}>{t("crops.detail.soldOut")}</Text>
          </View>
        ) : (
          <View style={styles.leftBadgeSlot}>
            <NewBadge createdAt={item.createdAt} />
          </View>
        )}
        {item.isOrganicCertified && (
          <View style={styles.organicBadge}>
            <Text style={styles.badgeText}>{t("crops.detail.organic")}</Text>
          </View>
        )}
      </View>
      {item.categoryName ? <Text style={styles.category}>{item.categoryName}</Text> : null}
      <Text style={styles.name} numberOfLines={2}>
        {trimName(item.name)}
      </Text>
      <PricePill label={formatRupees(item.unitPrice)} />
      {harvest.text ? <Text style={[styles.harvest, harvest.upcoming && styles.harvestUpcoming]}>{harvest.text}</Text> : null}
      <Rating avgRating={item.avgRating} reviewCount={item.reviewCount} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.greenTint,
    borderWidth: 1,
    borderColor: colors.greenTintStrong,
    borderRadius: 12,
    padding: 10,
    width: "48%",
    marginBottom: 14,
    ...cardShadow,
  },
  imageWrap: { position: "relative" },
  image: { width: "100%", aspectRatio: 1, borderRadius: 8, marginBottom: 8, backgroundColor: colors.grey100 },
  imageSoldOut: { opacity: 0.55 },
  leftBadgeSlot: { position: "absolute", top: 6, left: 6 },
  soldOutBadge: { position: "absolute", top: 6, left: 6, backgroundColor: colors.error, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  organicBadge: { position: "absolute", top: 6, right: 6, backgroundColor: colors.success, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: colors.primaryContrastText, fontSize: 10, fontWeight: "700" },
  category: { fontSize: 11, color: colors.textSecondary, marginBottom: 2 },
  name: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  harvest: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  harvestUpcoming: { color: colors.info },
});
