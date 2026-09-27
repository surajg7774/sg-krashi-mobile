import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NavigatorScreenParams } from "@react-navigation/native";
import { TabNavigator, type TabParamList } from "./TabNavigator";
import { CartScreen } from "@/features/cart/CartScreen";
import { AddressSelectScreen } from "@/features/address/AddressSelectScreen";
import { CheckoutScreen } from "@/features/checkout/CheckoutScreen";
import { OrderConfirmationScreen } from "@/features/orders/OrderConfirmationScreen";
import { OrderHistoryScreen } from "@/features/orders/OrderHistoryScreen";
import { MandiScreen } from "@/features/mandi/MandiScreen";
import { ChatScreen } from "@/features/chat/ChatScreen";
import { NotificationCenterScreen } from "@/features/notifications/NotificationCenterScreen";
import { colors } from "@/theme/colors";

// Cart/Checkout/Orders are lifted above the tab navigator (not nested inside
// any one tab) because they need to be reachable from multiple tabs (Home's
// cart badge, Store's future cart icon, Profile's order history link) —
// pushing them onto this root stack works the same regardless of which tab
// was active when the push happened.
export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList> | undefined;
  Cart: undefined;
  AddressSelect: undefined;
  Checkout: { addressId: number };
  OrderConfirmation: { orderId: number };
  OrderHistory: undefined;
  Mandi: undefined;
  Chat: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.textPrimary,
      headerShadowVisible: false,
    }}
  >
    <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
    <Stack.Screen name="Cart" component={CartScreen} options={{ title: "Cart" }} />
    <Stack.Screen name="AddressSelect" component={AddressSelectScreen} options={{ title: "Select Address" }} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Review Order" }} />
    <Stack.Screen
      name="OrderConfirmation"
      component={OrderConfirmationScreen}
      options={{ title: "Order", headerBackVisible: false }}
    />
    <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ title: "My Orders" }} />
    <Stack.Screen name="Mandi" component={MandiScreen} options={{ title: "Mandi Prices" }} />
    <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "Chat Assistant" }} />
    <Stack.Screen name="Notifications" component={NotificationCenterScreen} options={{ title: "Notifications" }} />
  </Stack.Navigator>
);
