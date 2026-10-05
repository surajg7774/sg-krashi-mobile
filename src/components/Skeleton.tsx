import { useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors } from "@/theme/colors";

// A plain pulsing box — no extra library. Good enough for "this is a loading
// placeholder shaped like the real content," which is the actual requirement
// (vs. a bare spinner that gives no sense of layout while loading).
const PulsingBox = ({ style }: { style: object }) => {
  // useState's lazy initializer (not useRef().current) — reading a ref
  // during render is flagged by react-hooks/refs; Animated.Value's identity
  // only needs to be stable across renders, which useState already gives it.
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[style, { opacity, backgroundColor: colors.grey100 }]} />;
};

/** A single pulsing block the size of a chart/card — for content that isn't a list row or a grid card. */
export const BlockSkeleton = ({ height }: { height: number }) => (
  <PulsingBox style={{ width: "100%", height, borderRadius: 12 }} />
);

const CardSkeleton = () => (
  <View style={styles.card}>
    <PulsingBox style={styles.cardImage} />
    <PulsingBox style={styles.line} />
    <PulsingBox style={styles.lineShort} />
  </View>
);

export const CardSkeletonGrid = ({ count }: { count: number }) => (
  <View style={styles.grid}>
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </View>
);

export interface ListRowSkeletonProps {
  /** Omit for a text-only row (Notifications, Mandi, Farmer Payouts, Order History). Pass the real thumbnail's size (56 for Farmer Listings, 48 for Crop Doctor history) to match it. */
  thumbnailSize?: number;
  /** Stacked text lines in the row. Defaults to 2. */
  lines?: number;
  /** A small trailing badge-shaped box (status/active badge). */
  trailing?: boolean;
  /** "card": bordered rounded row (Order History, Mandi, Farmer Payouts, Farmer Listings, Crop Doctor history). "flat": bottom-divider row (Notifications). Defaults to "card". */
  variant?: "card" | "flat";
}

const ListRowSkeleton = ({ thumbnailSize, lines = 2, trailing = false, variant = "card" }: ListRowSkeletonProps) => (
  <View style={variant === "card" ? styles.listRowCard : styles.listRowFlat}>
    {thumbnailSize ? (
      <PulsingBox style={{ width: thumbnailSize, height: thumbnailSize, borderRadius: 8 }} />
    ) : null}
    <View style={styles.listRowContent}>
      {Array.from({ length: lines }).map((_, i) => (
        <PulsingBox key={i} style={i === lines - 1 ? styles.listLineShort : styles.listLine} />
      ))}
    </View>
    {trailing ? <PulsingBox style={styles.listTrailing} /> : null}
  </View>
);

export const ListRowSkeletonList = ({
  count,
  ...rowProps
}: { count: number } & ListRowSkeletonProps) => (
  <View>
    {Array.from({ length: count }).map((_, i) => (
      <ListRowSkeleton key={i} {...rowProps} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    marginBottom: 14,
  },
  cardImage: {
    width: "100%",
    height: 110,
    borderRadius: 8,
    marginBottom: 8,
  },
  line: {
    height: 14,
    borderRadius: 4,
    marginBottom: 6,
  },
  lineShort: {
    height: 14,
    width: "50%",
    borderRadius: 4,
  },
  listRowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 12,
    marginBottom: 10,
  },
  listRowFlat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  listRowContent: {
    flex: 1,
    gap: 6,
  },
  listLine: {
    height: 14,
    borderRadius: 4,
    width: "60%",
  },
  listLineShort: {
    height: 14,
    borderRadius: 4,
    width: "40%",
  },
  listTrailing: {
    width: 48,
    height: 20,
    borderRadius: 6,
  },
});
