// ================================
// Types & Interfaces
// ================================

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ================================
// Constants
// ================================

// ================================
// Service
// ================================

@Injectable()
export class MeetingScheduleService {
  constructor(private prisma: PrismaService) {}

  // ================================
  // Schedule Management
  // ================================

  async addSchedule(meetingId: string, userId: string, dto: any) {
    await this.findMeetingAsHost(meetingId, userId);
    return this.prisma.meetingSchedule.create({
      data: {
        meetingId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        location: dto.location,
        note: dto.note,
      },
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

  async removeSchedule(scheduleId: string, userId: string) {
    const schedule = await this.findScheduleWithMeeting(scheduleId);
    this.validateScheduleHost(schedule, userId);
    return this.prisma.meetingSchedule.delete({ where: { id: scheduleId } });
  }

  // ================================
  // Bookmark Management
  // ================================

  async addBookmark(meetingId: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId, deletedAt: null },
    });
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

  // ================================
  // Helper Functions
  // ================================

  private async findMeetingAsHost(id: string, userId: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id, deletedAt: null },
    });
    if (!meeting) throw new NotFoundException('모임을 찾을 수 없습니다');
    if (meeting.hostId !== userId) throw new ForbiddenException('권한이 없습니다');
    return meeting;
  }

  private async findScheduleWithMeeting(id: string) {
    const schedule = await this.prisma.meetingSchedule.findUnique({
      where: { id },
      include: { meeting: true },
    });
    if (!schedule) throw new NotFoundException('일정을 찾을 수 없습니다');
    return schedule;
  }

  private validateScheduleHost(schedule: any, userId: string) {
    if (schedule.meeting.hostId !== userId) {
      throw new ForbiddenException('권한이 없습니다');
    }
  }

  private buildScheduleUpdate(dto: any) {
    return {
      ...(dto.startTime && { startTime: new Date(dto.startTime) }),
      ...(dto.endTime && { endTime: new Date(dto.endTime) }),
      ...(dto.location !== undefined && { location: dto.location }),
      ...(dto.note !== undefined && { note: dto.note }),
    };
  }
}
