import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ParticipantStatus, MeetingStatus } from '@prisma/client';

@Injectable()
export class ParticipantService {
  constructor(private prisma: PrismaService) { }

  async apply(meetingId: string, userId: string) {
    const meeting = await this.getMeetingWithCount(meetingId);
    await this.validateApplication(meeting, userId);
    await this.checkBlocked(meeting.hostId, userId);

    const existing = await this.getExistingParticipant(meetingId, userId);
    if (existing) return this.handleExisting(existing);

    return this.createParticipant(meeting, userId);
  }

  private async getMeetingWithCount(meetingId: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, deletedAt: null },
      include: { _count: { select: { participants: { where: { status: 'APPROVED' } } } } },
    });
    if (!meeting) throw new NotFoundException('모임을 찾을 수 없습니다');
    return meeting;
  }

  private async validateApplication(meeting: any, userId: string) {
    if (meeting.hostId === userId) throw new BadRequestException('본인이 만든 모임에는 참가 신청할 수 없습니다');
    if (meeting.status !== MeetingStatus.RECRUITING) throw new BadRequestException('모집 중인 모임이 아닙니다');
    if (meeting._count.participants >= meeting.maxParticipants) throw new BadRequestException('참가 인원이 마감되었습니다');
  }

  private async checkBlocked(hostId: string, userId: string) {
    const blocked = await this.prisma.userBlock.findFirst({
      where: { OR: [{ blockerId: hostId, blockedId: userId }, { blockerId: userId, blockedId: hostId }] },
    });
    if (blocked) throw new ForbiddenException('차단된 사용자입니다');
  }

  private async getExistingParticipant(meetingId: string, userId: string) {
    return this.prisma.participant.findUnique({ where: { meetingId_userId: { meetingId, userId } } });
  }

  private handleExisting(existing: any) {
    if (existing.status === ParticipantStatus.PENDING) throw new ConflictException('이미 참가 신청 중입니다');
    if (existing.status === ParticipantStatus.APPROVED) throw new ConflictException('이미 참가 중입니다');
    if (existing.status === ParticipantStatus.KICKED) throw new ForbiddenException('강퇴된 모임에는 다시 참가할 수 없습니다');

    return this.prisma.participant.update({ where: { id: existing.id }, data: { status: ParticipantStatus.PENDING } });
  }

  private async createParticipant(meeting: any, userId: string) {
    const status = meeting.autoApprove ? ParticipantStatus.APPROVED : ParticipantStatus.PENDING;

    return this.prisma.$transaction(async (tx) => {
      const participant = await tx.participant.create({
        data: { meetingId: meeting.id, userId, status },
        include: { user: { select: { id: true, nickname: true } } },
      });

      if (meeting.autoApprove) {
        // 자동 승인 시 참가자에게 알림
        await tx.notification.create({
          data: {
            userId,
            type: 'PARTICIPANT_APPROVED',
            title: '가입 승인',
            message: `'${meeting.title}' 모임 가입이 자동 승인되었습니다.`,
            data: { meetingId: meeting.id },
          },
        });
      } else {
        // 수동 승인 시 호스트에게 알림
        await tx.notification.create({
          data: {
            userId: meeting.hostId,
            type: 'NEW_APPLICATION',
            title: '새 참가 신청',
            message: `'${meeting.title}' 모임에 새 참가 신청이 있습니다.`,
            data: { meetingId: meeting.id, participantId: participant.id },
          },
        });
      }

      return participant;
    });
  }

  async withdraw(meetingId: string, userId: string, reason?: string) {
    const participant = await this.prisma.participant.findUnique({
      where: { meetingId_userId: { meetingId, userId } },
      include: { user: { select: { nickname: true } } },
    });
    if (!participant) throw new NotFoundException('참가 정보를 찾을 수 없습니다');
    if (participant.status === ParticipantStatus.CANCELLED) throw new BadRequestException('이미 탈퇴하였습니다');

    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { title: true, hostId: true },
    });
    if (!meeting) throw new NotFoundException('모임을 찾을 수 없습니다');

    return this.prisma.$transaction(async (tx) => {
      // 참가자 상태 업데이트
      const updated = await tx.participant.update({
        where: { id: participant.id },
        data: {
          status: ParticipantStatus.CANCELLED,
          withdrawReason: reason,
          withdrawnAt: new Date(),
        },
      });

      // 호스트에게 알림 발송
      await tx.notification.create({
        data: {
          userId: meeting.hostId,
          type: 'MEMBER_WITHDRAWN',
          title: '멤버 탈퇴',
          message: `'${participant.user.nickname}'님이 '${meeting.title}' 모임에서 탈퇴했습니다.`,
          data: { meetingId, reason },
        },
      });

      return updated;
    });
  }

  // 참가 신청 취소 (PENDING 상태에서만 가능)
  async cancelApplication(meetingId: string, userId: string) {
    const participant = await this.prisma.participant.findUnique({ where: { meetingId_userId: { meetingId, userId } } });
    if (!participant) throw new NotFoundException('참가 신청을 찾을 수 없습니다');
    if (participant.status !== ParticipantStatus.PENDING) throw new BadRequestException('대기 중인 신청만 취소할 수 있습니다');

    return this.prisma.participant.update({ where: { id: participant.id }, data: { status: ParticipantStatus.CANCELLED } });
  }

  async updateStatus(meetingId: string, participantId: string, hostId: string, status: 'APPROVED' | 'REJECTED' | 'KICKED') {
    const meeting = await this.validateHost(meetingId, hostId);
    const participant = await this.validateParticipant(participantId, meetingId);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.participant.update({ where: { id: participantId }, data: { status } });

      // 알림 생성
      const notificationType = status === 'APPROVED' ? 'PARTICIPANT_APPROVED' : 'PARTICIPANT_REJECTED';
      const message = this.getStatusMessage(status, meeting.title);

      await tx.notification.create({
        data: {
          userId: participant.userId,
          type: notificationType,
          title: '참가 상태 변경',
          message,
          priority: 'HIGH',
          data: { meetingId },
        },
      });

      // 강퇴 시 활동 참석 기록 삭제
      if (status === 'KICKED') {
        await tx.activityAttendance.deleteMany({
          where: {
            userId: participant.userId,
            activity: { meetingId },
          },
        });
      }

      return updated;
    });
  }

  private async validateHost(meetingId: string, hostId: string) {
    const meeting = await this.prisma.meeting.findFirst({ where: { id: meetingId, deletedAt: null } });
    if (!meeting) throw new NotFoundException('모임을 찾을 수 없습니다');
    if (meeting.hostId !== hostId) throw new ForbiddenException('권한이 없습니다');
    return meeting;
  }

  private async validateParticipant(participantId: string, meetingId: string) {
    const participant = await this.prisma.participant.findUnique({ where: { id: participantId }, include: { user: true } });
    if (!participant || participant.meetingId !== meetingId) throw new NotFoundException('참가자를 찾을 수 없습니다');
    return participant;
  }

  private getStatusMessage(status: string, title: string) {
    if (status === 'APPROVED') return `'${title}' 모임 참가가 승인되었습니다.`;
    if (status === 'REJECTED') return `'${title}' 모임 참가가 거절되었습니다.`;
    return `'${title}' 모임에서 강퇴되었습니다.`;
  }

  async findByMeeting(meetingId: string, userId: string, status?: ParticipantStatus) {
    // 모임주만 참가자 목록 조회 가능
    const meeting = await this.prisma.meeting.findFirst({ where: { id: meetingId, deletedAt: null } });
    if (!meeting) throw new NotFoundException('모임을 찾을 수 없습니다');
    if (meeting.hostId !== userId) throw new ForbiddenException('권한이 없습니다');

    return this.prisma.participant.findMany({
      where: { meetingId, ...(status && { status }) },
      include: { user: { select: { id: true, nickname: true, profile: { select: { avatarUrl: true } } } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findMyParticipations(userId: string, status?: ParticipantStatus) {
    return this.prisma.participant.findMany({
      where: { userId, ...(status && { status }) },
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            description: true,
            hostId: true,
            status: true,
            category: true,
            imageUrl: true,
            maxParticipants: true,
            host: { select: { id: true, nickname: true } },
            schedules: { orderBy: { startTime: 'asc' as const }, take: 1 },
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private meetingInclude() {
    return {
      include: { host: { select: { id: true, nickname: true } }, schedules: { orderBy: { startTime: 'asc' as const }, take: 1 } },
    };
  }
}
