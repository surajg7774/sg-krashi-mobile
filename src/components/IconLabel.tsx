import { StyleSheet, Text, View, type StyleProp, type TextStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { IconName } from "@/theme/icons";

/** An icon beside a text label (the photo buttons). The icon is decorative: the label already says what it does. */
export const IconLabel = ({ icon, label, color, textStyle, size = 18 }: { icon: IconName; label: string; color: string; textStyle?: StyleProp<TextStyle>; size?: number }) => (
  <View style={styles.row}>
    <Ionicons name={icon} size={size} color={color} accessible={false} />
    <Text style={[textStyle, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
});
