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

export interface RecommendedMeeting extends Meeting {
  score: number;
  reason: string[];
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

  // 추천
  getRecommended: (limit?: number) =>
    api.get<RecommendedMeeting[]>('/meetings/recommended', { params: { limit } }),
  getPopular: (limit?: number) =>
    api.get<Meeting[]>('/meetings/popular', { params: { limit } }),
  getNearby: (location: string, limit?: number) =>
    api.get<Meeting[]>('/meetings/nearby', { params: { location, limit } }),
  getByCategory: (category: Category, limit?: number) =>
    api.get<Meeting[]>(`/meetings/category/${category}`, { params: { limit } }),

  // 일정 관리
  addSchedule: (meetingId: string, data: CreateScheduleDto) =>
    api.post<MeetingSchedule>(`/meetings/${meetingId}/schedules`, data),
  updateSchedule: (scheduleId: string, data: Partial<CreateScheduleDto>) =>
    api.put<MeetingSchedule>(`/meetings/schedules/${scheduleId}`, data),
  deleteSchedule: (scheduleId: string) =>
    api.delete<void>(`/meetings/schedules/${scheduleId}`),

  // 참가
  apply: (meetingId: string) => api.post<Participant>(`/meetings/${meetingId}/participants`),
  cancelApplication: (meetingId: string) => api.delete<void>(`/meetings/${meetingId}/participants/me`),
  withdraw: (meetingId: string, reason?: string) =>
    api.post<Participant>(`/meetings/${meetingId}/participants/withdraw`, { reason }),
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

  // 운영진 관리
  getStaffList: (meetingId: string) =>
    api.get<MeetingStaff[]>(`/meetings/${meetingId}/staff`),
  addStaff: (meetingId: string, data: AddStaffDto) =>
    api.post<MeetingStaff>(`/meetings/${meetingId}/staff`, data),
  updateStaff: (meetingId: string, staffUserId: string, data: UpdateStaffDto) =>
    api.put<MeetingStaff>(`/meetings/${meetingId}/staff/${staffUserId}`, data),
  removeStaff: (meetingId: string, staffUserId: string) =>
    api.delete<void>(`/meetings/${meetingId}/staff/${staffUserId}`),
  getMyRole: (meetingId: string) =>
    api.get<{ role: StaffRole | 'HOST' | null }>(`/meetings/${meetingId}/my-role`),

  // 가입 질문
  getJoinQuestions: (meetingId: string) =>
    api.get<JoinQuestion[]>(`/meetings/${meetingId}/join-questions`),
  createJoinQuestion: (meetingId: string, data: CreateJoinQuestionDto) =>
    api.post<JoinQuestion>(`/meetings/${meetingId}/join-questions`, data),
  updateJoinQuestion: (questionId: string, data: Partial<CreateJoinQuestionDto>) =>
    api.put<JoinQuestion>(`/meetings/join-questions/${questionId}`, data),
  deleteJoinQuestion: (questionId: string) =>
    api.delete<void>(`/meetings/join-questions/${questionId}`),

  // 가입 신청
  applyMeeting: (meetingId: string, data: ApplyMeetingDto) =>
    api.post<{ participant: Application; autoApproved: boolean; message: string }>(
      `/meetings/${meetingId}/apply`,
      data
    ),
  getApplications: (meetingId: string, status?: string) =>
    api.get<Application[]>(`/meetings/${meetingId}/applications`, { params: { status } }),
  getApplicationDetail: (participantId: string) =>
    api.get<Application>(`/meetings/applications/${participantId}`),
  reviewApplication: (participantId: string, data: ReviewApplicationDto) =>
    api.put<{ participant: Application; message: string }>(
      `/meetings/applications/${participantId}/review`,
      data
    ),
  bulkReviewApplications: (meetingId: string, participantIds: string[], data: ReviewApplicationDto) =>
    api.post<{ success: number; failed: { error: string; id: string }[] }>(
      `/meetings/${meetingId}/applications/bulk-review`,
      { ...data, participantIds }
    ),
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

export interface CreateScheduleDto {
  startTime: string;
  endTime: string;
  location?: string;
  note?: string;
}

export interface MeetingSchedule {
  id: string;
  meetingId: string;
  startTime: string;
  endTime: string;
  location?: string;
  note?: string;
}

// Staff Types
export type StaffRole = 'CO_HOST' | 'MANAGER' | 'STAFF';
export type StaffPermission =
  | 'MANAGE_EVENTS'
  | 'MANAGE_SCHEDULES'
  | 'MANAGE_ACTIVITIES'
  | 'MANAGE_MEMBERS'
  | 'MANAGE_CHAT'
  | 'VIEW_STATS';

export interface MeetingStaff {
  id: string;
  meetingId: string;
  userId: string;
  role: StaffRole;
  permissions: StaffPermission[];
  createdAt: string;
  user?: {
    id: string;
    name: string;
    profileImage?: string;
  };
}

export interface AddStaffDto {
  userId: string;
  role: StaffRole;
  permissions?: StaffPermission[];
}

export interface UpdateStaffDto {
  role?: StaffRole;
  permissions?: StaffPermission[];
}

// Join Question Types
export interface JoinQuestion {
  id: string;
  meetingId: string;
  question: string;
  isRequired: boolean;
  order: number;
  createdAt: string;
}

export interface JoinAnswer {
  id: string;
  questionId: string;
  participantId: string;
  answer: string;
  question?: { question: string };
}

export interface Application {
  id: string;
  meetingId: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'KICKED';
  introduction?: string;
  rejectedReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  user: {
    id: string;
    nickname: string;
    profile?: { avatarUrl?: string; bio?: string };
  };
  answers: JoinAnswer[];
}

export interface CreateJoinQuestionDto {
  question: string;
  isRequired?: boolean;
  order?: number;
}

export interface ApplyMeetingDto {
  introduction?: string;
  answers?: { questionId: string; answer: string }[];
}

export interface ReviewApplicationDto {
  status: 'APPROVED' | 'REJECTED';
  reason?: string;
}
