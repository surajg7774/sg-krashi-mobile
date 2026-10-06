import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StoreScreen } from "@/features/store/StoreScreen";
import { ProductDetailScreen } from "@/features/store/ProductDetailScreen";
import { CropMarketplaceScreen } from "@/features/crop-marketplace/CropMarketplaceScreen";
import { CropListingDetailScreen } from "@/features/crop-marketplace/CropListingDetailScreen";
import { cropStrings } from "@/features/crop-marketplace/strings";
import { colors } from "@/theme/colors";

export type StoreStackParamList = {
  StoreList: undefined;
  ProductDetail: { idOrSlug: string };
  // The Crop Marketplace lives in the Store stack, like product detail, so Home, the cart and the
  // recommendation rails can all open it the same way: navigate("Store", { screen: "CropDetail", ... }).
  CropList: undefined;
  CropDetail: { idOrSlug: string };
};

const Stack = createNativeStackNavigator<StoreStackParamList>();

export const StoreStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.textPrimary,
      headerShadowVisible: false,
    }}
  >
    <Stack.Screen name="StoreList" component={StoreScreen} options={{ title: "Store" }} />
    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: "" }} />
    <Stack.Screen name="CropList" component={CropMarketplaceScreen} options={{ title: cropStrings.browse.title }} />
    <Stack.Screen name="CropDetail" component={CropListingDetailScreen} options={{ title: "" }} />
  </Stack.Navigator>
);
