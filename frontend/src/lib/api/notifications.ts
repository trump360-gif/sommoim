import { api } from './client';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  priority: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

interface NotificationsResponse {
  data: Notification[];
  meta: { total: number; unreadCount: number };
}

export const notificationsApi = {
  getAll: (page = 1, limit = 20) =>
    api.get<NotificationsResponse>('/notifications', { params: { page, limit } }),

  getUnread: () => api.get<Notification[]>('/notifications/unread'),

  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),

  markAllAsRead: () => api.put('/notifications/read-all'),

  delete: (id: string) => api.delete(`/notifications/${id}`),
};
