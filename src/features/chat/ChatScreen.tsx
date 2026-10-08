import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";
import { ICONS } from "@/theme/icons";
import { EmptyState } from "@/components/EmptyState";
import { chatService } from "./chatService";
import type { ChatMessage } from "./types";
import { useT } from "@/i18n/useT";

let clientMessageIdCounter = -1;

export const ChatScreen = () => {
  const insets = useSafeAreaInsets();
  const { t, errorText } = useT();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionError, setSessionError] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    chatService
      .createSession()
      .then((session) => setSessionId(session.id))
      .catch(() => setSessionError(true));
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !sessionId || isSending) return;

    const userMessage: ChatMessage = {
      id: clientMessageIdCounter--,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSendError(null);
    setIsSending(true);

    try {
      const reply = await chatService.sendMessage(sessionId, text);
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      setSendError(errorText(err, "chat"));
    } finally {
      setIsSending(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  if (sessionError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t("chat.unavailable")}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {!sessionId ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={
            <EmptyState
              icon={ICONS.assistant}
              message={t("chat.intro")}
            />
          }
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.assistantBubble]}>
              <Text style={item.role === "user" ? styles.userBubbleText : styles.assistantBubbleText}>{item.content}</Text>
            </View>
          )}
        />
      )}

      {sendError && <Text style={styles.sendErrorText}>{sendError}</Text>}
      {isSending && <ActivityIndicator color={colors.primary} style={{ marginBottom: 8 }} />}

      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 12 }]}>
        <TextInput
          style={styles.input}
          placeholder={t("chat.placeholder")}
          placeholderTextColor={colors.textSecondary}
          value={input}
          onChangeText={setInput}
          editable={!!sessionId && !isSending}
          multiline
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendButton,
            (!input.trim() || !sessionId || isSending) && styles.sendButtonDisabled,
            pressed && { opacity: 0.6 },
          ]}
          disabled={!input.trim() || !sessionId || isSending}
          onPress={() => void handleSend()}
        >
          <Text style={styles.sendButtonText}>{t("chat.send")}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  errorText: { color: colors.textSecondary, textAlign: "center" },
  messageList: { padding: 16, flexGrow: 1 },
  bubble: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10, maxWidth: "85%" },
  userBubble: { backgroundColor: colors.primary, alignSelf: "flex-end" },
  assistantBubble: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider, alignSelf: "flex-start" },
  userBubbleText: { color: colors.primaryContrastText, fontSize: 14 },
  assistantBubbleText: { color: colors.textPrimary, fontSize: 14 },
  sendErrorText: { color: colors.error, fontSize: 12, textAlign: "center", marginBottom: 6 },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    maxHeight: 100,
  },
  // minHeight/minWidth — previously relied entirely on stretching to match
  // the TextInput sibling's intrinsic height (~38-40pt), just under the
  // 44pt minimum tap target.
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 18,
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: colors.primaryContrastText, fontWeight: "600", fontSize: 14 },
});
