import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors } from "@/theme/colors";

// A plain pulsing box — no extra library. Good enough for "this is a loading
// placeholder shaped like the real content," which is the actual requirement
// (vs. a bare spinner that gives no sense of layout while loading).
const PulsingBox = ({ style }: { style: object }) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

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
});
