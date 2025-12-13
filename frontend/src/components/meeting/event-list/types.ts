// ================================
// Event List Types
// ================================

import type { MeetingEvent, EventType } from '@/lib/api/events';

export interface EventListProps {
  meetingId: string;
  isHost: boolean;
  isParticipant: boolean;
}

export interface EventCardProps {
  event: MeetingEvent;
  meetingId: string;
  userId?: string;
  isHost: boolean;
  isPast?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
  onClick: () => void;
  isJoining?: boolean;
  isLeaving?: boolean;
}

export interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
}

export interface EventDetailModalProps {
  event: MeetingEvent | null;
  meetingId: string;
  isHost: boolean;
  userId?: string;
  onClose: () => void;
  onJoin: () => void;
  onLeave: () => void;
}

export interface EventFormData {
  type: EventType;
  title: string;
  description: string;
  date: string;
  endTime: string;
  location: string;
  maxParticipants: string;
}

export interface EventDateInfo {
  month: string;
  day: number;
  weekday: string;
  time: string;
}

// Re-export for convenience
export type { MeetingEvent, EventType };
