// ================================
// Imports & Dependencies
// ================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Category, MeetingStatus } from '@prisma/client';

// ================================
// Types
// ================================

export interface RecommendedMeeting {
  id: string;
  title: string;
  description: string;
  category: Category;
  location: string;
  imageUrl: string | null;
  status: MeetingStatus;
  score: number;
  reason: string[];
  host: { id: string; nickname: string };
  _count: { participants: number };
  nextEvent?: { date: Date; title: string } | null;
}

interface RecommendationParams {
  userId: string;
  limit?: number;
  excludeJoined?: boolean;
}

// ================================
// Service
// ================================

@Injectable()
export class MeetingRecommendationService {
  constructor(private prisma: PrismaService) {}

  // ================================
  // Main Recommendation
  // ================================

  async getRecommendations(params: RecommendationParams): Promise<RecommendedMeeting[]> {
    const { userId, limit = 10, excludeJoined = true } = params;

    // 사용자 프로필 및 참여 이력 조회
    const [profile, participations, bookmarks] = await Promise.all([
      this.getUserProfile(userId),
      this.getUserParticipations(userId),
      this.getUserBookmarks(userId),
    ]);

    // 제외할 모임 ID 목록
    const excludeIds = excludeJoined
      ? [...participations.map((p) => p.meetingId), ...bookmarks.map((b) => b.meetingId)]
      : [];

    // 추천 후보 모임 조회
    const candidates = await this.getCandidateMeetings(excludeIds);

    // 점수 계산 및 정렬
    const scored = candidates.map((meeting) => ({
      ...meeting,
      ...this.calculateScore(meeting, profile, participations),
    }));

    // 점수 기준 정렬 및 제한
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  // ================================
  // Scoring Logic
  // ================================

  private calculateScore(
    meeting: any,
    profile: any,
    participations: any[],
  ): { score: number; reason: string[] } {
    let score = 0;
    const reason: string[] = [];

    // 1. 관심사 일치 (최대 30점)
    if (profile?.interests?.includes(meeting.category)) {
      score += 30;
      reason.push('관심 카테고리');
    }

    // 2. 지역 일치 (최대 25점)
    if (profile?.location && meeting.location.includes(profile.location)) {
      score += 25;
      reason.push('내 지역 모임');
    }

    // 3. 인기도 점수 (최대 20점)
    const participantCount = meeting._count?.participants || 0;
    const popularityScore = Math.min(participantCount * 2, 20);
    score += popularityScore;
    if (participantCount >= 5) {
      reason.push('인기 모임');
    }

    // 4. 평점 점수 (최대 15점)
    const avgRating = meeting.reviews?.length > 0
      ? meeting.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / meeting.reviews.length
      : 0;
    if (avgRating >= 4) {
      score += 15;
      reason.push('높은 평점');
    } else if (avgRating >= 3) {
      score += 10;
    }

    // 5. 최근 활동 (최대 10점)
    const hasRecentEvent = meeting.events?.some(
      (e: any) => new Date(e.date) > new Date(),
    );
    if (hasRecentEvent) {
      score += 10;
      reason.push('다가오는 일정');
    }

    // 6. 유사 사용자 참여 (협업 필터링, 최대 15점)
    const participatedCategories = [...new Set(participations.map((p) => p.meeting.category))];
    if (participatedCategories.includes(meeting.category)) {
      score += 15;
      reason.push('비슷한 모임 참여 이력');
    }

    // 7. 신규 모임 부스트 (5점)
    const isNew = new Date(meeting.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (isNew) {
      score += 5;
      reason.push('새로운 모임');
    }

    return { score, reason: reason.length > 0 ? reason : ['추천 모임'] };
  }

  // ================================
  // Data Fetchers
  // ================================

  private async getUserProfile(userId: string) {
    return this.prisma.profile.findUnique({
      where: { userId },
      select: { interests: true, location: true },
    });
  }

  private async getUserParticipations(userId: string) {
    return this.prisma.participant.findMany({
      where: { userId, status: 'APPROVED' },
      select: {
        meetingId: true,
        meeting: { select: { category: true } },
      },
    });
  }

  private async getUserBookmarks(userId: string) {
    return this.prisma.bookmark.findMany({
      where: { userId },
      select: { meetingId: true },
    });
  }

  private async getCandidateMeetings(excludeIds: string[]) {
    return this.prisma.meeting.findMany({
      where: {
        id: { notIn: excludeIds },
        status: 'RECRUITING',
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        location: true,
        imageUrl: true,
        status: true,
        createdAt: true,
        host: { select: { id: true, nickname: true } },
        _count: { select: { participants: true } },
        reviews: { select: { rating: true } },
        events: {
          where: { date: { gte: new Date() } },
          orderBy: { date: 'asc' },
          take: 1,
          select: { date: true, title: true },
        },
      },
      take: 100, // 후보 최대 100개
    });
  }

  // ================================
  // Category-based Recommendations
  // ================================

  async getByCategory(category: Category, limit: number = 10) {
    return this.prisma.meeting.findMany({
      where: {
        category,
        status: 'RECRUITING',
        deletedAt: null,
      },
      orderBy: [
        { viewCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        location: true,
        imageUrl: true,
        host: { select: { id: true, nickname: true } },
        _count: { select: { participants: true } },
      },
    });
  }

  // ================================
  // Popular Meetings
  // ================================

  async getPopular(limit: number = 10) {
    return this.prisma.meeting.findMany({
      where: {
        status: 'RECRUITING',
        deletedAt: null,
      },
      orderBy: [
        { viewCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        location: true,
        imageUrl: true,
        host: { select: { id: true, nickname: true } },
        _count: { select: { participants: true } },
      },
    });
  }

  // ================================
  // Nearby Meetings
  // ================================

  async getNearby(location: string, limit: number = 10) {
    return this.prisma.meeting.findMany({
      where: {
        location: { contains: location },
        status: 'RECRUITING',
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        location: true,
        imageUrl: true,
        host: { select: { id: true, nickname: true } },
        _count: { select: { participants: true } },
      },
    });
  }
}
