// Matches com.sgkrashi.chatassistant's real DTOs exactly (no web frontend
// exists for this feature to mirror — verified via an exhaustive grep of
// sg-krashi-client finding zero chat-feature files — so this UI is designed
// fresh against the backend contract itself).
export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: number;
  messages: ChatMessage[];
}
