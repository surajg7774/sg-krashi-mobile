import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <View style={styles.container}>
    <Text style={styles.message}>{message}</Text>
    <Pressable style={({ pressed }) => [styles.button, pressed && { opacity: 0.6 }]} onPress={onRetry}>
      <Text style={styles.buttonText}>Retry</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 32,
  },
  message: {
    color: colors.error,
    marginBottom: 12,
    textAlign: "center",
  },
  // minHeight — paddingVertical:10 alone computed to ~40pt tall, under the
  // 44pt minimum tap target. This button is reused across nearly every
  // screen in the app, so the fix here covers all of them at once.
  button: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  buttonText: {
    color: colors.primary,
    fontWeight: "600",
  },
});
