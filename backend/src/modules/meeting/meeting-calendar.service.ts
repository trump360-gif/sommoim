// ================================
// Types & Interfaces
// ================================

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAttendanceDto, CalendarQueryDto } from './dto';
import { AttendanceStatus } from '@prisma/client';

// ================================
// Service
// ================================

@Injectable()
export class MeetingCalendarService {
  constructor(private prisma: PrismaService) {}

  // ================================
  // Attendance Management
  // ================================

  async updateAttendance(activityId: string, userId: string, dto: UpdateAttendanceDto) {
    const activity = await this.findActivityWithMeeting(activityId);
    await this.validateParticipantOrHost(activity.meetingId, userId);

    if (dto.status === AttendanceStatus.ATTENDING) {
      const conflicts = await this.checkScheduleConflicts(
        userId,
        activity.date,
        activity.endTime,
        activityId,
      );
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
        activity: {
          select: {
            id: true,
            title: true,
            date: true,
            meeting: { select: { id: true, title: true } },
          },
        },
      },
    });

    return { hasConflict: false, attendance };
  }

  async getActivityAttendances(activityId: string) {
    const activity = await this.prisma.meetingActivity.findUnique({
      where: { id: activityId },
    });
    if (!activity) throw new NotFoundException('활동을 찾을 수 없습니다');

    return this.prisma.activityAttendance.findMany({
      where: { activityId },
      include: { activity: { select: { id: true, title: true, date: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getMyAttendance(activityId: string, userId: string) {
    return this.prisma.activityAttendance.findUnique({
      where: { activityId_userId: { activityId, userId } },
    });
  }

  // ================================
  // Calendar Events
  // ================================

  async getMyCalendarEvents(userId: string, query: CalendarQueryDto) {
    const { startDate, endDate } = query;
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate
      ? new Date(endDate)
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

    const attendances = await this.prisma.activityAttendance.findMany({
      where: {
        userId,
        status: AttendanceStatus.ATTENDING,
        activity: { date: { gte: start, lte: end } },
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

  // ================================
  // Schedule Conflict Check
  // ================================

  async checkScheduleConflicts(
    userId: string,
    date: Date,
    endTime: Date | null,
    excludeActivityId?: string,
  ) {
    const activityStart = new Date(date);
    const activityEnd = endTime
      ? new Date(endTime)
      : new Date(activityStart.getTime() + 2 * 60 * 60 * 1000);

    const conflictingAttendances = await this.prisma.activityAttendance.findMany({
      where: {
        userId,
        status: AttendanceStatus.ATTENDING,
        activityId: excludeActivityId ? { not: excludeActivityId } : undefined,
        activity: {
          OR: [
            { date: { lte: activityStart }, endTime: { gt: activityStart } },
            { date: { lt: activityEnd }, endTime: { gte: activityEnd } },
            { date: { gte: activityStart, lt: activityEnd } },
            {
              endTime: null,
              date: {
                gte: new Date(activityStart.toDateString()),
                lt: new Date(
                  new Date(activityStart.toDateString()).getTime() + 24 * 60 * 60 * 1000,
                ),
              },
            },
          ],
        },
      },
      include: {
        activity: { include: { meeting: { select: { id: true, title: true } } } },
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

  // ================================
  // Helper Functions
  // ================================

  private async findActivityWithMeeting(activityId: string) {
    const activity = await this.prisma.meetingActivity.findUnique({
      where: { id: activityId },
      include: { meeting: true },
    });
    if (!activity) throw new NotFoundException('활동 기록을 찾을 수 없습니다');
    return activity;
  }

  private async validateParticipantOrHost(meetingId: string, userId: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundException('모임을 찾을 수 없습니다');

    if (meeting.hostId === userId) return;

    const participant = await this.prisma.participant.findUnique({
      where: { meetingId_userId: { meetingId, userId }, status: 'APPROVED' },
    });
    if (!participant) {
      throw new ForbiddenException('모임 멤버만 참석 여부를 변경할 수 있습니다');
    }
  }
}
