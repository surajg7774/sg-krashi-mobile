import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation, type CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";
import type { TabParamList } from "@/navigation/TabNavigator";
import type { MainStackParamList } from "@/navigation/MainStackNavigator";

type Navigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Profile">,
  NativeStackNavigationProp<MainStackParamList>
>;

// Not a pure placeholder like Store/Weather — needs a real logout button so
// the login flow can actually be re-tested without reinstalling the app.
export const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<Navigation>();

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.roles}>Roles: {user?.roles.join(", ")}</Text>

      <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate("OrderHistory")}>
        <Text style={styles.linkButtonText}>My Orders</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate("Notifications")}>
        <Text style={styles.linkButtonText}>Notifications</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => void logout()}>
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  roles: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
  linkButton: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  linkButtonText: {
    color: colors.primary,
    fontWeight: "600",
  },
  button: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: colors.error,
    fontWeight: "600",
  },
});
