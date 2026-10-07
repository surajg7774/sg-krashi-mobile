import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { colors } from "@/theme/colors";
import { useAuth } from "@/context/AuthContext";
import { authService } from "./authService";
import { splitTemplate } from "@/i18n";
import { useT } from "@/i18n/useT";
import type { GuestStackParamList } from "@/navigation/GuestStackNavigator";

type Navigation = NativeStackNavigationProp<GuestStackParamList, "VerifyOtp">;
type Route = RouteProp<GuestStackParamList, "VerifyOtp">;

// Matches the server's own cooldown (AuthServiceImpl.OTP_RESEND_COOLDOWN_SECONDS)
// — kept here only to drive the countdown UI, not to enforce anything; the
// server is the real source of truth and rejects an early resend regardless.
const RESEND_COOLDOWN_SECONDS = 60;

export const VerifyOtpScreen = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { email } = route.params;
  const { verifyOtp } = useAuth();
  const { t, errorText } = useT();

  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    setError(null);
    setIsVerifying(true);
    try {
      await verifyOtp({ email, otp });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // No navigation call needed — AuthContext's setUser() flips
      // isAuthenticated, and RootNavigator (not this screen) reacts to that
      // by swapping the whole guest stack out, same as after a normal login.
    } catch (err) {
      setError(errorText(err, t("auth.otp.verifyFailed")));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setIsResending(true);
    try {
      await authService.resendOtp({ email });
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(errorText(err, t("auth.otp.resendFailed"), { details: false }));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.content}>
        <Text style={styles.title}>{t("auth.otp.title")}</Text>
        <Text style={styles.subtitle}>
          {splitTemplate(t("auth.otp.sentTo")).map((part, index) =>
            typeof part === "string" ? (
              part
            ) : (
              <Text key={index} style={styles.emailText}>
                {email}
              </Text>
            )
          )}
        </Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TextInput
          style={styles.otpInput}
          placeholder="------"
          placeholderTextColor={colors.textSecondary}
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={(value) => setOtp(value.replace(/\D/g, "").slice(0, 6))}
          editable={!isVerifying}
          autoFocus
        />

        <TouchableOpacity
          style={[styles.button, (isVerifying || otp.length !== 6) && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={isVerifying || otp.length !== 6}
        >
          {isVerifying ? (
            <ActivityIndicator color={colors.primaryContrastText} />
          ) : (
            <Text style={styles.buttonText}>{t("auth.otp.verify")}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>{t("auth.otp.didntGetCode")}</Text>
          {cooldown > 0 ? (
            <Text style={styles.resendCooldown}>{t("auth.otp.resendIn", { seconds: cooldown })}</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={isResending} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
              <Text style={styles.resendLink}>{isResending ? t("auth.otp.sending") : t("auth.otp.resend")}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.backLink}
          onPress={() => navigation.navigate("Login")}
          hitSlop={{ top: 12, bottom: 12 }}
        >
          <Text style={styles.backLinkText}>{t("auth.otp.backToLogin")}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 22,
  },
  emailText: {
    fontWeight: "600",
    color: colors.textPrimary,
  },
  errorText: {
    color: colors.error,
    marginBottom: 12,
    textAlign: "center",
  },
  otpInput: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 20,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: "center",
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.primaryContrastText,
    fontSize: 16,
    fontWeight: "600",
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 20,
  },
  resendText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  resendCooldown: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  resendLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  backLink: {
    marginTop: 24,
  },
  backLinkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
