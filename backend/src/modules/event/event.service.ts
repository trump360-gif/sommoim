// ================================
// Imports & Dependencies
// ================================

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventDto, CreateRecurringEventDto, UpdateEventDto } from './dto';
import { EventType, RecurringRule, EventParticipantStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

// ================================
// Service
// ================================

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  // ================================
  // Event CRUD
  // ================================

  async create(meetingId: string, userId: string, dto: CreateEventDto) {
    await this.validateHostOrStaff(meetingId, userId);

    return this.prisma.meetingEvent.create({
      data: {
        meetingId,
        type: dto.type || EventType.REGULAR,
        title: dto.title,
        description: dto.description,
        date: new Date(dto.date),
        endTime: dto.endTime ? new Date(dto.endTime) : null,
        location: dto.location,
        maxParticipants: dto.maxParticipants,
        createdById: userId,
      },
      include: { participants: true },
    });
  }

  async createRecurring(meetingId: string, userId: string, dto: CreateRecurringEventDto) {
    await this.validateHostOrStaff(meetingId, userId);

    const recurringId = randomBytes(8).toString('hex');
    const events = [];
    const baseDate = new Date(dto.date);
    const count = Math.min(dto.count, 6);

    for (let i = 0; i < count; i++) {
      const eventDate = this.calculateNextDate(baseDate, dto.recurringRule, i);
      const endTime = dto.endTime ? this.calculateNextDate(new Date(dto.endTime), dto.recurringRule, i) : null;

      events.push({
        meetingId,
        type: dto.type || EventType.REGULAR,
        title: dto.title,
        description: dto.description,
        date: eventDate,
        endTime,
        location: dto.location,
        maxParticipants: dto.maxParticipants,
        recurringId,
        recurringRule: dto.recurringRule,
        createdById: userId,
      });
    }

    await this.prisma.meetingEvent.createMany({ data: events });

    return this.prisma.meetingEvent.findMany({
      where: { recurringId },
      orderBy: { date: 'asc' },
      include: { participants: true },
    });
  }

  private calculateNextDate(baseDate: Date, rule: RecurringRule, index: number): Date {
    const date = new Date(baseDate);
    switch (rule) {
      case RecurringRule.WEEKLY:
        date.setDate(date.getDate() + index * 7);
        break;
      case RecurringRule.BIWEEKLY:
        date.setDate(date.getDate() + index * 14);
        break;
      case RecurringRule.MONTHLY:
        date.setMonth(date.getMonth() + index);
        break;
    }
    return date;
  }

  async findAllByMeeting(meetingId: string, type?: EventType) {
    return this.prisma.meetingEvent.findMany({
      where: { meetingId, ...(type && { type }) },
      orderBy: { date: 'asc' },
      include: {
        participants: { include: { event: false } },
        _count: { select: { participants: true, chatMessages: true } },
      },
    });
  }

  async findOne(eventId: string) {
    const event = await this.prisma.meetingEvent.findUnique({
      where: { id: eventId },
      include: {
        meeting: { select: { id: true, title: true, hostId: true } },
        participants: true,
        _count: { select: { participants: true, chatMessages: true } },
      },
    });
    if (!event) throw new NotFoundException('이벤트를 찾을 수 없습니다');
    return event;
  }

  async update(eventId: string, userId: string, dto: UpdateEventDto) {
    const event = await this.findOne(eventId);
    await this.validateHostOrStaff(event.meetingId, userId);

    return this.prisma.meetingEvent.update({
      where: { id: eventId },
      data: {
        title: dto.title,
        description: dto.description,
        date: dto.date ? new Date(dto.date) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        location: dto.location,
        maxParticipants: dto.maxParticipants,
      },
      include: { participants: true },
    });
  }

  async delete(eventId: string, userId: string) {
    const event = await this.findOne(eventId);
    await this.validateHostOrStaff(event.meetingId, userId);
    await this.prisma.meetingEvent.delete({ where: { id: eventId } });
    return { message: '이벤트가 삭제되었습니다' };
  }

  // ================================
  // Participant Management
  // ================================

  async joinEvent(eventId: string, userId: string) {
    const event = await this.findOne(eventId);
    await this.validateMeetingMember(event.meetingId, userId);

    const existing = await this.prisma.eventParticipant.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (existing) throw new BadRequestException('이미 참가 신청되어 있습니다');

    if (event.maxParticipants) {
      const count = await this.prisma.eventParticipant.count({
        where: { eventId, status: { in: ['CONFIRMED', 'ATTENDED'] } },
      });
      if (count >= event.maxParticipants) {
        throw new BadRequestException('정원이 초과되었습니다');
      }
    }

    return this.prisma.eventParticipant.create({
      data: { eventId, userId, status: EventParticipantStatus.CONFIRMED },
    });
  }

  async leaveEvent(eventId: string, userId: string) {
    const participant = await this.prisma.eventParticipant.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!participant) throw new NotFoundException('참가 정보를 찾을 수 없습니다');

    await this.prisma.eventParticipant.delete({
      where: { eventId_userId: { eventId, userId } },
    });
    return { message: '참가가 취소되었습니다' };
  }

  async updateParticipantStatus(eventId: string, participantUserId: string, hostUserId: string, status: EventParticipantStatus) {
    const event = await this.findOne(eventId);
    await this.validateHostOrStaff(event.meetingId, hostUserId);

    return this.prisma.eventParticipant.update({
      where: { eventId_userId: { eventId, userId: participantUserId } },
      data: { status },
    });
  }

  async getParticipants(eventId: string) {
    return this.prisma.eventParticipant.findMany({
      where: { eventId },
      include: {
        event: false,
      },
    });
  }

  // ================================
  // QR Check-in
  // ================================

  async generateQrCode(eventId: string, userId: string) {
    const event = await this.findOne(eventId);
    await this.validateHostOrStaff(event.meetingId, userId);

    const qrCode = randomBytes(16).toString('hex');
    const qrExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30분 유효

    await this.prisma.meetingEvent.update({
      where: { id: eventId },
      data: { qrCode, qrExpiresAt },
    });

    return { qrCode, expiresAt: qrExpiresAt };
  }

  async checkInWithQr(qrCode: string, userId: string) {
    const event = await this.prisma.meetingEvent.findUnique({
      where: { qrCode },
      include: { meeting: true },
    });

    if (!event) throw new NotFoundException('유효하지 않은 QR 코드입니다');
    if (event.qrExpiresAt && event.qrExpiresAt < new Date()) {
      throw new BadRequestException('QR 코드가 만료되었습니다');
    }

    await this.validateMeetingMember(event.meetingId, userId);

    const participant = await this.prisma.eventParticipant.findUnique({
      where: { eventId_userId: { eventId: event.id, userId } },
    });

    if (!participant) {
      return this.prisma.eventParticipant.create({
        data: {
          eventId: event.id,
          userId,
          status: EventParticipantStatus.ATTENDED,
          attendedAt: new Date(),
        },
      });
    }

    if (participant.status === EventParticipantStatus.ATTENDED) {
      throw new BadRequestException('이미 출석 체크되었습니다');
    }

    return this.prisma.eventParticipant.update({
      where: { eventId_userId: { eventId: event.id, userId } },
      data: { status: EventParticipantStatus.ATTENDED, attendedAt: new Date() },
    });
  }

  async getAttendanceStats(eventId: string) {
    const participants = await this.prisma.eventParticipant.groupBy({
      by: ['status'],
      where: { eventId },
      _count: true,
    });

    return participants.reduce(
      (acc, p) => ({ ...acc, [p.status]: p._count }),
      { PENDING: 0, CONFIRMED: 0, DECLINED: 0, ATTENDED: 0, NO_SHOW: 0 },
    );
  }

  // ================================
  // Helpers
  // ================================

  private async validateHostOrStaff(meetingId: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { hostId: true },
    });
    if (!meeting) throw new NotFoundException('모임을 찾을 수 없습니다');

    // 호스트인 경우 통과
    if (meeting.hostId === userId) return;

    // Staff인 경우 확인
    const staff = await this.prisma.meetingStaff.findUnique({
      where: { meetingId_userId: { meetingId, userId } },
    });
    if (staff) return;

    throw new ForbiddenException('권한이 없습니다');
  }

  private async validateMeetingMember(meetingId: string, userId: string) {
    const participant = await this.prisma.participant.findUnique({
      where: { meetingId_userId: { meetingId, userId } },
    });
    if (!participant || participant.status !== 'APPROVED') {
      throw new ForbiddenException('모임 멤버만 참여할 수 있습니다');
    }
  }
}
