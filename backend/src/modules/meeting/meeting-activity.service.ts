// ================================
// Types & Interfaces
// ================================

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActivityDto, UpdateActivityDto, AddActivityImagesDto } from './dto';

// ================================
// Service
// ================================

@Injectable()
export class MeetingActivityService {
  constructor(private prisma: PrismaService) {}

  // ================================
  // Activity CRUD
  // ================================

  async getActivities(meetingId: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundException('모임을 찾을 수 없습니다');

    return this.prisma.meetingActivity.findMany({
      where: { meetingId },
      include: { images: { orderBy: { order: 'asc' } } },
      orderBy: { date: 'desc' },
    });
  }

  async createActivity(meetingId: string, userId: string, dto: CreateActivityDto) {
    await this.findMeetingAsHostOrParticipant(meetingId, userId);

    const { images, ...activityData } = dto;
    return this.prisma.meetingActivity.create({
      data: {
        ...activityData,
        date: new Date(dto.date),
        meetingId,
        createdById: userId,
        images: images?.length
          ? {
              create: images.map((img, idx) => ({
                imageUrl: img.imageUrl,
                caption: img.caption,
                order: img.order ?? idx,
                uploadedById: userId,
              })),
            }
          : undefined,
      },
      include: { images: { orderBy: { order: 'asc' } } },
    });
  }

  async updateActivity(activityId: string, userId: string, dto: UpdateActivityDto) {
    const activity = await this.findActivityWithMeeting(activityId);
    await this.findMeetingAsHostOrParticipant(activity.meetingId, userId);

    return this.prisma.meetingActivity.update({
      where: { id: activityId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.location !== undefined && { location: dto.location }),
      },
      include: { images: { orderBy: { order: 'asc' } } },
    });
  }

  async deleteActivity(activityId: string, userId: string) {
    const activity = await this.findActivityWithMeeting(activityId);
    await this.findMeetingAsHost(activity.meetingId, userId);
    return this.prisma.meetingActivity.delete({ where: { id: activityId } });
  }

  // ================================
  // Activity Images
  // ================================

  async addActivityImages(activityId: string, userId: string, dto: AddActivityImagesDto) {
    const activity = await this.findActivityWithMeeting(activityId);
    await this.findMeetingAsHostOrParticipant(activity.meetingId, userId);

    const lastImage = await this.prisma.activityImage.findFirst({
      where: { activityId },
      orderBy: { order: 'desc' },
    });
    const startOrder = (lastImage?.order ?? -1) + 1;

    await this.prisma.activityImage.createMany({
      data: dto.images.map((img, idx) => ({
        activityId,
        imageUrl: img.imageUrl,
        caption: img.caption,
        order: img.order ?? startOrder + idx,
        uploadedById: userId,
      })),
    });

    return this.prisma.meetingActivity.findUnique({
      where: { id: activityId },
      include: { images: { orderBy: { order: 'asc' } } },
    });
  }

  async deleteActivityImage(imageId: string, userId: string) {
    const image = await this.prisma.activityImage.findUnique({
      where: { id: imageId },
      include: { activity: { include: { meeting: true } } },
    });
    if (!image) throw new NotFoundException('이미지를 찾을 수 없습니다');

    await this.findMeetingAsHost(image.activity.meetingId, userId);
    return this.prisma.activityImage.delete({ where: { id: imageId } });
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

  private async findMeetingAsHost(meetingId: string, userId: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundException('모임을 찾을 수 없습니다');
    if (meeting.hostId !== userId) throw new ForbiddenException('권한이 없습니다');
    return meeting;
  }

  private async findMeetingAsHostOrParticipant(meetingId: string, userId: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundException('모임을 찾을 수 없습니다');

    if (meeting.hostId === userId) return meeting;

    const participant = await this.prisma.participant.findUnique({
      where: { meetingId_userId: { meetingId, userId }, status: 'APPROVED' },
    });
    if (!participant) throw new ForbiddenException('권한이 없습니다');

    return meeting;
  }
}
