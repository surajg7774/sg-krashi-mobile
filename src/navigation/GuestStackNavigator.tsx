import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "@/features/auth/LoginScreen";
import { RegisterScreen } from "@/features/auth/RegisterScreen";
import { CropDoctorStackNavigator } from "./CropDoctorStackNavigator";
import { colors } from "@/theme/colors";

// Rendered by RootNavigator whenever there's no authenticated session. Login
// used to be the ONLY thing an unauthenticated user could reach — but AI
// Crop Doctor's real backend contract is guest-accessible (POST /analyze
// has no auth requirement; see cropDoctorService's comment), matching the
// web app's design where the whole scan flow works without an account and
// login is only needed to save history. Login screen links into
// "CropDoctorGuest" and "Register"; the authenticated TabNavigator reaches
// the same CropDoctorStackNavigator as its own tab.
export type GuestStackParamList = {
  Login: undefined;
  Register: undefined;
  CropDoctorGuest: undefined;
};

const Stack = createNativeStackNavigator<GuestStackParamList>();

export const GuestStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.textPrimary,
      headerShadowVisible: false,
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
    <Stack.Screen name="CropDoctorGuest" component={CropDoctorStackNavigator} options={{ headerShown: false }} />
  </Stack.Navigator>
);
