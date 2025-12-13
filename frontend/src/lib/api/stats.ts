// ================================
// Stats API Client
// ================================

import { api } from './client';
import type { PublicStats, TrendingMeeting, RecentActivity } from '@/types/stats';

// ================================
// API Functions
// ================================

export const statsApi = {
  /**
   * 공개 통계 데이터 조회
   */
  getPublicStats: async (): Promise<PublicStats> => {
    return api.get<PublicStats>('/public/stats');
  },

  /**
   * 트렌딩 모임 목록 조회
   */
  getTrendingMeetings: async (limit: number = 10): Promise<TrendingMeeting[]> => {
    return api.get<TrendingMeeting[]>('/meetings/trending', { params: { limit } });
  },

  /**
   * 최근 활동 피드 조회
   */
  getRecentActivities: async (limit: number = 10): Promise<RecentActivity[]> => {
    return api.get<RecentActivity[]>('/public/recent-activities', { params: { limit } });
  },
};
