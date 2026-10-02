import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { NavigatorScreenParams } from "@react-navigation/native";
import { Text } from "react-native";
import { HomeScreen } from "@/features/home/HomeScreen";
import { ProfileScreen } from "@/features/profile/ProfileScreen";
import { WeatherScreen } from "@/features/weather/WeatherScreen";
import { StoreStackNavigator, type StoreStackParamList } from "./StoreStackNavigator";
import { CropDoctorStackNavigator, type CropDoctorStackParamList } from "./CropDoctorStackNavigator";
import { FarmerStackNavigator, type FarmerStackParamList } from "./FarmerStackNavigator";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";

export type TabParamList = {
  Home: undefined;
  // NavigatorScreenParams (not `undefined`) — lets Home navigate straight
  // into the Store tab's nested stack (e.g. to a specific ProductDetail)
  // via navigation.navigate("Store", { screen: "ProductDetail", params }).
  Store: NavigatorScreenParams<StoreStackParamList> | undefined;
  CropDoctor: NavigatorScreenParams<CropDoctorStackParamList> | undefined;
  Weather: undefined;
  Farmer: NavigatorScreenParams<FarmerStackParamList> | undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

// Plain emoji icons for this milestone — swapping in a real icon set
// (e.g. @expo/vector-icons, already bundled with Expo) is cosmetic polish,
// not part of "get one real screen working end-to-end."
const TAB_ICONS: Record<keyof TabParamList, string> = {
  Home: "🏠",
  // 🏪 (storefront), not 🛒 — the Home screen header now has a dedicated
  // Cart icon, so Store needs to look visually distinct from it.
  Store: "🏪",
  CropDoctor: "🌿",
  Weather: "☀️",
  Farmer: "🚜",
  Profile: "👤",
};

// First role-gated tab in the app — established here since nothing needed
// it before. AuthUser.roles is already returned in full by /auth/mobile/login
// (see auth/types.ts), so this reads it directly rather than decoding the
// JWT itself.
export const TabNavigator = () => {
  const { user } = useAuth();
  const isFarmer = user?.roles.includes("FARMER") ?? false;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name as keyof TabParamList]}</Text>,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Store" component={StoreStackNavigator} />
      <Tab.Screen name="CropDoctor" component={CropDoctorStackNavigator} options={{ title: "Crop Doctor" }} />
      <Tab.Screen name="Weather" component={WeatherScreen} />
      {isFarmer && <Tab.Screen name="Farmer" component={FarmerStackNavigator} />}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
