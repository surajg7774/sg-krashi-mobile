import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { FarmerDashboardScreen } from "@/features/farmer/FarmerDashboardScreen";
import { FarmerListingsScreen } from "@/features/farmer/FarmerListingsScreen";
import { FarmerListingFormScreen } from "@/features/farmer/FarmerListingFormScreen";
import { FarmerPayoutsScreen } from "@/features/farmer/FarmerPayoutsScreen";
import { FarmerPayoutDetailScreen } from "@/features/farmer/FarmerPayoutDetailScreen";
import { colors } from "@/theme/colors";

export type FarmerStackParamList = {
  FarmerDashboard: undefined;
  FarmerListings: undefined;
  // Omitted listingId = create mode; present = edit mode (see
  // FarmerListingFormScreen's "save first, then upload photos" flow, which
  // switches itself into edit mode in place after a successful create).
  FarmerListingForm: { listingId?: number };
  FarmerPayouts: undefined;
  FarmerPayoutDetail: { payoutId: number };
};

const Stack = createNativeStackNavigator<FarmerStackParamList>();

export const FarmerStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.textPrimary,
      headerShadowVisible: false,
    }}
  >
    <Stack.Screen name="FarmerDashboard" component={FarmerDashboardScreen} options={{ title: "Farmer Dashboard" }} />
    <Stack.Screen name="FarmerListings" component={FarmerListingsScreen} options={{ title: "My Listings" }} />
    <Stack.Screen
      name="FarmerListingForm"
      component={FarmerListingFormScreen}
      options={({ route }) => ({ title: route.params.listingId ? "Edit Listing" : "Add Listing" })}
    />
    <Stack.Screen name="FarmerPayouts" component={FarmerPayoutsScreen} options={{ title: "Payout History" }} />
    <Stack.Screen name="FarmerPayoutDetail" component={FarmerPayoutDetailScreen} options={{ title: "Payout Detail" }} />
  </Stack.Navigator>
);
