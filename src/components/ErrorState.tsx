import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <View style={styles.container}>
    <Text style={styles.message}>{message}</Text>
    <Pressable style={styles.button} onPress={onRetry}>
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
  button: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  buttonText: {
    color: colors.primary,
    fontWeight: "600",
  },
});
