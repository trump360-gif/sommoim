import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMeetingDto, UpdateMeetingDto, MeetingQueryDto, SortOrder, CreateActivityDto, UpdateActivityDto, AddActivityImagesDto, UpdateAttendanceDto, CalendarQueryDto } from './dto';
import { MeetingStatus, Prisma, ParticipantStatus, AttendanceStatus } from '@prisma/client';

@Injectable()
export class MeetingService {
  constructor(private prisma: PrismaService) {}

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
        where, orderBy, skip: (page - 1) * limit, take: limit, include: this.listInclude(),
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
      _count: { select: { participants: { where: { status: ParticipantStatus.APPROVED } }, reviews: true } },
    };
  }

  private buildMeta(total: number, page: number, limit: number) {
    return { total, page, limit, totalPages: Math.ceil(total / limit) };
  }

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
      host: { select: { id: true, nickname: true, profile: { select: { avatarUrl: true, bio: true } } } },
      schedules: { orderBy: { startTime: 'asc' as const } },
      participants: this.participantsInclude(),
      reviews: this.reviewsInclude(),
      _count: { select: { participants: { where: { status: ParticipantStatus.APPROVED } }, reviews: true } },
    };
  }

  private participantsInclude() {
    return {
      where: { status: ParticipantStatus.APPROVED },
      include: { user: { select: { id: true, nickname: true, profile: { select: { avatarUrl: true } } } } },
    };
  }

  private reviewsInclude() {
    return {
      include: { user: { select: { id: true, nickname: true, profile: { select: { avatarUrl: true } } } } },
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

  async update(id: string, userId: string, dto: UpdateMeetingDto) {
    await this.findMeetingAsHost(id, userId);
    const { schedules, ...updateData } = dto;

    return this.prisma.meeting.update({
      where: { id },
      data: updateData,
      include: { host: { select: { id: true, nickname: true } }, schedules: true },
    });
  }

  async remove(id: string, userId: string) {
    await this.findMeetingAsHost(id, userId);
    return this.prisma.meeting.update({ where: { id }, data: { deletedAt: new Date() } });
  }

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
      this.prisma.notification.createMany({
        data: userIds.map((userId) => this.cancelNotification(userId, id, title)),
      }),
    ]);
  }

  private cancelNotification(userId: string, meetingId: string, title: string) {
    return {
      userId, type: 'MEETING_CANCELLED' as const, title: '모임 취소',
      message: `'${title}' 모임이 취소되었습니다.`,
      priority: 'CRITICAL' as const, data: { meetingId },
    };
  }

  async addSchedule(meetingId: string, userId: string, dto: any) {
    await this.findMeetingAsHost(meetingId, userId);
    return this.prisma.meetingSchedule.create({
      data: { meetingId, startTime: new Date(dto.startTime), endTime: new Date(dto.endTime), location: dto.location, note: dto.note },
    });
  }

  async updateSchedule(scheduleId: string, userId: string, dto: any) {
    const schedule = await this.findScheduleWithMeeting(scheduleId);
    this.validateScheduleHost(schedule, userId);

    return this.prisma.meetingSchedule.update({
      where: { id: scheduleId },
      data: this.buildScheduleUpdate(dto),
    });
  }

  private async findScheduleWithMeeting(id: string) {
    const schedule = await this.prisma.meetingSchedule.findUnique({ where: { id }, include: { meeting: true } });
    if (!schedule) throw new NotFoundException('일정을 찾을 수 없습니다');
    return schedule;
  }

  private validateScheduleHost(schedule: any, userId: string) {
    if (schedule.meeting.hostId !== userId) throw new ForbiddenException('권한이 없습니다');
  }

  private buildScheduleUpdate(dto: any) {
    return {
      ...(dto.startTime && { startTime: new Date(dto.startTime) }),
      ...(dto.endTime && { endTime: new Date(dto.endTime) }),
      ...(dto.location !== undefined && { location: dto.location }),
      ...(dto.note !== undefined && { note: dto.note }),
    };
  }

  async removeSchedule(scheduleId: string, userId: string) {
    const schedule = await this.findScheduleWithMeeting(scheduleId);
    this.validateScheduleHost(schedule, userId);
    return this.prisma.meetingSchedule.delete({ where: { id: scheduleId } });
  }

  async addBookmark(meetingId: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId, deletedAt: null } });
    if (!meeting) throw new NotFoundException('모임을 찾을 수 없습니다');

    await this.prisma.bookmark.upsert({
      where: { userId_meetingId: { userId, meetingId } },
      create: { userId, meetingId },
      update: {},
    });
    return { message: '북마크에 추가되었습니다' };
  }

  async removeBookmark(meetingId: string, userId: string) {
    await this.prisma.bookmark.deleteMany({ where: { userId, meetingId } });
    return { message: '북마크에서 제거되었습니다' };
  }

  private async findMeetingAsHost(id: string, userId: string) {
    const meeting = await this.prisma.meeting.findFirst({ where: { id, deletedAt: null } });
    if (!meeting) throw new NotFoundException('모임을 찾을 수 없습니다');
    if (meeting.hostId !== userId) throw new ForbiddenException('권한이 없습니다');
    return meeting;
  }

  private getOrderBy(sort?: SortOrder): Prisma.MeetingOrderByWithRelationInput {
    switch (sort) {
      case SortOrder.POPULAR: return { viewCount: 'desc' };
      case SortOrder.RATING: return { reviews: { _count: 'desc' } };
      case SortOrder.DEADLINE: return { schedules: { _count: 'asc' } };
      default: return { createdAt: 'desc' };
    }
  }

  // ========== 활동 기록 ==========

  async getActivities(meetingId: string) {
    const meeting = await this.prisma.meeting.findFirst({ where: { id: meetingId, deletedAt: null } });
    if (!meeting) throw new NotFoundException('모임을 찾을 수 없습니다');

    return this.prisma.meetingActivity.findMany({
      where: { meetingId },
      include: { images: { orderBy: { order: 'asc' } } },
      orderBy: { date: 'desc' },
    });
  }

  async createActivity(meetingId: string, userId: string, dto: CreateActivityDto) {
    await this.findMeetingAsHostOrParticipant(meetingId, userId);

    const { images, ...activityData } = dto;
    return this.prisma.meetingActivity.create({
      data: {
        ...activityData,
        date: new Date(dto.date),
        meetingId,
        createdById: userId,
        images: images?.length ? {
          create: images.map((img, idx) => ({
            imageUrl: img.imageUrl,
            caption: img.caption,
            order: img.order ?? idx,
            uploadedById: userId,
          })),
        } : undefined,
      },
      include: { images: { orderBy: { order: 'asc' } } },
    });
  }

  async updateActivity(activityId: string, userId: string, dto: UpdateActivityDto) {
    const activity = await this.findActivityWithMeeting(activityId);
    await this.findMeetingAsHostOrParticipant(activity.meetingId, userId);

    return this.prisma.meetingActivity.update({
      where: { id: activityId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.location !== undefined && { location: dto.location }),
      },
      include: { images: { orderBy: { order: 'asc' } } },
    });
  }

  async deleteActivity(activityId: string, userId: string) {
    const activity = await this.findActivityWithMeeting(activityId);
    await this.findMeetingAsHost(activity.meetingId, userId);

    return this.prisma.meetingActivity.delete({ where: { id: activityId } });
  }

  async addActivityImages(activityId: string, userId: string, dto: AddActivityImagesDto) {
    const activity = await this.findActivityWithMeeting(activityId);
    await this.findMeetingAsHostOrParticipant(activity.meetingId, userId);

    const lastImage = await this.prisma.activityImage.findFirst({
      where: { activityId },
      orderBy: { order: 'desc' },
    });
    const startOrder = (lastImage?.order ?? -1) + 1;

    await this.prisma.activityImage.createMany({
      data: dto.images.map((img, idx) => ({
        activityId,
        imageUrl: img.imageUrl,
        caption: img.caption,
        order: img.order ?? startOrder + idx,
        uploadedById: userId,
      })),
    });

    return this.prisma.meetingActivity.findUnique({
      where: { id: activityId },
      include: { images: { orderBy: { order: 'asc' } } },
    });
  }

  async deleteActivityImage(imageId: string, userId: string) {
    const image = await this.prisma.activityImage.findUnique({
      where: { id: imageId },
      include: { activity: { include: { meeting: true } } },
    });
    if (!image) throw new NotFoundException('이미지를 찾을 수 없습니다');

    await this.findMeetingAsHost(image.activity.meetingId, userId);
    return this.prisma.activityImage.delete({ where: { id: imageId } });
  }

  private async findActivityWithMeeting(activityId: string) {
    const activity = await this.prisma.meetingActivity.findUnique({
      where: { id: activityId },
      include: { meeting: true },
    });
    if (!activity) throw new NotFoundException('활동 기록을 찾을 수 없습니다');
    return activity;
  }

  private async findMeetingAsHostOrParticipant(meetingId: string, userId: string) {
    const meeting = await this.prisma.meeting.findFirst({ where: { id: meetingId, deletedAt: null } });
    if (!meeting) throw new NotFoundException('모임을 찾을 수 없습니다');

    if (meeting.hostId === userId) return meeting;

    const participant = await this.prisma.participant.findUnique({
      where: { meetingId_userId: { meetingId, userId }, status: 'APPROVED' },
    });
    if (!participant) throw new ForbiddenException('권한이 없습니다');

    return meeting;
  }

  // ========== 활동 참석 ==========

  async updateAttendance(activityId: string, userId: string, dto: UpdateAttendanceDto) {
    const activity = await this.findActivityWithMeeting(activityId);
    await this.validateParticipantOrHost(activity.meetingId, userId);

    // 일정 충돌 체크 (참석으로 변경하는 경우)
    if (dto.status === AttendanceStatus.ATTENDING) {
      const conflicts = await this.checkScheduleConflicts(userId, activity.date, activity.endTime, activityId);
      if (conflicts.length > 0) {
        return {
          hasConflict: true,
          conflicts,
          message: '같은 시간에 다른 일정이 있습니다. 그래도 참석하시겠습니까?',
        };
      }
    }

    const attendance = await this.prisma.activityAttendance.upsert({
      where: { activityId_userId: { activityId, userId } },
      create: { activityId, userId, status: dto.status, respondedAt: new Date() },
      update: { status: dto.status, respondedAt: new Date() },
      include: {
        activity: { select: { id: true, title: true, date: true, meeting: { select: { id: true, title: true } } } },
      },
    });

    return { hasConflict: false, attendance };
  }

  async getActivityAttendances(activityId: string) {
    const activity = await this.prisma.meetingActivity.findUnique({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('활동을 찾을 수 없습니다');

    return this.prisma.activityAttendance.findMany({
      where: { activityId },
      include: {
        activity: { select: { id: true, title: true, date: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getMyAttendance(activityId: string, userId: string) {
    return this.prisma.activityAttendance.findUnique({
      where: { activityId_userId: { activityId, userId } },
    });
  }

  // ========== 내 캘린더 일정 ==========

  async getMyCalendarEvents(userId: string, query: CalendarQueryDto) {
    const { startDate, endDate } = query;

    // 기본값: 이번 달
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

    // 참석으로 응답한 활동들만 조회
    const attendances = await this.prisma.activityAttendance.findMany({
      where: {
        userId,
        status: AttendanceStatus.ATTENDING,
        activity: {
          date: { gte: start, lte: end },
        },
      },
      include: {
        activity: {
          include: {
            meeting: { select: { id: true, title: true, category: true, imageUrl: true } },
          },
        },
      },
      orderBy: { activity: { date: 'asc' } },
    });

    return attendances.map((att) => ({
      id: att.activity.id,
      title: att.activity.title,
      description: att.activity.description,
      date: att.activity.date,
      endTime: att.activity.endTime,
      location: att.activity.location,
      meeting: att.activity.meeting,
      attendanceStatus: att.status,
    }));
  }

  async checkScheduleConflicts(
    userId: string,
    date: Date,
    endTime: Date | null,
    excludeActivityId?: string,
  ) {
    const activityStart = new Date(date);
    const activityEnd = endTime ? new Date(endTime) : new Date(activityStart.getTime() + 2 * 60 * 60 * 1000); // 기본 2시간

    const conflictingAttendances = await this.prisma.activityAttendance.findMany({
      where: {
        userId,
        status: AttendanceStatus.ATTENDING,
        activityId: excludeActivityId ? { not: excludeActivityId } : undefined,
        activity: {
          OR: [
            // 기존 일정이 새 일정 시작 전에 시작하고 새 일정 시작 후에 끝남
            {
              date: { lte: activityStart },
              endTime: { gt: activityStart },
            },
            // 기존 일정이 새 일정 종료 전에 시작하고 새 일정 종료 후에 끝남
            {
              date: { lt: activityEnd },
              endTime: { gte: activityEnd },
            },
            // 기존 일정이 새 일정 범위 안에 있음
            {
              date: { gte: activityStart, lt: activityEnd },
            },
            // endTime이 null인 경우 date 기준으로 같은 날 체크
            {
              endTime: null,
              date: {
                gte: new Date(activityStart.toDateString()),
                lt: new Date(new Date(activityStart.toDateString()).getTime() + 24 * 60 * 60 * 1000),
              },
            },
          ],
        },
      },
      include: {
        activity: {
          include: {
            meeting: { select: { id: true, title: true } },
          },
        },
      },
    });

    return conflictingAttendances.map((att) => ({
      activityId: att.activity.id,
      activityTitle: att.activity.title,
      meetingTitle: att.activity.meeting.title,
      date: att.activity.date,
      endTime: att.activity.endTime,
    }));
  }

  private async validateParticipantOrHost(meetingId: string, userId: string) {
    const meeting = await this.prisma.meeting.findFirst({ where: { id: meetingId, deletedAt: null } });
    if (!meeting) throw new NotFoundException('모임을 찾을 수 없습니다');

    if (meeting.hostId === userId) return;

    const participant = await this.prisma.participant.findUnique({
      where: { meetingId_userId: { meetingId, userId }, status: 'APPROVED' },
    });
    if (!participant) throw new ForbiddenException('모임 멤버만 참석 여부를 변경할 수 있습니다');
  }
}
