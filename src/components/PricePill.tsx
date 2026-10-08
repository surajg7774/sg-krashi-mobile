import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

export interface PricePillProps {
  label: string;
}

/** A rounded badge instead of plain text: the brand gold with dark text on it (7:1), so the price is what the eye finds first. */
export const PricePill = ({ label }: PricePillProps) => (
  <View style={styles.pill}>
    <Text style={styles.text}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    backgroundColor: colors.secondary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 4,
  },
  text: {
    color: colors.onGold,
    fontWeight: "700",
    fontSize: 13,
  },
});
