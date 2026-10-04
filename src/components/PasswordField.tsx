import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors } from "@/theme/colors";

interface PasswordFieldProps extends Omit<TextInputProps, "secureTextEntry" | "style"> {}

// Shared by LoginScreen and RegisterScreen — plain emoji toggle rather than
// an icon library, same "no new dependency for one glyph" reasoning as the
// rest of this app's UI (SelectField's modal, etc.).
export const PasswordField = (props: PasswordFieldProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.row}>
      <TextInput
        {...props}
        style={styles.input}
        secureTextEntry={!visible}
        placeholderTextColor={colors.textSecondary}
      />
      <Pressable style={({ pressed }) => [styles.toggle, pressed && { opacity: 0.6 }]} onPress={() => setVisible((v) => !v)}>
        <Text style={styles.toggleText}>{visible ? "🙈" : "👁️"}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  // minWidth/minHeight — the row's alignItems:"center" means this doesn't
  // stretch to match the input's height; it was sizing to just the emoji
  // glyph itself (~20pt), well under the 44pt minimum tap target.
  toggle: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleText: {
    fontSize: 18,
  },
});
