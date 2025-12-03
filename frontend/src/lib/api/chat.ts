import { api } from './client';

export interface ChatMessage {
  id: string;
  content: string;
  user: {
    id: string;
    nickname: string;
    profile?: { avatarUrl?: string };
  };
  createdAt: string;
}

export interface ChatMessagesResponse {
  data: ChatMessage[];
  meta: { total: number; page: number };
}

export const chatApi = {
  getMessages: (meetingId: string, page = 1, limit = 50) =>
    api.get<ChatMessagesResponse>(`/chat/${meetingId}/messages`, { params: { page, limit } }),

  deleteMessage: (messageId: string) =>
    api.delete(`/chat/messages/${messageId}`),
};
