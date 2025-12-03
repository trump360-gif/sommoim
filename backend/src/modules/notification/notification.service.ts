import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, page = 1, limit = 20) {
    const where = { userId };
    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { data: notifications, meta: { total, page, limit, unreadCount } };
  }

  async findUnread(userId: string) {
    return this.prisma.notification.findMany({ where: { userId, isRead: false }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  async markAsRead(id: string, userId: string) {
    await this.ensureOwnership(id, userId);
    return this.prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true, readAt: new Date() } });
    return { message: '모든 알림을 읽음 처리했습니다' };
  }

  async remove(id: string, userId: string) {
    await this.ensureOwnership(id, userId);
    await this.prisma.notification.delete({ where: { id } });
    return { message: '알림이 삭제되었습니다' };
  }

  private async ensureOwnership(id: string, userId: string) {
    const n = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!n) throw new NotFoundException('알림을 찾을 수 없습니다');
  }

  async createNotification(data: { userId: string; type: any; title: string; message: string; priority?: any; data?: any }) {
    return this.prisma.notification.create({
      data: { userId: data.userId, type: data.type, title: data.title, message: data.message, priority: data.priority || 'NORMAL', data: data.data },
    });
  }
}
