import { apiClient } from "./apiClient";
import type { ConversationDto, ChatMessageDto, ChatContactDto } from "../types/api";

/**
 * REST chat API client. Mirrors the backend ChatController under /api/chat.
 * All endpoints are authenticated; the apiClient attaches the bearer token.
 */
export const chatService = {
  /** GET /api/chat/conversations */
  async getConversations(): Promise<ConversationDto[]> {
    return apiClient.get<ConversationDto[]>("/chat/conversations");
  },

  /** POST /api/chat/conversations/direct — find or create a 1:1 thread. */
  async startDirect(userId: number): Promise<ConversationDto> {
    return apiClient.post<ConversationDto>("/chat/conversations/direct", { userId });
  },

  /** GET /api/chat/conversations/:id/messages */
  async getMessages(conversationId: number): Promise<ChatMessageDto[]> {
    return apiClient.get<ChatMessageDto[]>(`/chat/conversations/${conversationId}/messages`);
  },

  /** POST /api/chat/conversations/:id/messages */
  async sendMessage(conversationId: number, content: string): Promise<ChatMessageDto> {
    return apiClient.post<ChatMessageDto>(`/chat/conversations/${conversationId}/messages`, { content });
  },

  /** POST /api/chat/conversations/:id/read — clear unread count. */
  async markRead(conversationId: number): Promise<void> {
    return apiClient.post<void>(`/chat/conversations/${conversationId}/read`);
  },

  /** GET /api/chat/contacts — community members to start a chat with. */
  async getContacts(): Promise<ChatContactDto[]> {
    return apiClient.get<ChatContactDto[]>("/chat/contacts");
  },
};
