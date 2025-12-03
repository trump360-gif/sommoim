import { api } from './client';
import type { Meeting, PaginatedResponse, Category, MeetingStatus, Participant } from '@/types';

export interface MeetingQueryParams {
  search?: string;
  category?: Category;
  location?: string;
  status?: MeetingStatus;
  startDate?: string;
  endDate?: string;
  sort?: 'latest' | 'popular' | 'rating' | 'deadline';
  page?: number;
  limit?: number;
}

export interface CreateMeetingDto {
  title: string;
  description: string;
  category: Category;
  location: string;
  maxParticipants: number;
  imageUrl?: string;
  autoApprove?: boolean;
  schedules?: {
    startTime: string;
    endTime: string;
    location?: string;
    note?: string;
  }[];
}

export interface UpdateMeetingDto extends Partial<CreateMeetingDto> {
  status?: MeetingStatus;
}

export const meetingsApi = {
  // 모임 CRUD
  getAll: (params?: MeetingQueryParams) =>
    api.get<PaginatedResponse<Meeting>>('/meetings', { params: params as Record<string, string | number | undefined> }),
  getOne: (id: string) => api.get<Meeting>(`/meetings/${id}`),
  create: (data: CreateMeetingDto) => api.post<Meeting>('/meetings', data),
  update: (id: string, data: UpdateMeetingDto) => api.put<Meeting>(`/meetings/${id}`, data),
  delete: (id: string) => api.delete<void>(`/meetings/${id}`),
  cancel: (id: string) => api.post<{ message: string }>(`/meetings/${id}/cancel`),

  // 참가
  apply: (meetingId: string) => api.post<Participant>(`/meetings/${meetingId}/participants`),
  cancelParticipation: (meetingId: string) => api.delete<void>(`/meetings/${meetingId}/participants/me`),
  getParticipants: (meetingId: string, status?: string) =>
    api.get<Participant[]>(`/meetings/${meetingId}/participants`, { params: { status } }),
  updateParticipant: (meetingId: string, participantId: string, status: 'APPROVED' | 'REJECTED' | 'KICKED', reason?: string) =>
    api.put<Participant>(`/meetings/${meetingId}/participants/${participantId}`, { status, reason }),

  // 내 참가 모임
  getMyParticipations: (status?: string) =>
    api.get<{ meeting: Meeting; status: string }[]>('/users/me/participations', { params: { status } }),
};
