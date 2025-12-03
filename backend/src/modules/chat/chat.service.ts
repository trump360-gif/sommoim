import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  private userSelect = {
    user: { select: { id: true, nickname: true, profile: { select: { avatarUrl: true } } } },
  };

  async canAccessChat(meetingId: string, userId: string): Promise<boolean> {
    const participant = await this.prisma.participant.findUnique({
      where: { meetingId_userId: { meetingId, userId } },
    });
    if (participant?.status === 'APPROVED') return true;

    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId } });
    return meeting?.hostId === userId;
  }

  async createMessage(meetingId: string, userId: string, content: string) {
    return this.prisma.chatMessage.create({
      data: { meetingId, userId, content: this.sanitize(content) },
      include: this.userSelect,
    });
  }

  async getMessages(meetingId: string, userId: string, page = 1, limit = 50) {
    if (!(await this.canAccessChat(meetingId, userId))) {
      throw new ForbiddenException('채팅방에 접근할 수 없습니다');
    }

    const where = { meetingId, deletedAt: null };
    const [messages, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: this.userSelect,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.chatMessage.count({ where }),
    ]);

    return { data: messages.reverse(), meta: { total, page, limit } };
  }

  async deleteMessage(messageId: string, userId: string) {
    const msg = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { meeting: true },
    });
    if (!msg) throw new NotFoundException('메시지를 찾을 수 없습니다');

    const canDelete = msg.userId === userId || msg.meeting.hostId === userId;
    if (!canDelete) throw new ForbiddenException('권한이 없습니다');

    await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });
    return { message: '메시지가 삭제되었습니다' };
  }

  private sanitize(content: string): string {
    return content.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').trim().slice(0, 1000);
  }
}
