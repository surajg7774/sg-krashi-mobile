import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  GoogleOneTapSignIn,
  isCancelledResponse,
  isNoSavedCredentialFoundResponse,
  isSuccessResponse,
} from "react-native-nitro-google-signin";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";
import { DELETE_ACCOUNT_URL } from "@/config/legal";
import { ensureGoogleSignInConfigured } from "@/features/auth/googleAuth";
import { classifyGoogleFailure } from "@/features/auth/googleErrors";
import { scriptLineHeight } from "@/i18n/layout";
import { useT } from "@/i18n/useT";
import { accountService } from "./accountService";

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Confirmation step for in-app account deletion. Password accounts re-enter
 * their password; accounts with no password confirm with a *fresh* Google ID
 * token (same native flow as sign-in, but the token is only sent to the
 * delete endpoint — it never logs anyone in). The server refuses while an
 * order, booking or payout is in flight and says which; that message is
 * shown as-is.
 */
export const DeleteAccountModal = ({ visible, onClose }: DeleteAccountModalProps) => {
  const { logout } = useAuth();
  const { t, lang, errorText } = useT();
  const [password, setPassword] = useState("");
  const [googleToken, setGoogleToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingGoogle, setIsConfirmingGoogle] = useState(false);

  const methodsQuery = useQuery({
    queryKey: ["account-sign-in-methods"],
    queryFn: accountService.getSignInMethods,
    enabled: visible,
  });
  const usesPassword = methodsQuery.data?.hasPassword ?? true;

  // Reset in the close handler (not an effect) so reopening always starts clean.
  const close = () => {
    if (isDeleting) return;
    setPassword("");
    setGoogleToken("");
    setError(null);
    onClose();
  };

  const confirmWithGoogle = async () => {
    setError(null);
    setIsConfirmingGoogle(true);
    try {
      await ensureGoogleSignInConfigured();
      let response = await GoogleOneTapSignIn.signIn();
      if (isNoSavedCredentialFoundResponse(response)) {
        response = await GoogleOneTapSignIn.presentExplicitSignIn();
      }
      if (isSuccessResponse(response)) {
        setGoogleToken(response.data.idToken);
      } else if (!isCancelledResponse(response)) {
        setError(t("account.googleIncomplete"));
      }
    } catch (err) {
      // The same mapping as sign-in: backing out of the picker is not an error.
      if (classifyGoogleFailure(err).kind === "silent") return;
      setError(t("account.googleFailed"));
    } finally {
      setIsConfirmingGoogle(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      await accountService.deleteAccount(usesPassword ? { password } : { googleIdToken: googleToken });
      // The account is gone server-side; drop the local session (also unregisters push, best-effort).
      await logout();
    } catch (err) {
      // The server says why it refuses (an order, booking or payout in flight); that message is shown as sent.
      setError(errorText(err, "account"));
      setIsDeleting(false);
    }
  };

  const canSubmit = usesPassword ? password.length > 0 : googleToken.length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.card}>
          <Text style={styles.title}>{t("account.title")}</Text>
          <Text style={[styles.body, { lineHeight: scriptLineHeight(lang, 14, 20) }]}>{t("account.body")}</Text>
          <Pressable
            onPress={() => void Linking.openURL(DELETE_ACCOUNT_URL).catch(() => undefined)}
            style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.6 }]}
            hitSlop={{ top: 8, bottom: 8 }}
          >
            <Text style={styles.link}>{t("account.seeDetails")}</Text>
          </Pressable>

          {error && <Text style={styles.error}>{error}</Text>}

          {usesPassword ? (
            <TextInput
              style={styles.input}
              placeholder={t("account.passwordPlaceholder")}
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              editable={!isDeleting}
            />
          ) : googleToken ? (
            <Text style={styles.confirmed}>{t("account.googleConfirmed")}</Text>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.googleButton, pressed && { opacity: 0.6 }]}
              onPress={() => void confirmWithGoogle()}
              disabled={isConfirmingGoogle}
            >
              {isConfirmingGoogle ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.googleButtonText}>{t("account.confirmWithGoogle")}</Text>
              )}
            </Pressable>
          )}

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.6 }]}
              onPress={close}
              disabled={isDeleting}
            >
              <Text style={styles.cancelText}>{t("common.cancel")}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.deleteButton,
                (!canSubmit || isDeleting) && styles.deleteButtonDisabled,
                pressed && { opacity: 0.6 },
              ]}
              onPress={() => void handleDelete()}
              disabled={!canSubmit || isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator color={colors.primaryContrastText} />
              ) : (
                <Text style={styles.deleteText}>{t("account.deletePermanently")}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: "center", padding: 24 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 20 },
  title: { fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: 10 },
  body: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  linkRow: { minHeight: 44, justifyContent: "center" },
  link: { fontSize: 14, color: colors.primary, fontWeight: "600" },
  error: { color: colors.error, fontSize: 13, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  confirmed: { color: colors.success, fontWeight: "600", fontSize: 14 },
  googleButton: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  googleButtonText: { color: colors.primary, fontWeight: "600" },
  actions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 12, marginTop: 18 },
  cancelButton: { minHeight: 44, paddingHorizontal: 16, justifyContent: "center" },
  cancelText: { color: colors.textSecondary, fontWeight: "600" },
  deleteButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonDisabled: { opacity: 0.4 },
  deleteText: { color: colors.primaryContrastText, fontWeight: "700" },
});
