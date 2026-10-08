import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CropDoctorScreen } from "@/features/crop-doctor/CropDoctorScreen";
import { ScanDetailScreen } from "@/features/crop-doctor/ScanDetailScreen";
import { colors } from "@/theme/colors";
import { useT } from "@/i18n/useT";

export type CropDoctorStackParamList = {
  CropDoctorHome: undefined;
  ScanDetail: { scanId: number };
};

const Stack = createNativeStackNavigator<CropDoctorStackParamList>();

// Reused as-is inside both the authenticated TabNavigator (as the "Crop
// Doctor" tab) and the unauthenticated GuestStackNavigator (reachable from
// Login's "Try without an account" link) — the screen itself already
// branches its own UI on isAuthenticated (scan history only renders when
// logged in), so one stack definition covers both contexts.
export const CropDoctorStackNavigator = () => {
  const { t } = useT();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="CropDoctorHome" component={CropDoctorScreen} options={{ title: t("nav.headers.cropDoctor") }} />
      <Stack.Screen name="ScanDetail" component={ScanDetailScreen} options={{ title: t("nav.headers.scanDetail") }} />
    </Stack.Navigator>
  );
};
