import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export interface NewBadgeProps {
  createdAt: string;
}

/**
 * Mirrors sg-krashi-client's NewBadge — renders nothing once the listing is
 * older than 7 days. `Date.now()` is impure, so it's read once via a lazy
 * useState initializer (not on every render) — same pattern as Skeleton.tsx's
 * PulsingBox fix.
 */
export const NewBadge = ({ createdAt }: NewBadgeProps) => {
  const [isNew] = useState(() => Date.now() - new Date(createdAt).getTime() < NEW_WINDOW_MS);
  if (!isNew) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>New</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.secondary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 11,
  },
});
