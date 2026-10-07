import { useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, type CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";
import type { TabParamList } from "@/navigation/TabNavigator";
import type { MainStackParamList } from "@/navigation/MainStackNavigator";
import { PRIVACY_POLICY_URL, TERMS_URL } from "@/config/legal";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useT } from "@/i18n/useT";
import { DeleteAccountModal } from "./DeleteAccountModal";

// The legal pages are the website's; open them in the browser rather than keeping a copy in the app.
const openWebPage = (url: string) => {
  void Linking.openURL(url).catch(() => undefined);
};

type Navigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Profile">,
  NativeStackNavigationProp<MainStackParamList>
>;

// Scrollable menu list up top (just Notifications today, but built to take
// more rows — addresses/settings etc. — without restructuring again), with
// My Orders/Log out pinned in a fixed footer below it, never scrolling out
// of reach the way a long menu list eventually would.
export const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const { t } = useT();
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();

  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const initial = user?.name?.trim().charAt(0).toUpperCase() || "?";

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {!!user?.roles?.length && <Text style={styles.roles}>{user.roles.join(", ")}</Text>}

        <View style={styles.languageSection}>
          <Text style={styles.sectionLabel}>{t("language.title")}</Text>
          <LanguageToggle />
        </View>

        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("Notifications")}
          >
            <Text style={styles.menuItemText}>Notifications</Text>
            <Text style={styles.menuItemChevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => openWebPage(PRIVACY_POLICY_URL)}>
            <Text style={styles.menuItemText}>Privacy Policy</Text>
            <Text style={styles.menuItemChevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => openWebPage(TERMS_URL)}>
            <Text style={styles.menuItemText}>Terms &amp; Conditions</Text>
            <Text style={styles.menuItemChevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowDeleteAccount(true)}>
            <Text style={[styles.menuItemText, styles.menuItemDestructive]}>Delete account</Text>
            <Text style={styles.menuItemChevron}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <DeleteAccountModal visible={showDeleteAccount} onClose={() => setShowDeleteAccount(false)} />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.ordersButton} onPress={() => navigation.navigate("OrderHistory")}>
          <Text style={styles.ordersButtonText}>My Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={() => void logout()}>
          <Text style={styles.logoutButtonText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const AVATAR_SIZE = 88;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: "center",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 34,
    fontWeight: "700",
    color: colors.primaryContrastText,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  roles: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
    textTransform: "capitalize",
  },
  languageSection: {
    width: "100%",
    marginTop: 32,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
  },
  menuCard: {
    width: "100%",
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  menuItemDestructive: {
    color: colors.error,
  },
  menuItemChevron: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.background,
    gap: 10,
  },
  ordersButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  ordersButtonText: {
    color: colors.primary,
    fontWeight: "600",
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButtonText: {
    color: colors.error,
    fontWeight: "600",
  },
});
