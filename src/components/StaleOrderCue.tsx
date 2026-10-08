import { StyleSheet, Text } from "react-native";
import { colors } from "@/theme/colors";
import { useT } from "@/i18n/useT";

/** Placed right under an order status shown from a saved copy: the status may have changed since. */
export const StaleOrderCue = ({ align = "left" }: { align?: "left" | "right" }) => {
  const { t } = useT();
  return <Text style={[styles.cue, { textAlign: align }]}>{t("offline.orderMayBeOutOfDate")}</Text>;
};

const styles = StyleSheet.create({
  cue: { fontSize: 11, color: colors.textSecondary, fontStyle: "italic", marginTop: 4 },
});
