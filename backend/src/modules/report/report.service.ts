import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportStatus } from '@prisma/client';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  private async checkDuplicate(senderId: string, target: object) {
    const existing = await this.prisma.report.findFirst({
      where: { senderId, ...target, status: { not: 'RESOLVED' } },
    });
    if (existing) throw new BadRequestException('이미 신고했습니다');
  }

  async reportMeeting(meetingId: string, userId: string, dto: CreateReportDto) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundException('모임을 찾을 수 없습니다');

    await this.checkDuplicate(userId, { targetMeetingId: meetingId });

    return this.prisma.report.create({
      data: { type: 'MEETING', ...dto, senderId: userId, targetMeetingId: meetingId },
    });
  }

  async reportUser(targetUserId: string, userId: string, dto: CreateReportDto) {
    if (targetUserId === userId) {
      throw new BadRequestException('자기 자신을 신고할 수 없습니다');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');

    await this.checkDuplicate(userId, { targetUserId });

    return this.prisma.report.create({
      data: { type: 'USER', ...dto, senderId: userId, targetUserId },
    });
  }

  async findAll(page = 1, limit = 20, status?: ReportStatus) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        include: this.getReportInclude(),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.report.count({ where }),
    ]);

    return { data: reports, meta: { total, page, limit } };
  }

  private getReportInclude() {
    return {
      sender: { select: { id: true, nickname: true } },
      targetUser: { select: { id: true, nickname: true } },
      targetMeeting: { select: { id: true, title: true } },
    };
  }

  async findOne(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: this.getDetailInclude(),
    });
    if (!report) throw new NotFoundException('신고를 찾을 수 없습니다');
    return report;
  }

  private getDetailInclude() {
    return {
      sender: { select: { id: true, nickname: true, email: true } },
      targetUser: { select: { id: true, nickname: true, email: true } },
      targetMeeting: { select: { id: true, title: true, hostId: true } },
    };
  }

  async updateStatus(id: string, adminId: string, status: ReportStatus) {
    await this.findOne(id);
    return this.prisma.report.update({
      where: { id },
      data: { status, processedAt: new Date(), processedBy: adminId },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.report.delete({ where: { id } });
    return { message: '신고가 삭제되었습니다' };
  }
}
