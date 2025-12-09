import { api } from './client';
import type { Meeting } from '@/types/meeting';

export interface Profile {
  id: string;
  email: string;
  nickname: string;
  role: string;
  profile?: {
    bio?: string;
    avatarUrl?: string;
    faceImageUrl?: string;
  };
  _count?: {
    followers: number;
    following: number;
    hostedMeetings: number;
  };
  createdAt: string;
}

export interface UpdateProfileDto {
  nickname?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface Participation {
  id: string;
  status: string;
  meeting: {
    id: string;
    title: string;
    description: string;
    hostId: string;
  };
}

export interface BookmarksResponse {
  data: Meeting[];
  meta: { total: number; page: number };
}

export const usersApi = {
  getMe: () => api.get<Profile>('/users/me'),

  updateProfile: (data: UpdateProfileDto) => api.put<Profile>('/users/me', data),

  deleteAccount: () => api.delete('/users/me'),

  getUser: (id: string) => api.get<Profile>(`/users/${id}`),

  follow: (id: string) => api.post(`/users/${id}/follow`),

  unfollow: (id: string) => api.delete(`/users/${id}/follow`),

  getFollowers: (id: string, page = 1) =>
    api.get(`/users/${id}/followers`, { params: { page } }),

  getFollowing: (id: string, page = 1) =>
    api.get(`/users/${id}/following`, { params: { page } }),

  getMyBookmarks: (page = 1) =>
    api.get<BookmarksResponse>('/users/me/bookmarks', { params: { page } }),

  getMyParticipations: (status?: string) =>
    api.get<Participation[]>('/users/me/participations', { params: { status } }),

  getMyMeetings: () =>
    api.get<{
      hosted: Array<{
        id: string;
        title: string;
        description: string;
        category: string;
        status: string;
        imageUrl?: string;
        maxParticipants: number;
        role: 'HOST';
        participantStatus: 'APPROVED';
        _count: { participants: number };
      }>;
      participated: Array<{
        id: string;
        title: string;
        description: string;
        category: string;
        status: string;
        imageUrl?: string;
        maxParticipants: number;
        hostId: string;
        role: 'MEMBER';
        participantStatus: string;
        _count: { participants: number };
      }>;
    }>('/users/me/meetings'),

  // 차단
  blockUser: (id: string) => api.post(`/users/${id}/block`),
  unblockUser: (id: string) => api.delete(`/users/${id}/block`),
  getBlockedUsers: () => api.get<{
    id: string;
    createdAt: string;
    blocked: {
      id: string;
      nickname: string;
      profile?: { avatarUrl?: string };
    };
  }[]>('/users/me/blocked'),

  // 신고
  reportUser: (id: string, reason: string, description?: string) =>
    api.post(`/users/${id}/report`, { reason, description }),
};
