import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSectionDto, CreateBannerDto, CreateCategoryDto, ReorderDto } from './dto/section.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const weekAgo = new Date(Date.now() - 604800000);
    const [userCount, meetingCount, activeUsers, pendingReports] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.meeting.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, updatedAt: { gte: weekAgo } } }),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
    ]);
    return { userCount, meetingCount, activeUsers, pendingReports };
  }

  async getSections() {
    return this.prisma.pageSection.findMany({ orderBy: { order: 'asc' } });
  }

  async createSection(dto: CreateSectionDto) {
    return this.prisma.pageSection.create({ data: dto });
  }

  async updateSection(id: string, dto: Partial<CreateSectionDto>) {
    const section = await this.prisma.pageSection.findUnique({ where: { id } });
    if (!section) throw new NotFoundException('섹션을 찾을 수 없습니다');
    return this.prisma.pageSection.update({ where: { id }, data: dto });
  }

  async deleteSection(id: string) {
    await this.prisma.pageSection.delete({ where: { id } });
    return { message: '섹션이 삭제되었습니다' };
  }

  async reorderSections(dto: ReorderDto) {
    await Promise.all(dto.items.map((i) => this.prisma.pageSection.update({ where: { id: i.id }, data: { order: i.order } })));
    return { message: '순서가 변경되었습니다' };
  }

  async getBanners() {
    return this.prisma.banner.findMany({ orderBy: { order: 'asc' } });
  }

  async createBanner(dto: CreateBannerDto) {
    return this.prisma.banner.create({ data: dto });
  }

  async updateBanner(id: string, dto: Partial<CreateBannerDto>) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('배너를 찾을 수 없습니다');
    return this.prisma.banner.update({ where: { id }, data: dto });
  }

  async deleteBanner(id: string) {
    await this.prisma.banner.delete({ where: { id } });
    return { message: '배너가 삭제되었습니다' };
  }

  async getCategories() {
    return this.prisma.categoryEntity.findMany({ orderBy: { order: 'asc' } });
  }

  // 공개 API - 활성화된 항목만 반환
  async getPublicSections() {
    return this.prisma.pageSection.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async getPublicBanners() {
    const now = new Date();
    return this.prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
        ],
      },
      orderBy: { order: 'asc' },
    });
  }

  async getPublicCategories() {
    return this.prisma.categoryEntity.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.categoryEntity.create({ data: dto });
  }

  async updateCategory(id: string, dto: Partial<CreateCategoryDto>) {
    const cat = await this.prisma.categoryEntity.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('카테고리를 찾을 수 없습니다');
    return this.prisma.categoryEntity.update({ where: { id }, data: dto });
  }

  async deleteCategory(id: string) {
    await this.prisma.categoryEntity.delete({ where: { id } });
    return { message: '카테고리가 삭제되었습니다' };
  }

  async getUsers(page: number, limit: number, search?: string) {
    const where = { deletedAt: null, ...(search && { OR: [{ email: { contains: search } }, { nickname: { contains: search } }] }) };
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({ where, skip: (page - 1) * limit, take: limit, select: this.userSelect(), orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  private userSelect() {
    return { id: true, email: true, nickname: true, role: true, createdAt: true, profile: { select: { avatarUrl: true } } };
  }

  async updateUserRole(id: string, role: string) {
    return this.prisma.user.update({ where: { id }, data: { role: role as any }, select: this.userSelect() });
  }

  async deleteUser(id: string) {
    await this.prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: '사용자가 삭제되었습니다' };
  }

  async getMeetings(page: number, limit: number, status?: string) {
    const where = { deletedAt: null, ...(status && { status: status as any }) };
    const [data, total] = await Promise.all([
      this.prisma.meeting.findMany({ where, skip: (page - 1) * limit, take: limit, include: { host: { select: { nickname: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.meeting.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async deleteMeeting(id: string) {
    await this.prisma.meeting.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: '모임이 삭제되었습니다' };
  }

  async getReports(page: number, limit: number, status?: string) {
    const where = status ? { status: status as any } : {};
    const [data, total] = await Promise.all([
      this.prisma.report.findMany({ where, skip: (page - 1) * limit, take: limit, include: this.reportInclude(), orderBy: { createdAt: 'desc' } }),
      this.prisma.report.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  private reportInclude() {
    return { sender: { select: { nickname: true } }, targetUser: { select: { nickname: true } }, targetMeeting: { select: { title: true } } };
  }

  async updateReport(id: string, status: string) {
    return this.prisma.report.update({ where: { id }, data: { status: status as any, processedAt: new Date() }, include: this.reportInclude() });
  }
}
