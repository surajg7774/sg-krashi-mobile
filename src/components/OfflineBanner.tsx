import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { OFFLINE_STRINGS } from "@/offline/strings";

interface OfflineBannerProps {
  /** From shouldShowOfflineBanner(useOfflineData(query)): offline AND saved data is on screen. */
  visible: boolean;
  onRetry: () => void;
}

/**
 * Slim, non-blocking strip above the content: the saved data underneath stays fully usable. Renders nothing unless
 * visible, so there is no space reserved (and nothing flashes) while the data is fresh.
 */
export const OfflineBanner = ({ visible, onRetry }: OfflineBannerProps) => {
  if (!visible) return null;
  return (
    <View style={styles.container} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <View style={styles.textBlock}>
        <Text style={styles.title}>{OFFLINE_STRINGS.bannerTitle}</Text>
        <Text style={styles.body}>{OFFLINE_STRINGS.bannerBody}</Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.retryButton, pressed && { opacity: 0.6 }]}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={`${OFFLINE_STRINGS.retry}: try to refresh`}
        hitSlop={{ top: 4, bottom: 4 }}
      >
        <Text style={styles.retryText}>{OFFLINE_STRINGS.retry}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // Same tint-of-a-token pattern as the order status chips; dark text on this pale amber is well above 4.5:1.
    backgroundColor: `${colors.warning}1F`,
    borderWidth: 1,
    borderColor: `${colors.warning}66`,
    borderRadius: 10,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 6,
    marginBottom: 10,
  },
  textBlock: { flex: 1, paddingRight: 8 },
  title: { fontSize: 13, fontWeight: "700", color: colors.textPrimary },
  body: { fontSize: 12, color: colors.textPrimary, marginTop: 1 },
  // minHeight 44: the smallest comfortable tap target (same rule as ErrorState's Retry button).
  retryButton: { minHeight: 44, minWidth: 64, justifyContent: "center", alignItems: "center", paddingHorizontal: 12 },
  retryText: { fontSize: 14, fontWeight: "700", color: colors.primaryDark },
});
