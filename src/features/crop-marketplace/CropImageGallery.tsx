import { useState } from "react";
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { colors } from "@/theme/colors";
import { MEDIA_WIDTH, resizedMediaUrl } from "@/shared/media";
import { fill, trimName } from "./cropLogic";
import { cropStrings as S } from "./strings";
import type { CropListingMedia } from "./types";

/** Swipeable full-width photos with a dot indicator; a plain placeholder when the listing has none. */
export const CropImageGallery = ({ media, listingName }: { media: CropListingMedia[]; listingName: string }) => {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const photos = [...media].sort((a, b) => a.sortOrder - b.sortOrder);
  const name = trimName(listingName);

  if (photos.length === 0) {
    return (
      <View style={[styles.placeholder, { width, height: width }]}>
        <Text style={styles.placeholderText}>{S.detail.noImage}</Text>
      </View>
    );
  }

  return (
    <View>
      <FlatList
        data={photos}
        keyExtractor={(m) => String(m.id)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_data, index) => ({ length: width, offset: width * index, index })}
        onMomentumScrollEnd={(e) => setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item, index }) => (
          <Image
            source={resizedMediaUrl(item.url, MEDIA_WIDTH.detail)}
            style={{ width, height: width, backgroundColor: colors.grey100 }}
            contentFit="cover"
            transition={150}
            accessible
            accessibilityRole="image"
            accessibilityLabel={item.altText?.trim() || `${name}. ${fill(S.detail.photoOf, { index: index + 1, total: photos.length })}`}
          />
        )}
      />
      {photos.length > 1 && (
        <View style={styles.dotsRow} accessible accessibilityLabel={fill(S.detail.photoOf, { index: activeIndex + 1, total: photos.length })}>
          {photos.map((m, i) => (
            <View key={m.id} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: { backgroundColor: colors.grey100, justifyContent: "center", alignItems: "center" },
  placeholderText: { color: colors.textSecondary },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.grey300 },
  dotActive: { backgroundColor: colors.primary },
});
