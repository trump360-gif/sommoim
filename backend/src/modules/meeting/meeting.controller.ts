// ================================
// Types & Interfaces
// ================================

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MeetingService } from './meeting.service';
import { MeetingScheduleService } from './meeting-schedule.service';
import { MeetingActivityService } from './meeting-activity.service';
import { MeetingCalendarService } from './meeting-calendar.service';
import { MeetingRecommendationService } from './meeting-recommendation.service';
import { MeetingStaffService } from './meeting-staff.service';
import { MeetingJoinService } from './meeting-join.service';
import { Category, ParticipantStatus } from '@prisma/client';
import {
  CreateMeetingDto,
  UpdateMeetingDto,
  MeetingQueryDto,
  CreateScheduleDto,
  CreateActivityDto,
  UpdateActivityDto,
  AddActivityImagesDto,
  UpdateAttendanceDto,
  AddStaffDto,
  UpdateStaffDto,
  CreateJoinQuestionDto,
  UpdateJoinQuestionDto,
  ApplyMeetingDto,
  ReviewApplicationDto,
  BulkReviewDto,
} from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

// ================================
// Controller
// ================================

@Controller('meetings')
export class MeetingController {
  constructor(
    private readonly meetingService: MeetingService,
    private readonly scheduleService: MeetingScheduleService,
    private readonly activityService: MeetingActivityService,
    private readonly calendarService: MeetingCalendarService,
    private readonly recommendationService: MeetingRecommendationService,
    private readonly staffService: MeetingStaffService,
    private readonly joinService: MeetingJoinService,
  ) {}

  // ================================
  // Meeting CRUD
  // ================================

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateMeetingDto) {
    return this.meetingService.create(userId, dto);
  }

  @Public()
  @Get()
  findAll(@Query() query: MeetingQueryDto) {
    return this.meetingService.findAll(query);
  }

  // ================================
  // Recommendations
  // ================================

  @Get('recommended')
  getRecommendations(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.recommendationService.getRecommendations({
      userId,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  @Public()
  @Get('popular')
  getPopular(@Query('limit') limit?: string) {
    return this.recommendationService.getPopular(limit ? parseInt(limit) : 10);
  }

  @Public()
  @Get('nearby')
  getNearby(
    @Query('location') location: string,
    @Query('limit') limit?: string,
  ) {
    return this.recommendationService.getNearby(location, limit ? parseInt(limit) : 10);
  }

  @Public()
  @Get('category/:category')
  getByCategory(
    @Param('category') category: Category,
    @Query('limit') limit?: string,
  ) {
    return this.recommendationService.getByCategory(category, limit ? parseInt(limit) : 10);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId?: string) {
    return this.meetingService.findOne(id, userId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMeetingDto,
  ) {
    return this.meetingService.update(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.meetingService.remove(id, userId);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.meetingService.cancel(id, userId);
  }

  // ================================
  // Schedule Management
  // ================================

  @Post(':id/schedules')
  addSchedule(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.scheduleService.addSchedule(id, userId, dto);
  }

  @Put('schedules/:scheduleId')
  updateSchedule(
    @Param('scheduleId') scheduleId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: Partial<CreateScheduleDto>,
  ) {
    return this.scheduleService.updateSchedule(scheduleId, userId, dto);
  }

  @Delete('schedules/:scheduleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSchedule(
    @Param('scheduleId') scheduleId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.scheduleService.removeSchedule(scheduleId, userId);
  }

  // ================================
  // Bookmark
  // ================================

  @Post(':id/bookmark')
  addBookmark(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.scheduleService.addBookmark(id, userId);
  }

  @Delete(':id/bookmark')
  removeBookmark(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.scheduleService.removeBookmark(id, userId);
  }

  // ================================
  // Activity CRUD
  // ================================

  @Public()
  @Get(':id/activities')
  getActivities(@Param('id') id: string) {
    return this.activityService.getActivities(id);
  }

  @Post(':id/activities')
  createActivity(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateActivityDto,
  ) {
    return this.activityService.createActivity(id, userId, dto);
  }

  @Put('activities/:activityId')
  updateActivity(
    @Param('activityId') activityId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.activityService.updateActivity(activityId, userId, dto);
  }

  @Delete('activities/:activityId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteActivity(
    @Param('activityId') activityId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.activityService.deleteActivity(activityId, userId);
  }

  // ================================
  // Activity Images
  // ================================

  @Post('activities/:activityId/images')
  addActivityImages(
    @Param('activityId') activityId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddActivityImagesDto,
  ) {
    return this.activityService.addActivityImages(activityId, userId, dto);
  }

  @Delete('activities/images/:imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteActivityImage(
    @Param('imageId') imageId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.activityService.deleteActivityImage(imageId, userId);
  }

  // ================================
  // Attendance
  // ================================

  @Put('activities/:activityId/attendance')
  updateAttendance(
    @Param('activityId') activityId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.calendarService.updateAttendance(activityId, userId, dto);
  }

  @Get('activities/:activityId/attendances')
  getActivityAttendances(@Param('activityId') activityId: string) {
    return this.calendarService.getActivityAttendances(activityId);
  }

  @Get('activities/:activityId/my-attendance')
  getMyAttendance(
    @Param('activityId') activityId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.calendarService.getMyAttendance(activityId, userId);
  }

  // ================================
  // Staff Management
  // ================================

  @Get(':id/staff')
  getStaffList(@Param('id') id: string) {
    return this.staffService.getStaffList(id);
  }

  @Post(':id/staff')
  addStaff(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddStaffDto,
  ) {
    return this.staffService.addStaff(id, userId, dto);
  }

  @Put(':id/staff/:staffUserId')
  updateStaff(
    @Param('id') id: string,
    @Param('staffUserId') staffUserId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.staffService.updateStaff(id, staffUserId, userId, dto);
  }

  @Delete(':id/staff/:staffUserId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeStaff(
    @Param('id') id: string,
    @Param('staffUserId') staffUserId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.staffService.removeStaff(id, staffUserId, userId);
  }

  @Get(':id/my-role')
  getMyRole(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.staffService.getStaffRole(id, userId);
  }

  // ================================
  // Join Questions
  // ================================

  @Public()
  @Get(':id/join-questions')
  getJoinQuestions(@Param('id') id: string) {
    return this.joinService.getQuestions(id);
  }

  @Post(':id/join-questions')
  createJoinQuestion(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateJoinQuestionDto,
  ) {
    return this.joinService.createQuestion(id, userId, dto);
  }

  @Put('join-questions/:questionId')
  updateJoinQuestion(
    @Param('questionId') questionId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateJoinQuestionDto,
  ) {
    return this.joinService.updateQuestion(questionId, userId, dto);
  }

  @Delete('join-questions/:questionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteJoinQuestion(
    @Param('questionId') questionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.joinService.deleteQuestion(questionId, userId);
  }

  // ================================
  // Applications
  // ================================

  @Post(':id/apply')
  applyMeeting(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ApplyMeetingDto,
  ) {
    return this.joinService.applyMeeting(id, userId, dto);
  }

  @Get(':id/applications')
  getApplications(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Query('status') status?: ParticipantStatus,
  ) {
    return this.joinService.getApplications(id, userId, status);
  }

  @Get('applications/:participantId')
  getApplicationDetail(
    @Param('participantId') participantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.joinService.getApplicationDetail(participantId, userId);
  }

  @Put('applications/:participantId/review')
  reviewApplication(
    @Param('participantId') participantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ReviewApplicationDto,
  ) {
    return this.joinService.reviewApplication(participantId, userId, dto);
  }

  @Post(':id/applications/bulk-review')
  bulkReviewApplications(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: BulkReviewDto,
  ) {
    return this.joinService.bulkReviewApplications(id, userId, dto.participantIds, dto);
  }
}
