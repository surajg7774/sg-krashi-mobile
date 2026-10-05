import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

interface EmptyStateProps {
  icon?: string;
  message: string;
  /** An optional second, quieter line under the message. */
  description?: string;
  action?: ReactNode;
}

// Same shape as ErrorState.tsx (icon + message + action) — most list
// screens previously just showed a bare centered <Text>, no icon, no CTA.
// Icon is an emoji string, not a vector icon component — matches this
// app's existing convention (TabNavigator/HomeScreen are plain emoji too;
// no icon library is installed, and this one component isn't worth adding
// one for).
export const EmptyState = ({ icon = "📭", message, description, action }: EmptyStateProps) => (
  <View style={styles.container}>
    <Text style={styles.icon}>{icon}</Text>
    <Text style={styles.message}>{message}</Text>
    {description ? <Text style={styles.description}>{description}</Text> : null}
    {action}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  icon: {
    fontSize: 40,
    marginBottom: 12,
  },
  message: {
    color: colors.textSecondary,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  description: {
    color: colors.textSecondary,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
});
