import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { chipLineHeight, chipRowMinHeight, CHIP_BORDER, CHIP_FONT_SIZE, CHIP_PADDING_VERTICAL, CHIP_ROW_PADDING_VERTICAL } from "@/theme/chipLayout";
import { colors } from "@/theme/colors";
import { useT } from "@/i18n/useT";

export interface ChipItem {
  key: string;
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

/**
 * One horizontally scrolling row of filter chips (Store categories, Crop types, Mandi states / commodities).
 *
 * The row never shrinks (flexShrink 0) and never goes below one chip's height at the current system font size and
 * language (src/theme/chipLayout.ts). Without both, a horizontal list sharing a column with a vertical list is
 * squeezed and the chip text is cut off. The chip looks ~31 dp tall; hitSlop brings its tap area to 44 dp.
 */
export const ChipRow = ({ items }: { items: ChipItem[] }) => {
  const { fontScale } = useWindowDimensions();
  const { lang } = useT();
  return (
    <View style={[styles.wrap, { minHeight: chipRowMinHeight(fontScale, lang) }]}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={items}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.content}
        style={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.chip, item.selected && styles.chipActive, pressed && { opacity: 0.6 }]}
            onPress={item.onPress}
            hitSlop={{ top: 7, bottom: 7 }}
            accessibilityRole="button"
            accessibilityLabel={item.accessibilityLabel ?? item.label}
            accessibilityState={{ selected: item.selected }}
          >
            {/* An explicit line height so Devanagari vowel signs are never clipped inside the pill. */}
            <Text style={[styles.chipText, item.selected && styles.chipTextActive, lang !== "en" && { lineHeight: chipLineHeight(lang) }]}>
              {item.label}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flexGrow: 0, flexShrink: 0, marginBottom: 6 },
  list: { flexGrow: 1 },
  content: { gap: 8, alignItems: "center", paddingVertical: CHIP_ROW_PADDING_VERTICAL },
  chip: {
    borderWidth: CHIP_BORDER,
    borderColor: colors.divider,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: CHIP_PADDING_VERTICAL,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: CHIP_FONT_SIZE, color: colors.textPrimary },
  chipTextActive: { color: colors.primaryContrastText, fontWeight: "600" },
});
