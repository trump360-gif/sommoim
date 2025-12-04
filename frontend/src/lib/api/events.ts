import { api } from './client';

// ================================
// Types
// ================================

export type EventType = 'REGULAR' | 'LIGHTNING';
export type RecurringRule = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
export type EventParticipantStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'ATTENDED' | 'NO_SHOW';

export interface MeetingEvent {
  id: string;
  meetingId: string;
  type: EventType;
  title: string;
  description?: string;
  date: string;
  endTime?: string;
  location?: string;
  maxParticipants?: number;
  recurringId?: string;
  recurringRule?: RecurringRule;
  qrCode?: string;
  qrExpiresAt?: string;
  participants: EventParticipant[];
  _count?: {
    participants: number;
    chatMessages: number;
  };
  createdById: string;
  createdAt: string;
}

export interface EventParticipant {
  id: string;
  eventId: string;
  userId: string;
  status: EventParticipantStatus;
  attendedAt?: string;
  createdAt: string;
}

// ================================
// DTOs
// ================================

export interface CreateEventDto {
  type?: EventType;
  title: string;
  description?: string;
  date: string;
  endTime?: string;
  location?: string;
  maxParticipants?: number;
}

export interface CreateRecurringEventDto extends CreateEventDto {
  recurringRule: RecurringRule;
  count?: number;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  date?: string;
  endTime?: string;
  location?: string;
  maxParticipants?: number;
}

export interface AttendanceStats {
  PENDING: number;
  CONFIRMED: number;
  DECLINED: number;
  ATTENDED: number;
  NO_SHOW: number;
}

export interface QrCodeResponse {
  qrCode: string;
  expiresAt: string;
}

// ================================
// API Functions
// ================================

export const eventsApi = {
  // Event CRUD
  create: (meetingId: string, data: CreateEventDto) =>
    api.post<MeetingEvent>(`/meetings/${meetingId}/events`, data),

  createRecurring: (meetingId: string, data: CreateRecurringEventDto) =>
    api.post<MeetingEvent[]>(`/meetings/${meetingId}/events/recurring`, data),

  getAll: (meetingId: string, type?: EventType) =>
    api.get<MeetingEvent[]>(`/meetings/${meetingId}/events`, { params: { type } }),

  getOne: (meetingId: string, eventId: string) =>
    api.get<MeetingEvent>(`/meetings/${meetingId}/events/${eventId}`),

  update: (meetingId: string, eventId: string, data: UpdateEventDto) =>
    api.put<MeetingEvent>(`/meetings/${meetingId}/events/${eventId}`, data),

  delete: (meetingId: string, eventId: string) =>
    api.delete<{ message: string }>(`/meetings/${meetingId}/events/${eventId}`),

  // Participant Management
  join: (meetingId: string, eventId: string) =>
    api.post<EventParticipant>(`/meetings/${meetingId}/events/${eventId}/join`),

  leave: (meetingId: string, eventId: string) =>
    api.delete<{ message: string }>(`/meetings/${meetingId}/events/${eventId}/leave`),

  getParticipants: (meetingId: string, eventId: string) =>
    api.get<EventParticipant[]>(`/meetings/${meetingId}/events/${eventId}/participants`),

  updateParticipantStatus: (meetingId: string, eventId: string, userId: string, status: EventParticipantStatus) =>
    api.put<EventParticipant>(`/meetings/${meetingId}/events/${eventId}/participants/${userId}`, { status }),

  // QR Check-in
  generateQrCode: (meetingId: string, eventId: string) =>
    api.post<QrCodeResponse>(`/meetings/${meetingId}/events/${eventId}/qr`),

  checkIn: (qrCode: string) =>
    api.post<EventParticipant>('/events/check-in', { qrCode }),

  getAttendanceStats: (meetingId: string, eventId: string) =>
    api.get<AttendanceStats>(`/meetings/${meetingId}/events/${eventId}/attendance`),
};
