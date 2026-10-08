import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "@/theme/colors";
import { PasswordField } from "@/components/PasswordField";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { authService } from "./authService";
import { splitTemplate } from "@/i18n";
import { scriptLineHeight } from "@/i18n/layout";
import { useT } from "@/i18n/useT";
import { PRIVACY_POLICY_URL, TERMS_URL } from "@/config/legal";
import type { GuestStackParamList } from "@/navigation/GuestStackNavigator";

const openWebPage = (url: string) => {
  void Linking.openURL(url).catch(() => undefined);
};

type Navigation = NativeStackNavigationProp<GuestStackParamList, "Register">;

// Deliberately simple — not a full RFC 5322 validator, just enough to catch
// the everyday typo (missing @, no domain) before it round-trips to the
// server's real @Email check, same "simple validation is fine here" spirit
// as the rest of this app.
const isPlausibleEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const RegisterScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { t, lang, errorText } = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trimmed once, reused for both the submit-button guard below and the
  // actual submitted payload — previously the guard checked the raw
  // (untrimmed) state while the payload sent trimmed values, so a
  // whitespace-only name/email could look "filled in" in the UI yet still
  // fail the backend's @NotBlank check.
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const canSubmit = trimmedName.length > 0 && isPlausibleEmail(trimmedEmail) && password.length >= 8;

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await authService.register({ name: trimmedName, email: trimmedEmail, password, phone: phone.trim() || undefined });
      navigation.navigate("VerifyOtp", { email: trimmedEmail });
    } catch (err) {
      // The backend's per-field reason (e.g. "email: Email must be a valid
      // address") lives in `details`, not the generic top-level `message`
      // ("Request validation failed") — showing only the latter was the
      // actual bug: every validation failure looked identical and gave no
      // clue which field or why.
      setError(errorText(err, t("auth.register.failed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t("auth.register.title")}</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TextInput
          style={styles.input}
          placeholder={t("auth.register.fullName")}
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
          editable={!isSubmitting}
        />
        <TextInput
          style={styles.input}
          placeholder={t("auth.register.email")}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!isSubmitting}
        />
        <TextInput
          style={styles.input}
          placeholder={t("auth.register.phone")}
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          editable={!isSubmitting}
        />
        <PasswordField
          placeholder={t("auth.register.password")}
          value={password}
          onChangeText={setPassword}
          editable={!isSubmitting}
        />

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting || !canSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.primaryContrastText} />
          ) : (
            <Text style={styles.buttonText}>{t("auth.register.submit")}</Text>
          )}
        </TouchableOpacity>

        {/* The links sit wherever the language's word order puts them ({terms}, {privacy} in the text). */}
        <Text style={[styles.consentText, { lineHeight: scriptLineHeight(lang, 12, 18) }]}>
          {splitTemplate(t("auth.register.consent")).map((part, index) =>
            typeof part === "string" ? (
              part
            ) : part.name === "terms" ? (
              <Text key={index} style={styles.consentLink} onPress={() => openWebPage(TERMS_URL)}>
                {t("auth.register.terms")}
              </Text>
            ) : (
              <Text key={index} style={styles.consentLink} onPress={() => openWebPage(PRIVACY_POLICY_URL)}>
                {t("auth.register.privacy")}
              </Text>
            )
          )}
        </Text>

        <GoogleSignInButton onError={setError} />

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate("Login")}
          hitSlop={{ top: 12, bottom: 12 }}
        >
          <Text style={styles.loginLinkText}>{t("auth.register.loginLink")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
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
  consentText: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: "center",
  },
  consentLink: {
    color: colors.primary,
    fontWeight: "600",
  },
  loginLink: {
    marginTop: 20,
  },
  loginLinkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
