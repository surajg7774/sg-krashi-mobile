import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

export interface PricePillProps {
  label: string;
}

/** Mirrors sg-krashi-client's price-pill treatment (Trend Refresh #3) — a rounded, primary-colored badge instead of plain text, adapted to RN View/Text. */
export const PricePill = ({ label }: PricePillProps) => (
  <View style={styles.pill}>
    <Text style={styles.text}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 4,
  },
  text: {
    color: colors.primaryContrastText,
    fontWeight: "700",
    fontSize: 13,
  },
});
