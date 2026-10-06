import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { colors } from "@/theme/colors";
import { cropStrings as S } from "./strings";

interface QuantityStepperProps {
  value: number;
  /** The most the buyer can pick here: the lesser of the stock and 10 (see maxQuantity). */
  max: number;
  onChange: (next: number) => void;
}

/** − 3 + with 44-point touch targets, labelled for screen readers. */
export const QuantityStepper = ({ value, max, onChange }: QuantityStepperProps) => {
  const change = (next: number) => {
    void Haptics.selectionAsync();
    onChange(next);
  };
  return (
    <View style={styles.row} accessibilityRole="adjustable" accessibilityLabel={`${S.detail.quantity} ${value}`} accessibilityValue={{ min: 1, max, now: value }}>
      <Pressable
        style={({ pressed }) => [styles.button, value <= 1 && styles.buttonDisabled, pressed && { opacity: 0.6 }]}
        disabled={value <= 1}
        onPress={() => change(Math.max(1, value - 1))}
        accessibilityRole="button"
        accessibilityLabel={S.detail.decreaseQuantity}
        accessibilityState={{ disabled: value <= 1 }}
      >
        <Text style={styles.buttonText}>−</Text>
      </Pressable>
      <Text style={styles.value} accessibilityLiveRegion="polite">
        {value}
      </Text>
      <Pressable
        style={({ pressed }) => [styles.button, value >= max && styles.buttonDisabled, pressed && { opacity: 0.6 }]}
        disabled={value >= max}
        onPress={() => change(Math.min(max, value + 1))}
        accessibilityRole="button"
        accessibilityLabel={S.detail.increaseQuantity}
        accessibilityState={{ disabled: value >= max }}
      >
        <Text style={styles.buttonText}>+</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.divider, borderRadius: 10, backgroundColor: colors.surface },
  button: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  buttonDisabled: { opacity: 0.35 },
  buttonText: { fontSize: 22, color: colors.primary, fontWeight: "600" },
  value: { minWidth: 32, textAlign: "center", fontSize: 16, fontWeight: "600", color: colors.textPrimary },
});
