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
import { StaffRole, StaffPermission } from '@prisma/client';
import { AddStaffDto, UpdateStaffDto } from './dto';

// ================================
// Service
// ================================

@Injectable()
export class MeetingStaffService {
  constructor(private prisma: PrismaService) {}

  // ================================
  // Staff CRUD
  // ================================

  async addStaff(meetingId: string, hostId: string, dto: AddStaffDto) {
    await this.validateHost(meetingId, hostId);

    // 이미 운영진인지 확인
    const existing = await this.prisma.meetingStaff.findUnique({
      where: { meetingId_userId: { meetingId, userId: dto.userId } },
    });
    if (existing) {
      throw new BadRequestException('이미 운영진으로 등록되어 있습니다');
    }

    // 모임 멤버인지 확인
    const participant = await this.prisma.participant.findUnique({
      where: { meetingId_userId: { meetingId, userId: dto.userId } },
    });
    if (!participant || participant.status !== 'APPROVED') {
      throw new BadRequestException('모임 멤버만 운영진으로 임명할 수 있습니다');
    }

    const permissions = dto.permissions || this.getDefaultPermissions(dto.role);

    return this.prisma.meetingStaff.create({
      data: {
        meetingId,
        userId: dto.userId,
        role: dto.role,
        permissions,
      },
      include: { meeting: { select: { title: true } } },
    });
  }

  async updateStaff(meetingId: string, staffUserId: string, hostId: string, dto: UpdateStaffDto) {
    await this.validateHost(meetingId, hostId);

    const staff = await this.prisma.meetingStaff.findUnique({
      where: { meetingId_userId: { meetingId, userId: staffUserId } },
    });
    if (!staff) {
      throw new NotFoundException('운영진 정보를 찾을 수 없습니다');
    }

    return this.prisma.meetingStaff.update({
      where: { meetingId_userId: { meetingId, userId: staffUserId } },
      data: {
        role: dto.role,
        permissions: dto.permissions,
      },
    });
  }

  async removeStaff(meetingId: string, staffUserId: string, hostId: string) {
    await this.validateHost(meetingId, hostId);

    const staff = await this.prisma.meetingStaff.findUnique({
      where: { meetingId_userId: { meetingId, userId: staffUserId } },
    });
    if (!staff) {
      throw new NotFoundException('운영진 정보를 찾을 수 없습니다');
    }

    await this.prisma.meetingStaff.delete({
      where: { meetingId_userId: { meetingId, userId: staffUserId } },
    });

    return { message: '운영진에서 제외되었습니다' };
  }

  async getStaffList(meetingId: string) {
    return this.prisma.meetingStaff.findMany({
      where: { meetingId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ================================
  // Permission Checks
  // ================================

  async hasPermission(meetingId: string, userId: string, permission: StaffPermission): Promise<boolean> {
    // 호스트는 모든 권한 보유
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { hostId: true },
    });
    if (meeting?.hostId === userId) return true;

    // 운영진 권한 확인
    const staff = await this.prisma.meetingStaff.findUnique({
      where: { meetingId_userId: { meetingId, userId } },
    });
    if (!staff) return false;

    return staff.permissions.includes(permission);
  }

  async isHostOrStaff(meetingId: string, userId: string): Promise<boolean> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { hostId: true },
    });
    if (meeting?.hostId === userId) return true;

    const staff = await this.prisma.meetingStaff.findUnique({
      where: { meetingId_userId: { meetingId, userId } },
    });
    return !!staff;
  }

  async getStaffRole(meetingId: string, userId: string): Promise<StaffRole | 'HOST' | null> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { hostId: true },
    });
    if (meeting?.hostId === userId) return 'HOST';

    const staff = await this.prisma.meetingStaff.findUnique({
      where: { meetingId_userId: { meetingId, userId } },
    });
    return staff?.role || null;
  }

  // ================================
  // Helpers
  // ================================

  private async validateHost(meetingId: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { hostId: true },
    });
    if (!meeting) throw new NotFoundException('모임을 찾을 수 없습니다');
    if (meeting.hostId !== userId) {
      throw new ForbiddenException('모임장만 운영진을 관리할 수 있습니다');
    }
  }

  private getDefaultPermissions(role: StaffRole): StaffPermission[] {
    switch (role) {
      case StaffRole.CO_HOST:
        return [
          StaffPermission.MANAGE_EVENTS,
          StaffPermission.MANAGE_SCHEDULES,
          StaffPermission.MANAGE_ACTIVITIES,
          StaffPermission.MANAGE_MEMBERS,
          StaffPermission.MANAGE_CHAT,
          StaffPermission.VIEW_STATS,
        ];
      case StaffRole.MANAGER:
        return [
          StaffPermission.MANAGE_EVENTS,
          StaffPermission.MANAGE_SCHEDULES,
          StaffPermission.MANAGE_ACTIVITIES,
          StaffPermission.VIEW_STATS,
        ];
      case StaffRole.STAFF:
        return [
          StaffPermission.MANAGE_ACTIVITIES,
          StaffPermission.VIEW_STATS,
        ];
      default:
        return [];
    }
  }
}
