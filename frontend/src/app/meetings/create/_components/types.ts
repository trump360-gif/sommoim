// ================================
// Types & Constants
// ================================

import type { Category } from '@/types';

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'SPORTS', label: '운동' },
  { value: 'GAMES', label: '게임' },
  { value: 'FOOD', label: '음식' },
  { value: 'CULTURE', label: '문화' },
  { value: 'TRAVEL', label: '여행' },
  { value: 'STUDY', label: '학습' },
];

export interface MeetingFormData {
  title: string;
  description: string;
  category: Category;
  location: string;
  maxParticipants: number;
  autoApprove: boolean;
}

export interface ScheduleInput {
  startTime: string;
  endTime: string;
  location: string;
  note: string;
}

export const initialFormData: MeetingFormData = {
  title: '',
  description: '',
  category: 'SPORTS',
  location: '',
  maxParticipants: 10,
  autoApprove: false,
};

export const initialSchedule: ScheduleInput = {
  startTime: '',
  endTime: '',
  location: '',
  note: '',
};
