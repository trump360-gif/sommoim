import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ParticipantStatus } from '@prisma/client';

@Injectable()
export class UserMeetingService {
    constructor(private prisma: PrismaService) { }

    async getMyMeetings(userId: string) {
        // Get hosted meetings
        const hostedMeetings = await this.prisma.meeting.findMany({
            where: { hostId: userId, deletedAt: null },
            select: {
                id: true,
                title: true,
                description: true,
                category: true,
                status: true,
                imageUrl: true,
                maxParticipants: true,
                createdAt: true,
                _count: {
                    select: { participants: { where: { status: ParticipantStatus.APPROVED } } },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Get participated meetings
        const participations = await this.prisma.participant.findMany({
            where: {
                userId,
                meeting: { deletedAt: null },
                status: { in: [ParticipantStatus.APPROVED, ParticipantStatus.PENDING] }
            },
            select: {
                id: true,
                status: true,
                meeting: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        category: true,
                        status: true,
                        imageUrl: true,
                        maxParticipants: true,
                        hostId: true,
                        createdAt: true,
                        _count: {
                            select: { participants: { where: { status: ParticipantStatus.APPROVED } } },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Format hosted meetings
        const hosted = hostedMeetings.map((meeting) => ({
            ...meeting,
            role: 'HOST' as const,
            participantStatus: 'APPROVED' as const,
        }));

        // Format participated meetings (exclude if user is host)
        // Flatten structure to match hosted format
        const participated = participations
            .filter((p) => p.meeting.hostId !== userId)
            .map((p) => ({
                ...p.meeting,
                role: 'MEMBER' as const,
                participantStatus: p.status,
            }));

        return {
            hosted,
            participated,
        };
    }
}
