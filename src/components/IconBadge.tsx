import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { accents, type AccentName } from "@/theme/colors";
import type { IconName } from "@/theme/icons";

/** A menu row's leading icon: a soft tinted circle with the icon in its deep colour (3:1 or better, tested). Decorative. */
export const IconBadge = ({ icon, accent }: { icon: IconName; accent: AccentName }) => (
  <View style={[styles.circle, { backgroundColor: accents[accent].tint }]}>
    <Ionicons name={icon} size={20} color={accents[accent].icon} accessible={false} />
  </View>
);

const styles = StyleSheet.create({
  circle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});
