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

  // 활동 기록
  getActivities: (meetingId: string) =>
    api.get<MeetingActivity[]>(`/meetings/${meetingId}/activities`),
  createActivity: (meetingId: string, data: CreateActivityDto) =>
    api.post<MeetingActivity>(`/meetings/${meetingId}/activities`, data),
  updateActivity: (activityId: string, data: Partial<CreateActivityDto>) =>
    api.put<MeetingActivity>(`/meetings/activities/${activityId}`, data),
  deleteActivity: (activityId: string) =>
    api.delete<void>(`/meetings/activities/${activityId}`),

  // 활동 참석
  updateAttendance: (activityId: string, status: AttendanceStatus) =>
    api.put<AttendanceResponse>(`/meetings/activities/${activityId}/attendance`, { status }),
  getActivityAttendances: (activityId: string) =>
    api.get<ActivityAttendance[]>(`/meetings/activities/${activityId}/attendances`),
  getMyAttendance: (activityId: string) =>
    api.get<ActivityAttendance | null>(`/meetings/activities/${activityId}/my-attendance`),

  // 내 캘린더
  getMyCalendar: (startDate?: string, endDate?: string) =>
    api.get<CalendarEvent[]>('/users/me/calendar', { params: { startDate, endDate } }),
};

// Types
export type AttendanceStatus = 'PENDING' | 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE';

export interface MeetingActivity {
  id: string;
  meetingId: string;
  title: string;
  description?: string;
  date: string;
  endTime?: string;
  location?: string;
  images: ActivityImage[];
  createdById: string;
  createdAt: string;
  attendances?: ActivityAttendance[];
}

export interface ActivityImage {
  id: string;
  imageUrl: string;
  caption?: string;
  order: number;
}

export interface ActivityAttendance {
  id: string;
  activityId: string;
  userId: string;
  status: AttendanceStatus;
  respondedAt?: string;
}

export interface AttendanceResponse {
  hasConflict: boolean;
  attendance?: ActivityAttendance;
  conflicts?: ScheduleConflict[];
  message?: string;
}

export interface ScheduleConflict {
  activityId: string;
  activityTitle: string;
  meetingTitle: string;
  date: string;
  endTime?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  endTime?: string;
  location?: string;
  meeting: {
    id: string;
    title: string;
    category: string;
    imageUrl?: string;
  };
  attendanceStatus: AttendanceStatus;
}

export interface CreateActivityDto {
  title: string;
  description?: string;
  date: string;
  endTime?: string;
  location?: string;
  images?: { imageUrl: string; caption?: string; order?: number }[];
}
