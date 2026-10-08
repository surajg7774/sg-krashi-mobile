import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, type CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/context/AuthContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "@/theme/colors";
import { ICONS } from "@/theme/icons";
import { screenTopPadding } from "@/theme/insets";
import type { TabParamList } from "@/navigation/TabNavigator";
import type { MainStackParamList } from "@/navigation/MainStackNavigator";
import type { MessageKey } from "@/i18n";
import { useT } from "@/i18n/useT";

const ROLE_KEYS: Record<string, MessageKey | undefined> = {
  FARMER: "profile.roles.FARMER",
  CUSTOMER: "profile.roles.CUSTOMER",
  ADMIN: "profile.roles.ADMIN",
};

type Navigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Profile">,
  NativeStackNavigationProp<MainStackParamList>
>;

// The person: name, email and role, their notifications, My Orders and Log out (pinned in a fixed footer so it never
// scrolls out of reach). Everything about the app itself (language, legal pages, version, deleting the account) lives
// on the Settings screen, opened from the gear at the top right.
export const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const { t } = useT();
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();

  const initial = user?.name?.trim().charAt(0).toUpperCase() || "?";

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: screenTopPadding(insets.top, 24) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {!!user?.roles?.length && (
          <Text style={styles.roles}>{user.roles.map((role) => (ROLE_KEYS[role] ? t(ROLE_KEYS[role]) : role)).join(", ")}</Text>
        )}

        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Notifications")}>
            <View style={styles.menuItemLeft}>
              <Ionicons name={ICONS.notifications} size={22} color={colors.primary} />
              <Text style={styles.menuItemText}>{t("profile.notifications")}</Text>
            </View>
            <Ionicons name={ICONS.chevron} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Top right, over the scrolling content. 44 dp square: the smallest comfortable touch target. */}
      <TouchableOpacity
        style={[styles.settingsButton, { top: screenTopPadding(insets.top, 4) }]}
        onPress={() => navigation.navigate("Settings")}
        accessibilityRole="button"
        accessibilityLabel={t("settings.open")}
      >
        <Ionicons name={ICONS.settings} size={26} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.ordersButton} onPress={() => navigation.navigate("OrderHistory")}>
          <Text style={styles.ordersButtonText}>{t("profile.myOrders")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={() => void logout()}>
          <Text style={styles.logoutButtonText}>{t("profile.logout")}</Text>
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
  settingsButton: {
    position: "absolute",
    right: 12,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: { fontSize: 24 },
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
  menuCard: {
    width: "100%",
    marginTop: 32,
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
  menuItemLeft: { flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 },
  menuItemText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
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
