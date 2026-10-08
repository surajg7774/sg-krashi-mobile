import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "@/theme/colors";
import { ICONS } from "@/theme/icons";
import { useT } from "@/i18n/useT";

interface PasswordFieldProps extends Omit<TextInputProps, "secureTextEntry" | "style"> {}

// Shared by LoginScreen and RegisterScreen: the eye icon shows or hides what was typed.
export const PasswordField = (props: PasswordFieldProps) => {
  const { t } = useT();
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.row}>
      <TextInput
        {...props}
        style={styles.input}
        secureTextEntry={!visible}
        placeholderTextColor={colors.textSecondary}
      />
      <Pressable
        style={({ pressed }) => [styles.toggle, pressed && { opacity: 0.6 }]}
        onPress={() => setVisible((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={t(visible ? "auth.login.hidePassword" : "auth.login.showPassword")}
      >
        <Ionicons name={visible ? ICONS.eyeOff : ICONS.eye} size={22} color={colors.textSecondary} />
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
