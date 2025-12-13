import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ================================
// Types (exported for controller)
// ================================

export interface PublicStats {
  totalMeetings: number;
  totalUsers: number;
  totalActivities: number;
  activeToday: number;
}

export interface RecentActivity {
  id: string;
  type: 'NEW_MEETING' | 'JOIN' | 'ACTIVITY' | 'REVIEW';
  message: string;
  meetingId?: string;
  meetingTitle?: string;
  userName?: string;
  userAvatar?: string;
  createdAt: Date;
}

// ================================
// Service
// ================================

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  // ================================
  // Public Stats
  // ================================

  async getPublicStats(): Promise<PublicStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalMeetings, totalUsers, totalActivities, activeToday] = await Promise.all([
      // 모집 중인 모임 수
      this.prisma.meeting.count({
        where: {
          deletedAt: null,
          status: 'RECRUITING',
        },
      }),
      // 전체 활성 사용자 수
      this.prisma.user.count({
        where: {
          deletedAt: null,
        },
      }),
      // 총 활동 수 (모임 활동 기록)
      this.prisma.meetingActivity.count(),
      // 오늘 활동한 사용자 수 (오늘 생성된 참가, 리뷰, 활동 기록)
      this.getActiveTodayCount(today),
    ]);

    return {
      totalMeetings,
      totalUsers,
      totalActivities,
      activeToday,
    };
  }

  private async getActiveTodayCount(today: Date): Promise<number> {
    // 오늘 참가 신청한 사용자, 리뷰 작성한 사용자, 모임 생성한 사용자의 고유 수
    const [participants, reviews, newMeetings] = await Promise.all([
      this.prisma.participant.findMany({
        where: { createdAt: { gte: today } },
        select: { userId: true },
      }),
      this.prisma.review.findMany({
        where: { createdAt: { gte: today } },
        select: { userId: true },
      }),
      this.prisma.meeting.findMany({
        where: { createdAt: { gte: today }, deletedAt: null },
        select: { hostId: true },
      }),
    ]);

    // 고유 사용자 수 계산
    const userIds = new Set<string>();
    participants.forEach((p) => userIds.add(p.userId));
    reviews.forEach((r) => userIds.add(r.userId));
    newMeetings.forEach((m) => userIds.add(m.hostId));

    return userIds.size;
  }

  // ================================
  // Recent Activities
  // ================================

  async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    // 여러 소스에서 최근 활동 가져오기
    const [newMeetings, newParticipants, newActivities, newReviews] = await Promise.all([
      // 새로운 모임
      this.prisma.meeting.findMany({
        where: { deletedAt: null, status: 'RECRUITING' },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          createdAt: true,
          host: {
            select: {
              nickname: true,
              profile: { select: { avatarUrl: true } },
            },
          },
        },
      }),
      // 새로운 참가 승인
      this.prisma.participant.findMany({
        where: { status: 'APPROVED' },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          updatedAt: true,
          meeting: { select: { id: true, title: true } },
          user: {
            select: {
              nickname: true,
              profile: { select: { avatarUrl: true } },
            },
          },
        },
      }),
      // 새로운 활동 기록
      this.prisma.meetingActivity.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          createdAt: true,
          meeting: { select: { id: true, title: true } },
        },
      }),
      // 새로운 리뷰
      this.prisma.review.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          content: true,
          createdAt: true,
          meeting: { select: { id: true, title: true } },
          user: {
            select: {
              nickname: true,
              profile: { select: { avatarUrl: true } },
            },
          },
        },
      }),
    ]);

    // 활동들을 통합하고 정렬
    const activities: RecentActivity[] = [];

    // 새 모임
    newMeetings.forEach((m) => {
      activities.push({
        id: `meeting-${m.id}`,
        type: 'NEW_MEETING',
        message: '님이 새 모임을 개설했습니다',
        meetingId: m.id,
        meetingTitle: m.title,
        userName: m.host.nickname,
        userAvatar: m.host.profile?.avatarUrl ?? undefined,
        createdAt: m.createdAt,
      });
    });

    // 참가 승인
    newParticipants.forEach((p) => {
      activities.push({
        id: `join-${p.id}`,
        type: 'JOIN',
        message: '님이 모임에 참가했습니다',
        meetingId: p.meeting.id,
        meetingTitle: p.meeting.title,
        userName: p.user.nickname,
        userAvatar: p.user.profile?.avatarUrl ?? undefined,
        createdAt: p.updatedAt,
      });
    });

    // 활동 기록
    newActivities.forEach((a) => {
      activities.push({
        id: `activity-${a.id}`,
        type: 'ACTIVITY',
        message: `활동이 기록되었습니다: ${a.title}`,
        meetingId: a.meeting.id,
        meetingTitle: a.meeting.title,
        createdAt: a.createdAt,
      });
    });

    // 리뷰
    newReviews.forEach((r) => {
      activities.push({
        id: `review-${r.id}`,
        type: 'REVIEW',
        message: '님이 리뷰를 남겼습니다',
        meetingId: r.meeting.id,
        meetingTitle: r.meeting.title,
        userName: r.user.nickname,
        userAvatar: r.user.profile?.avatarUrl ?? undefined,
        createdAt: r.createdAt,
      });
    });

    // 최신순 정렬 후 limit 적용
    return activities
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}
