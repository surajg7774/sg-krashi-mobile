import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";
import { screenTopPadding } from "@/theme/insets";
import { PasswordField } from "@/components/PasswordField";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useT } from "@/i18n/useT";
import type { GuestStackParamList } from "@/navigation/GuestStackNavigator";

type Navigation = NativeStackNavigationProp<GuestStackParamList, "Login">;

export const LoginScreen = () => {
  const { login } = useAuth();
  const { t, errorText } = useT();
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err) {
      // See RegisterScreen's identical fix — the backend's per-field reason
      // lives in `details`, not just the generic top-level `message`.
      setError(errorText(err, "login"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: screenTopPadding(insets.top) }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.languageRow}>
        <LanguageToggle compact />
      </View>
      <Image source={require("../../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>{t("auth.login.title")}</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TextInput
        style={styles.input}
        placeholder={t("auth.login.email")}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={!isSubmitting}
      />
      <PasswordField
        placeholder={t("auth.login.password")}
        value={password}
        onChangeText={setPassword}
        editable={!isSubmitting}
      />

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting || !email || !password}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.primaryContrastText} />
        ) : (
          <Text style={styles.buttonText}>{t("auth.login.submit")}</Text>
        )}
      </TouchableOpacity>

      <GoogleSignInButton onError={setError} />

      <TouchableOpacity
        style={styles.signupLink}
        onPress={() => navigation.navigate("Register")}
        hitSlop={{ top: 12, bottom: 12 }}
      >
        <Text style={styles.signupLinkText}>{t("auth.login.signUpLink")}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.guestLink}
        onPress={() => navigation.navigate("CropDoctorGuest")}
        hitSlop={{ top: 12, bottom: 12 }}
      >
        <Text style={styles.guestLinkText}>{t("auth.login.guestCropDoctor")}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  languageRow: {
    marginBottom: 12,
  },
  logo: {
    width: 160,
    height: 60,
    alignSelf: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 24,
    textAlign: "center",
  },
  errorText: {
    color: colors.error,
    marginBottom: 12,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.primaryContrastText,
    fontSize: 16,
    fontWeight: "600",
  },
  signupLink: {
    marginTop: 20,
  },
  signupLinkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  guestLink: {
    marginTop: 14,
  },
  guestLinkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
