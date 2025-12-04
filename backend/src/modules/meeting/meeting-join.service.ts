// ================================
// Imports & Dependencies
// ================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ParticipantStatus } from '@prisma/client';

// ================================
// DTOs
// ================================

export interface CreateJoinQuestionDto {
  question: string;
  isRequired?: boolean;
  order?: number;
}

export interface UpdateJoinQuestionDto {
  question?: string;
  isRequired?: boolean;
  order?: number;
}

export interface ApplyMeetingDto {
  introduction?: string;
  answers?: { questionId: string; answer: string }[];
}

export interface ReviewApplicationDto {
  status: 'APPROVED' | 'REJECTED';
  reason?: string;
}

// ================================
// Service
// ================================

@Injectable()
export class MeetingJoinService {
  constructor(private prisma: PrismaService) {}

  // ================================
  // Join Questions CRUD
  // ================================

  async getQuestions(meetingId: string) {
    return this.prisma.joinQuestion.findMany({
      where: { meetingId },
      orderBy: { order: 'asc' },
    });
  }

  async createQuestion(meetingId: string, userId: string, dto: CreateJoinQuestionDto) {
    await this.validateHostOrStaff(meetingId, userId);

    // 현재 최대 order 값 조회
    const maxOrder = await this.prisma.joinQuestion.aggregate({
      where: { meetingId },
      _max: { order: true },
    });

    return this.prisma.joinQuestion.create({
      data: {
        meetingId,
        question: dto.question,
        isRequired: dto.isRequired ?? true,
        order: dto.order ?? (maxOrder._max.order ?? 0) + 1,
      },
    });
  }

  async updateQuestion(questionId: string, userId: string, dto: UpdateJoinQuestionDto) {
    const question = await this.prisma.joinQuestion.findUnique({
      where: { id: questionId },
      include: { meeting: { select: { hostId: true } } },
    });

    if (!question) {
      throw new NotFoundException('질문을 찾을 수 없습니다');
    }

    await this.validateHostOrStaff(question.meetingId, userId);

    return this.prisma.joinQuestion.update({
      where: { id: questionId },
      data: dto,
    });
  }

  async deleteQuestion(questionId: string, userId: string) {
    const question = await this.prisma.joinQuestion.findUnique({
      where: { id: questionId },
      include: { meeting: { select: { hostId: true } } },
    });

    if (!question) {
      throw new NotFoundException('질문을 찾을 수 없습니다');
    }

    await this.validateHostOrStaff(question.meetingId, userId);

    await this.prisma.joinQuestion.delete({
      where: { id: questionId },
    });

    return { message: '질문이 삭제되었습니다' };
  }

  // ================================
  // Application Management
  // ================================

  async applyMeeting(meetingId: string, userId: string, dto: ApplyMeetingDto) {
    // 모임 존재 및 상태 확인
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        joinQuestions: { where: { isRequired: true } },
        _count: { select: { participants: { where: { status: 'APPROVED' } } } },
      },
    });

    if (!meeting || meeting.deletedAt) {
      throw new NotFoundException('모임을 찾을 수 없습니다');
    }

    if (meeting.status !== 'RECRUITING') {
      throw new BadRequestException('모집 중인 모임이 아닙니다');
    }

    if (meeting.hostId === userId) {
      throw new BadRequestException('본인이 만든 모임에는 가입할 수 없습니다');
    }

    // 이미 참가 신청 여부 확인
    const existing = await this.prisma.participant.findUnique({
      where: { meetingId_userId: { meetingId, userId } },
    });

    if (existing) {
      throw new BadRequestException('이미 가입 신청한 모임입니다');
    }

    // 정원 확인
    if (meeting._count.participants >= meeting.maxParticipants) {
      throw new BadRequestException('모임 정원이 가득 찼습니다');
    }

    // 필수 질문 답변 확인
    const requiredQuestionIds = meeting.joinQuestions.map((q) => q.id);
    const answeredIds = dto.answers?.map((a) => a.questionId) || [];
    const missingRequired = requiredQuestionIds.filter((id) => !answeredIds.includes(id));

    if (missingRequired.length > 0) {
      throw new BadRequestException('필수 질문에 모두 답변해주세요');
    }

    // 참가 신청 생성
    const participant = await this.prisma.participant.create({
      data: {
        meetingId,
        userId,
        introduction: dto.introduction,
        status: meeting.autoApprove ? ParticipantStatus.APPROVED : ParticipantStatus.PENDING,
      },
    });

    // 답변 저장
    if (dto.answers && dto.answers.length > 0) {
      await this.prisma.joinAnswer.createMany({
        data: dto.answers.map((a) => ({
          questionId: a.questionId,
          participantId: participant.id,
          answer: a.answer,
        })),
      });
    }

    return {
      participant,
      autoApproved: meeting.autoApprove,
      message: meeting.autoApprove ? '가입이 승인되었습니다' : '가입 신청이 완료되었습니다',
    };
  }

  async getApplications(meetingId: string, userId: string, status?: ParticipantStatus) {
    await this.validateHostOrStaff(meetingId, userId);

    return this.prisma.participant.findMany({
      where: {
        meetingId,
        ...(status ? { status } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profile: { select: { avatarUrl: true, bio: true } },
          },
        },
        answers: {
          include: { question: { select: { question: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getApplicationDetail(participantId: string, userId: string) {
    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        meeting: { select: { hostId: true } },
        user: {
          select: {
            id: true,
            nickname: true,
            profile: { select: { avatarUrl: true, bio: true, location: true, interests: true } },
          },
        },
        answers: {
          include: { question: { select: { question: true, isRequired: true } } },
        },
      },
    });

    if (!participant) {
      throw new NotFoundException('가입 신청을 찾을 수 없습니다');
    }

    await this.validateHostOrStaff(participant.meetingId, userId);

    return participant;
  }

  async reviewApplication(participantId: string, userId: string, dto: ReviewApplicationDto) {
    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
      include: { meeting: { select: { hostId: true, title: true } } },
    });

    if (!participant) {
      throw new NotFoundException('가입 신청을 찾을 수 없습니다');
    }

    if (participant.status !== ParticipantStatus.PENDING) {
      throw new BadRequestException('대기 중인 신청만 심사할 수 있습니다');
    }

    await this.validateHostOrStaff(participant.meetingId, userId);

    const updated = await this.prisma.participant.update({
      where: { id: participantId },
      data: {
        status: dto.status,
        rejectedReason: dto.status === 'REJECTED' ? dto.reason : null,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
      include: {
        user: { select: { id: true, nickname: true } },
      },
    });

    // 알림 발송 (별도 서비스로 분리 가능)
    await this.prisma.notification.create({
      data: {
        userId: participant.userId,
        type: dto.status === 'APPROVED' ? 'PARTICIPANT_APPROVED' : 'PARTICIPANT_REJECTED',
        title: dto.status === 'APPROVED' ? '가입 승인' : '가입 거절',
        message:
          dto.status === 'APPROVED'
            ? `${participant.meeting.title} 모임 가입이 승인되었습니다.`
            : `${participant.meeting.title} 모임 가입이 거절되었습니다.${dto.reason ? ` 사유: ${dto.reason}` : ''}`,
        data: { meetingId: participant.meetingId },
      },
    });

    return {
      participant: updated,
      message: dto.status === 'APPROVED' ? '가입이 승인되었습니다' : '가입이 거절되었습니다',
    };
  }

  async bulkReviewApplications(
    meetingId: string,
    userId: string,
    participantIds: string[],
    dto: ReviewApplicationDto,
  ) {
    await this.validateHostOrStaff(meetingId, userId);

    const results = await Promise.all(
      participantIds.map((id) => this.reviewApplication(id, userId, dto).catch((e) => ({ error: e.message, id }))),
    );

    return {
      success: results.filter((r) => !('error' in r)).length,
      failed: results.filter((r) => 'error' in r),
    };
  }

  // ================================
  // Helpers
  // ================================

  private async validateHostOrStaff(meetingId: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { hostId: true },
    });

    if (!meeting) {
      throw new NotFoundException('모임을 찾을 수 없습니다');
    }

    if (meeting.hostId === userId) return true;

    const staff = await this.prisma.meetingStaff.findUnique({
      where: { meetingId_userId: { meetingId, userId } },
    });

    if (!staff) {
      throw new ForbiddenException('권한이 없습니다');
    }

    return true;
  }
}
