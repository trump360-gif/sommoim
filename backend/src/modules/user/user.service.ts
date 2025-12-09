import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  private userSelect = { id: true, nickname: true, profile: { select: { avatarUrl: true } } };

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { id: true, email: true, nickname: true, role: true, profile: true, _count: { select: { followers: true, following: true, hostedMeetings: true } }, createdAt: true },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.nickname) await this.checkNicknameAvailable(dto.nickname, userId);
    const { nickname, ...profileData } = dto;
    await this.prisma.$transaction([
      ...(nickname ? [this.prisma.user.update({ where: { id: userId }, data: { nickname } })] : []),
      this.prisma.profile.update({ where: { userId }, data: profileData }),
    ]);
    return this.getProfile(userId);
  }

  private async checkNicknameAvailable(nickname: string, userId: string) {
    const existing = await this.prisma.user.findFirst({ where: { nickname, id: { not: userId }, deletedAt: null } });
    if (existing) throw new ConflictException('이미 사용 중인 닉네임입니다');
  }

  async getUserById(id: string, currentUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: { id: true, nickname: true, profile: { select: { bio: true, avatarUrl: true } }, _count: { select: { followers: true, following: true, hostedMeetings: true } }, createdAt: true },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');

    const relations = currentUserId && currentUserId !== id ? await this.getRelations(currentUserId, id) : { isFollowing: false, isBlocked: false };
    return { ...user, ...relations };
  }

  private async getRelations(currentUserId: string, targetId: string) {
    const [follow, block] = await Promise.all([
      this.prisma.follow.findUnique({ where: { followerId_followingId: { followerId: currentUserId, followingId: targetId } } }),
      this.prisma.userBlock.findUnique({ where: { blockerId_blockedId: { blockerId: currentUserId, blockedId: targetId } } }),
    ]);
    return { isFollowing: !!follow, isBlocked: !!block };
  }

  async follow(userId: string, targetId: string) {
    if (userId === targetId) throw new BadRequestException('자기 자신을 팔로우할 수 없습니다');
    await this.ensureUserExists(targetId);
    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId: userId, followingId: targetId } },
      create: { followerId: userId, followingId: targetId },
      update: {},
    });
    return { message: '팔로우했습니다' };
  }

  async unfollow(userId: string, targetId: string) {
    await this.prisma.follow.deleteMany({ where: { followerId: userId, followingId: targetId } });
    return { message: '언팔로우했습니다' };
  }

  async getFollowers(userId: string, page = 1, limit = 20) {
    const where = { followingId: userId };
    const [followers, total] = await Promise.all([
      this.prisma.follow.findMany({ where, skip: (page - 1) * limit, take: limit, include: { follower: { select: this.userSelect } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.follow.count({ where }),
    ]);
    return { data: followers.map((f) => f.follower), meta: { total, page, limit } };
  }

  async getFollowing(userId: string, page = 1, limit = 20) {
    const where = { followerId: userId };
    const [following, total] = await Promise.all([
      this.prisma.follow.findMany({ where, skip: (page - 1) * limit, take: limit, include: { following: { select: this.userSelect } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.follow.count({ where }),
    ]);
    return { data: following.map((f) => f.following), meta: { total, page, limit } };
  }

  async blockUser(userId: string, targetId: string) {
    if (userId === targetId) throw new BadRequestException('자기 자신을 차단할 수 없습니다');
    await this.prisma.$transaction([
      this.prisma.userBlock.upsert({ where: { blockerId_blockedId: { blockerId: userId, blockedId: targetId } }, create: { blockerId: userId, blockedId: targetId }, update: {} }),
      this.prisma.follow.deleteMany({ where: { OR: [{ followerId: userId, followingId: targetId }, { followerId: targetId, followingId: userId }] } }),
    ]);
    return { message: '사용자를 차단했습니다' };
  }

  async unblockUser(userId: string, targetId: string) {
    await this.prisma.userBlock.deleteMany({ where: { blockerId: userId, blockedId: targetId } });
    return { message: '차단을 해제했습니다' };
  }

  async getBlockedUsers(userId: string) {
    return this.prisma.userBlock.findMany({
      where: { blockerId: userId },
      include: { blocked: { select: this.userSelect } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteAccount(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date() } });
    return { message: '회원 탈퇴가 완료되었습니다' };
  }

  async getMyBookmarks(userId: string, page = 1, limit = 10) {
    const where = { userId };
    const [bookmarks, total] = await Promise.all([
      this.prisma.bookmark.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { meeting: { include: { host: { select: { id: true, nickname: true } }, _count: { select: { participants: true } } } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.bookmark.count({ where }),
    ]);
    return { data: bookmarks.map((b) => b.meeting), meta: { total, page, limit } };
  }

  private async ensureUserExists(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');
  }
}
