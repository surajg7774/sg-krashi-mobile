import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LanguageToggle } from "@/components/LanguageToggle";
import { APP_VERSION } from "@/config/appInfo";
import { PRIVACY_POLICY_URL, TERMS_URL } from "@/config/legal";
import { DeleteAccountModal } from "@/features/profile/DeleteAccountModal";
import { useT } from "@/i18n/useT";
import { openWebPage } from "@/shared/openWebPage";
import { colors } from "@/theme/colors";
import { ICONS } from "@/theme/icons";

/**
 * App-wide choices and the less-used account actions, moved off the Profile screen so Profile stays about the person:
 * language, the legal pages, the app version, and (last, apart from the rest) deleting the account. The deletion
 * confirmation itself is unchanged: it is the same DeleteAccountModal Profile used.
 */
export const SettingsScreen = () => {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.sectionLabel}>{t("language.title")}</Text>
      <LanguageToggle />

      <Text style={styles.sectionLabel}>{t("settings.legal")}</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={() => openWebPage(PRIVACY_POLICY_URL)} accessibilityRole="link">
          <View style={styles.rowLeft}>
            <Ionicons name={ICONS.privacy} size={22} color={colors.primary} />
            <Text style={styles.rowText}>{t("settings.privacyPolicy")}</Text>
          </View>
          <Ionicons name={ICONS.chevron} size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.row} onPress={() => openWebPage(TERMS_URL)} accessibilityRole="link">
          <View style={styles.rowLeft}>
            <Ionicons name={ICONS.terms} size={22} color={colors.primary} />
            <Text style={styles.rowText}>{t("settings.terms")}</Text>
          </View>
          <Ionicons name={ICONS.chevron} size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>{t("settings.about")}</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name={ICONS.version} size={22} color={colors.primary} />
            <Text style={styles.rowText}>{t("settings.version")}</Text>
          </View>
          <Text style={styles.value}>{APP_VERSION}</Text>
        </View>
      </View>

      {/* Kept apart and last: the one action here that cannot be undone. */}
      <Text style={[styles.sectionLabel, styles.dangerLabel]}>{t("settings.dangerZone")}</Text>
      <View style={[styles.card, styles.dangerCard]}>
        <TouchableOpacity style={styles.row} onPress={() => setShowDeleteAccount(true)} accessibilityRole="button">
          <View style={styles.rowLeft}>
            <Ionicons name={ICONS.deleteAccount} size={22} color={colors.error} />
            <Text style={[styles.rowText, styles.dangerText]}>{t("settings.deleteAccount")}</Text>
          </View>
          <Ionicons name={ICONS.chevron} size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.dangerHint}>{t("settings.dangerHint")}</Text>

      <DeleteAccountModal visible={showDeleteAccount} onClose={() => setShowDeleteAccount(false)} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginTop: 24, marginBottom: 8 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 },
  rowText: { flexShrink: 1, fontSize: 15, color: colors.textPrimary, fontWeight: "500" },
  value: { fontSize: 15, color: colors.textSecondary },
  chevron: { fontSize: 20, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.divider, marginLeft: 16 },
  dangerLabel: { marginTop: 40, color: colors.error },
  dangerCard: { borderColor: colors.error },
  dangerText: { color: colors.error },
  dangerHint: { fontSize: 12, color: colors.textSecondary, marginTop: 8 },
});
