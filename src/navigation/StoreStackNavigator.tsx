import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StoreScreen } from "@/features/store/StoreScreen";
import { ProductDetailScreen } from "@/features/store/ProductDetailScreen";
import { colors } from "@/theme/colors";

export type StoreStackParamList = {
  StoreList: undefined;
  ProductDetail: { idOrSlug: string };
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
  </Stack.Navigator>
);
