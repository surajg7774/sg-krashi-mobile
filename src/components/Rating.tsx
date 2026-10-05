import { StyleSheet, Text } from "react-native";
import { colors } from "@/theme/colors";

export interface RatingProps {
  avgRating: number | null;
  reviewCount: number;
}

/** Extracted from RecommendationRail's inline "★ {rating} ({count})" text so catalog cards can share the same treatment instead of leaving the data unused. */
export const Rating = ({ avgRating, reviewCount }: RatingProps) => {
  if (avgRating === null || reviewCount === 0) return null;
  return (
    <Text style={styles.text}>
      ★ {avgRating.toFixed(1)} ({reviewCount})
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
