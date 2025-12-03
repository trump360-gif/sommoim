import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  private userInclude = { user: { select: { id: true, nickname: true, profile: { select: { avatarUrl: true } } } } };

  async create(meetingId: string, userId: string, dto: CreateReviewDto) {
    await this.validateCanReview(meetingId, userId);
    return this.prisma.review.create({ data: { ...dto, meetingId, userId }, include: this.userInclude });
  }

  private async validateCanReview(meetingId: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId, deletedAt: null } });
    if (!meeting) throw new NotFoundException('모임을 찾을 수 없습니다');

    const participant = await this.prisma.participant.findUnique({ where: { meetingId_userId: { meetingId, userId } } });
    if (!participant || !['APPROVED', 'ATTENDED'].includes(participant.status)) {
      throw new ForbiddenException('모임에 참여한 사용자만 리뷰를 작성할 수 있습니다');
    }

    const existing = await this.prisma.review.findUnique({ where: { meetingId_userId: { meetingId, userId } } });
    if (existing) throw new BadRequestException('이미 리뷰를 작성했습니다');
  }

  async findByMeeting(meetingId: string, page = 1, limit = 10) {
    const where = { meetingId };
    const [reviews, total, avg] = await Promise.all([
      this.prisma.review.findMany({ where, skip: (page - 1) * limit, take: limit, include: this.userInclude, orderBy: { createdAt: 'desc' } }),
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({ where, _avg: { rating: true } }),
    ]);
    return { data: reviews, meta: { total, page, limit, averageRating: avg._avg.rating || 0 } };
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { ...this.userInclude, meeting: { select: { id: true, title: true } } },
    });
    if (!review) throw new NotFoundException('리뷰를 찾을 수 없습니다');
    return review;
  }

  async update(id: string, userId: string, dto: Partial<CreateReviewDto>) {
    await this.ensureOwnership(id, userId);
    return this.prisma.review.update({ where: { id }, data: dto, include: { user: { select: { id: true, nickname: true } } } });
  }

  async remove(id: string, userId: string) {
    await this.ensureOwnership(id, userId);
    await this.prisma.review.delete({ where: { id } });
    return { message: '리뷰가 삭제되었습니다' };
  }

  private async ensureOwnership(id: string, userId: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('리뷰를 찾을 수 없습니다');
    if (review.userId !== userId) throw new ForbiddenException('권한이 없습니다');
  }
}
