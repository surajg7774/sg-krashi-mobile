import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
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
  const isFocused = useIsFocused();
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
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* The deep green band is under the status bar, so the clock and battery are drawn light while this screen is open. */}
      {isFocused && <StatusBar style="light" />}
      <View style={[styles.brandBand, { paddingTop: screenTopPadding(insets.top) }]}>
        <View style={styles.languageRow}>
          <LanguageToggle compact />
        </View>
        {/* The logo's gold lettering and green tree need a light card to be read on the deep green. */}
        <View style={styles.logoCard}>
          <Image source={require("../../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
        </View>
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  // Branded top area: the deep green with the gold edge (the same pair as the Home header).
  brandBand: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderBottomWidth: 4,
    borderBottomColor: colors.secondary,
  },
  logoCard: {
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  container: {
    flex: 1,
  },
  form: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  languageRow: {
    marginBottom: 12,
  },
  logo: {
    width: 160,
    height: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primaryDark,
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
