import { apiClient } from "@/api/client";
import type { ChatMessage, ChatSession } from "./types";

// POST endpoints are public (Guests and Customers both chat); GET
// /sessions/{id} requires auth+ownership and has no use here since there's
// no "list my sessions" endpoint to resume one from — see
// com.sgkrashi.chatassistant.controller.ChatController's Javadoc. The
// screen keeps its own message list locally instead of ever calling that
// endpoint.
export const chatService = {
  createSession: async (): Promise<ChatSession> => {
    const response = await apiClient.post<ChatSession>("/chat/sessions");
    return response.data;
  },

  sendMessage: async (sessionId: number, message: string): Promise<ChatMessage> => {
    const response = await apiClient.post<ChatMessage>(`/chat/sessions/${sessionId}/messages`, { message });
    return response.data;
  },
};
