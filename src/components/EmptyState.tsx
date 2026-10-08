import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "@/theme/colors";
import { ICONS, type IconName } from "@/theme/icons";
import { scriptLineHeight } from "@/i18n/layout";
import { useT } from "@/i18n/useT";

interface EmptyStateProps {
  icon?: IconName;
  message: string;
  /** An optional second, quieter line under the message. */
  description?: string;
  action?: ReactNode;
}

// Same shape as ErrorState.tsx (icon + message + action) — most list
// screens previously just showed a bare centered <Text>, no icon, no CTA.
// The icon is an Ionicons name (src/theme/icons.ts), drawn in the muted text colour.
export const EmptyState = ({ icon = ICONS.emptyMail, message, description, action }: EmptyStateProps) => {
  // Devanagari needs more line height than these English values (src/i18n/layout.ts).
  const { lang } = useT();
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={44} color={colors.grey300} style={styles.icon} accessible={false} />
      <Text style={[styles.message, { lineHeight: scriptLineHeight(lang, 14, 20) }]}>{message}</Text>
      {description ? <Text style={[styles.description, { lineHeight: scriptLineHeight(lang, 13, 18) }]}>{description}</Text> : null}
      {action}
    </View>
  );
};

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
