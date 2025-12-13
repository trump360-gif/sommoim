// ================================
// Event List Constants
// ================================

export const EVENT_TYPE_TABS = [
  { key: 'all', label: '전체' },
  { key: 'REGULAR', label: '정모' },
  { key: 'LIGHTNING', label: '번개' },
] as const;

export const DEFAULT_FORM_DATA = {
  type: 'REGULAR' as const,
  title: '',
  description: '',
  date: '',
  endTime: '',
  location: '',
  maxParticipants: '',
};
