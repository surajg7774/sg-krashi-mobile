import { useInfiniteQuery } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { ErrorState } from "@/components/ErrorState";
import { cropService } from "./cropService";
import { fill, formatInstantIndia, starsText } from "./cropLogic";
import { cropStrings as S } from "./strings";

const PAGE_SIZE = 5;

/**
 * Reviews for one crop listing, read-only (writing a review stays on the website). Shows the rating summary when
 * there are reviews, "No reviews yet." when there are none (never an invented rating), and a retry if loading fails.
 */
export const CropReviews = ({ listingId }: { listingId: number }) => {
  const query = useInfiniteQuery({
    queryKey: ["crop-reviews", listingId],
    queryFn: ({ pageParam }) => cropService.getReviews(listingId, pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
  });

  const reviews = query.data?.pages.flatMap((p) => p.items) ?? [];
  const summary = query.data?.pages[0]?.ratingSummary;

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        {S.detail.reviews}
      </Text>

      {query.isLoading && <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />}

      {query.isError && <ErrorState message={S.reviews.loadError} onRetry={() => void query.refetch()} />}

      {query.isSuccess && reviews.length === 0 && <Text style={styles.empty}>{S.reviews.empty}</Text>}

      {summary && summary.avgRating !== null && summary.reviewCount > 0 && (
        <Text
          style={styles.summary}
          accessibilityLabel={fill(S.reviews.summary, { rating: summary.avgRating.toFixed(1), count: summary.reviewCount })}
        >
          ★ {summary.avgRating.toFixed(1)} · {summary.reviewCount}
        </Text>
      )}

      {reviews.map((review) => (
        <View key={review.id} style={styles.card} accessible accessibilityLabel={`${review.reviewerName?.trim() || S.reviews.anonymous}, ${review.rating} out of 5. ${review.comment ?? ""}`}>
          <View style={styles.cardHeader}>
            <Text style={styles.name} numberOfLines={1}>
              {review.reviewerName?.trim() || S.reviews.anonymous}
            </Text>
            <Text style={styles.date}>{formatInstantIndia(review.createdAt)}</Text>
          </View>
          <Text style={styles.stars}>{starsText(review.rating)}</Text>
          {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}
        </View>
      ))}

      {query.hasNextPage && (
        <Pressable
          style={({ pressed }) => [styles.moreButton, pressed && { opacity: 0.6 }]}
          disabled={query.isFetchingNextPage}
          onPress={() => void query.fetchNextPage()}
          accessibilityRole="button"
        >
          {query.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.moreText}>{S.reviews.showMore}</Text>}
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginTop: 24 },
  title: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, marginBottom: 8 },
  summary: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
  empty: { color: colors.textSecondary, fontSize: 14 },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.divider },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.textPrimary, marginRight: 8 },
  date: { fontSize: 12, color: colors.textSecondary },
  stars: { color: colors.secondaryDark, marginTop: 2, fontSize: 14 },
  comment: { marginTop: 4, fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  moreButton: { minHeight: 44, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 4 },
  moreText: { color: colors.primary, fontWeight: "600" },
});
