import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

interface PlaceholderScreenProps {
  title: string;
}

// Shared placeholder for tabs not built this milestone (Store, Weather) —
// deliberately not per-screen boilerplate.
export const PlaceholderScreen = ({ title }: PlaceholderScreenProps) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>Coming soon</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
  },
});
