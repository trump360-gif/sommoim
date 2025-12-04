// ================================
// Types & Interfaces
// ================================

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMeetingDto, UpdateMeetingDto, MeetingQueryDto, SortOrder } from './dto';
import { MeetingStatus, Prisma, ParticipantStatus } from '@prisma/client';

// ================================
// Constants
// ================================

// ================================
// Service
// ================================

@Injectable()
export class MeetingService {
  constructor(private prisma: PrismaService) {}

  // ================================
  // Create
  // ================================

  async create(userId: string, dto: CreateMeetingDto) {
    const { schedules, ...data } = dto;
    const schedulesData = this.mapSchedules(schedules);

    return this.prisma.meeting.create({
      data: { ...data, hostId: userId, schedules: schedulesData },
      include: this.createInclude(),
    });
  }

  private mapSchedules(schedules?: any[]) {
    if (!schedules?.length) return undefined;
    return {
      create: schedules.map((s) => ({
        ...s,
        startTime: new Date(s.startTime),
        endTime: new Date(s.endTime),
      })),
    };
  }

  private createInclude() {
    return {
      host: { select: { id: true, nickname: true, profile: { select: { avatarUrl: true } } } },
      schedules: true,
      _count: { select: { participants: { where: { status: ParticipantStatus.APPROVED } } } },
    };
  }

  // ================================
  // Read - List
  // ================================

  async findAll(query: MeetingQueryDto) {
    const { page = 1, limit = 10, sort } = query;
    const where = this.buildWhere(query);
    const orderBy = this.getOrderBy(sort);

    const [meetings, total] = await this.fetchMeetings(where, orderBy, page, limit);
    return { data: meetings, meta: this.buildMeta(total, page, limit) };
  }

  private async fetchMeetings(where: any, orderBy: any, page: number, limit: number) {
    return Promise.all([
      this.prisma.meeting.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: this.listInclude(),
      }),
      this.prisma.meeting.count({ where }),
    ]);
  }

  private buildWhere(q: MeetingQueryDto): Prisma.MeetingWhereInput {
    return {
      deletedAt: null,
      ...this.searchFilter(q.search),
      ...(q.category && { category: q.category }),
      ...(q.location && { location: { contains: q.location, mode: 'insensitive' } }),
      ...(q.status && { status: q.status }),
      ...this.dateFilter(q.startDate, q.endDate),
    };
  }

  private searchFilter(search?: string) {
    if (!search) return {};
    return {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    };
  }

  private dateFilter(start?: string, end?: string) {
    if (!start && !end) return {};
    return {
      schedules: {
        some: {
          ...(start && { startTime: { gte: new Date(start) } }),
          ...(end && { startTime: { lte: new Date(end) } }),
        },
      },
    };
  }

  private listInclude() {
    return {
      host: { select: { id: true, nickname: true, profile: { select: { avatarUrl: true } } } },
      schedules: { orderBy: { startTime: 'asc' as const }, take: 1 },
      _count: {
        select: { participants: { where: { status: ParticipantStatus.APPROVED } }, reviews: true },
      },
    };
  }

  private buildMeta(total: number, page: number, limit: number) {
    return { total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ================================
  // Read - Detail
  // ================================

  async findOne(id: string, userId?: string) {
    const meeting = await this.getMeetingDetail(id);
    if (!meeting) throw new NotFoundException('모임을 찾을 수 없습니다');

    await this.incrementView(id);
    const userInfo = await this.getUserMeetingInfo(id, userId);

    return { ...meeting, ...userInfo };
  }

  private async getMeetingDetail(id: string) {
    return this.prisma.meeting.findFirst({
      where: { id, deletedAt: null },
      include: this.detailInclude(),
    });
  }

  private detailInclude() {
    return {
      host: {
        select: { id: true, nickname: true, profile: { select: { avatarUrl: true, bio: true } } },
      },
      schedules: { orderBy: { startTime: 'asc' as const } },
      participants: this.participantsInclude(),
      reviews: this.reviewsInclude(),
      _count: {
        select: { participants: { where: { status: ParticipantStatus.APPROVED } }, reviews: true },
      },
    };
  }

  private participantsInclude() {
    return {
      where: { status: ParticipantStatus.APPROVED },
      include: {
        user: { select: { id: true, nickname: true, profile: { select: { avatarUrl: true } } } },
      },
    };
  }

  private reviewsInclude() {
    return {
      include: {
        user: { select: { id: true, nickname: true, profile: { select: { avatarUrl: true } } } },
      },
      orderBy: { createdAt: 'desc' as const },
      take: 5,
    };
  }

  private async incrementView(id: string) {
    await this.prisma.meeting.update({ where: { id }, data: { viewCount: { increment: 1 } } });
  }

  private async getUserMeetingInfo(meetingId: string, userId?: string) {
    if (!userId) return { isBookmarked: false, participantStatus: null };

    const [bookmark, participant] = await Promise.all([
      this.prisma.bookmark.findUnique({ where: { userId_meetingId: { userId, meetingId } } }),
      this.prisma.participant.findUnique({ where: { meetingId_userId: { meetingId, userId } } }),
    ]);

    return { isBookmarked: !!bookmark, participantStatus: participant?.status || null };
  }

  // ================================
  // Update
  // ================================

  async update(id: string, userId: string, dto: UpdateMeetingDto) {
    await this.findMeetingAsHost(id, userId);
    const { schedules, ...updateData } = dto;

    return this.prisma.meeting.update({
      where: { id },
      data: updateData,
      include: { host: { select: { id: true, nickname: true } }, schedules: true },
    });
  }

  // ================================
  // Delete
  // ================================

  async remove(id: string, userId: string) {
    await this.findMeetingAsHost(id, userId);
    return this.prisma.meeting.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ================================
  // Cancel Meeting
  // ================================

  async cancel(id: string, userId: string) {
    const meeting = await this.findMeetingAsHost(id, userId);
    this.validateNotCancelled(meeting);

    const participantIds = await this.getApprovedParticipantIds(id);
    await this.cancelMeetingAndNotify(id, meeting.title, participantIds);

    return { message: '모임이 취소되었습니다' };
  }

  private validateNotCancelled(meeting: any) {
    if (meeting.status === MeetingStatus.CANCELLED) {
      throw new BadRequestException('이미 취소된 모임입니다');
    }
  }

  private async getApprovedParticipantIds(meetingId: string) {
    const participants = await this.prisma.participant.findMany({
      where: { meetingId, status: 'APPROVED' },
      select: { userId: true },
    });
    return participants.map((p) => p.userId);
  }

  private async cancelMeetingAndNotify(id: string, title: string, userIds: string[]) {
    await this.prisma.$transaction([
      this.prisma.meeting.update({ where: { id }, data: { status: MeetingStatus.CANCELLED } }),
      // 모든 참가자 상태를 CANCELLED로 변경
      this.prisma.participant.updateMany({
        where: { meetingId: id, status: { in: ['PENDING', 'APPROVED'] } },
        data: { status: 'CANCELLED' },
      }),
      this.prisma.notification.createMany({
        data: userIds.map((userId) => this.cancelNotification(userId, id, title)),
      }),
    ]);
  }

  private cancelNotification(userId: string, meetingId: string, title: string) {
    return {
      userId,
      type: 'MEETING_CANCELLED' as const,
      title: '모임 취소',
      message: `'${title}' 모임이 취소되었습니다.`,
      priority: 'CRITICAL' as const,
      data: { meetingId },
    };
  }

  // ================================
  // Helper Functions
  // ================================

  async findMeetingAsHost(id: string, userId: string) {
    const meeting = await this.prisma.meeting.findFirst({ where: { id, deletedAt: null } });
    if (!meeting) throw new NotFoundException('모임을 찾을 수 없습니다');
    if (meeting.hostId !== userId) throw new ForbiddenException('권한이 없습니다');
    return meeting;
  }

  private getOrderBy(sort?: SortOrder): Prisma.MeetingOrderByWithRelationInput {
    switch (sort) {
      case SortOrder.POPULAR:
        return { viewCount: 'desc' };
      case SortOrder.RATING:
        return { reviews: { _count: 'desc' } };
      case SortOrder.DEADLINE:
        return { schedules: { _count: 'asc' } };
      default:
        return { createdAt: 'desc' };
    }
  }
}
