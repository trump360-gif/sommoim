import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateSectionDto, CreateBannerDto, CreateCategoryDto, ReorderDto } from './dto/section.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('admin')
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // 공개 API - 사용자 페이지에서 사용
  @Public()
  @Get('public/sections')
  getPublicSections() {
    return this.adminService.getPublicSections();
  }

  @Public()
  @Get('public/banners')
  getPublicBanners() {
    return this.adminService.getPublicBanners();
  }

  @Public()
  @Get('public/categories')
  getPublicCategories() {
    return this.adminService.getPublicCategories();
  }

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  // 섹션
  @Get('page-sections')
  getSections() {
    return this.adminService.getSections();
  }

  @Post('page-sections')
  createSection(@Body() dto: CreateSectionDto) {
    return this.adminService.createSection(dto);
  }

  @Put('page-sections/:id')
  updateSection(@Param('id') id: string, @Body() dto: Partial<CreateSectionDto>) {
    return this.adminService.updateSection(id, dto);
  }

  @Delete('page-sections/:id')
  deleteSection(@Param('id') id: string) {
    return this.adminService.deleteSection(id);
  }

  @Put('page-sections/reorder')
  reorderSections(@Body() dto: ReorderDto) {
    return this.adminService.reorderSections(dto);
  }

  // 배너
  @Get('banners')
  getBanners() {
    return this.adminService.getBanners();
  }

  @Post('banners')
  createBanner(@Body() dto: CreateBannerDto) {
    return this.adminService.createBanner(dto);
  }

  @Put('banners/:id')
  updateBanner(@Param('id') id: string, @Body() dto: Partial<CreateBannerDto>) {
    return this.adminService.updateBanner(id, dto);
  }

  @Delete('banners/:id')
  deleteBanner(@Param('id') id: string) {
    return this.adminService.deleteBanner(id);
  }

  // 카테고리
  @Get('categories')
  getCategories() {
    return this.adminService.getCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.adminService.createCategory(dto);
  }

  @Put('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: Partial<CreateCategoryDto>) {
    return this.adminService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id);
  }

  // 사용자 관리
  @Get('users')
  getUsers(@Query('page') page = 1, @Query('limit') limit = 20, @Query('search') search?: string) {
    return this.adminService.getUsers(+page, +limit, search);
  }

  @Put('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body('role') role: string) {
    return this.adminService.updateUserRole(id, role);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // 모임 관리
  @Get('meetings')
  getMeetings(@Query('page') page = 1, @Query('limit') limit = 20, @Query('status') status?: string) {
    return this.adminService.getMeetings(+page, +limit, status);
  }

  @Delete('meetings/:id')
  deleteMeeting(@Param('id') id: string) {
    return this.adminService.deleteMeeting(id);
  }

  // 신고 관리
  @Get('reports')
  getReports(@Query('page') page = 1, @Query('limit') limit = 20, @Query('status') status?: string) {
    return this.adminService.getReports(+page, +limit, status);
  }

  @Put('reports/:id')
  updateReport(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateReport(id, status);
  }

  // ================================
  // 파일 관리
  // ================================

  @Get('files')
  getFiles(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('entityType') entityType?: string,
  ) {
    return this.adminService.getFiles(+page, +limit, entityType);
  }

  @Get('files/stats')
  getFileStats() {
    return this.adminService.getFileStats();
  }

  @Delete('files/:id')
  deleteFile(@Param('id') id: string) {
    return this.adminService.deleteFile(id);
  }

  // ================================
  // 활동 로그
  // ================================

  @Get('logs')
  getLogs(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('userId') userId?: string,
  ) {
    return this.adminService.getLogs(+page, +limit, { action, entityType, userId });
  }

  // ================================
  // 시스템 설정
  // ================================

  @Get('settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @Put('settings')
  updateSettings(@Body() settings: Record<string, string>) {
    return this.adminService.updateSettings(settings);
  }
}
