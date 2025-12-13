// ================================
// Public Stats Types
// ================================

import type { Meeting } from '@/types';

export interface PublicStats {
  totalMeetings: number;
  totalUsers: number;
  totalActivities: number;
  activeToday: number;
}

// ================================
// Trending Meeting Types
// ================================

export interface TrendingMeeting extends Meeting {
  rank: number;
  trendScore: number;
}

// ================================
// Recent Activity Types
// ================================

export type ActivityType = 'NEW_MEETING' | 'JOIN' | 'ACTIVITY' | 'REVIEW';

export interface RecentActivity {
  id: string;
  type: ActivityType;
  message: string;
  meetingId?: string;
  meetingTitle?: string;
  userName?: string;
  userAvatar?: string;
  createdAt: string;
}
