import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { showLoadMoreOfflineNote, type PagedQueryState } from "@/offline/screenState";
import { colors } from "@/theme/colors";
import { useT } from "@/i18n/useT";

/** "Connect to the internet to load more." - small, non-blocking; tapping it tries again. */
export const LoadMoreOfflineNote = ({ onRetry }: { onRetry: () => void }) => {
  const { t } = useT();
  return (
    <Pressable style={({ pressed }) => [styles.note, pressed && { opacity: 0.6 }]} onPress={onRetry} accessibilityRole="button">
      <Text style={styles.noteText}>{t("offline.loadMoreNeedsInternet")}</Text>
    </Pressable>
  );
};

/** The end of a paged list: a spinner while the next page loads, the offline line if it could not, otherwise nothing. */
export const LoadMoreFooter = ({ query }: { query: PagedQueryState & { fetchNextPage: () => unknown } }) => {
  if (query.isFetchingNextPage) return <ActivityIndicator style={styles.loader} color={colors.primary} />;
  if (showLoadMoreOfflineNote(query)) return <LoadMoreOfflineNote onRetry={() => void query.fetchNextPage()} />;
  return null;
};

const styles = StyleSheet.create({
  loader: { marginVertical: 16 },
  note: { minHeight: 44, alignItems: "center", justifyContent: "center", paddingVertical: 10, paddingHorizontal: 16 },
  noteText: { fontSize: 13, color: colors.textSecondary, textAlign: "center" },
});
