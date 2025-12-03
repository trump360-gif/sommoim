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
import { CreateMeetingDto, UpdateMeetingDto, MeetingQueryDto, CreateScheduleDto, CreateActivityDto, UpdateActivityDto, AddActivityImagesDto, UpdateAttendanceDto, CalendarQueryDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('meetings')
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateMeetingDto) {
    return this.meetingService.create(userId, dto);
  }

  @Public()
  @Get()
  findAll(@Query() query: MeetingQueryDto) {
    return this.meetingService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId?: string) {
    return this.meetingService.findOne(id, userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: UpdateMeetingDto) {
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

  // 일정 관리
  @Post(':id/schedules')
  addSchedule(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: CreateScheduleDto) {
    return this.meetingService.addSchedule(id, userId, dto);
  }

  @Put('schedules/:scheduleId')
  updateSchedule(
    @Param('scheduleId') scheduleId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: Partial<CreateScheduleDto>,
  ) {
    return this.meetingService.updateSchedule(scheduleId, userId, dto);
  }

  @Delete('schedules/:scheduleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSchedule(@Param('scheduleId') scheduleId: string, @CurrentUser('id') userId: string) {
    return this.meetingService.removeSchedule(scheduleId, userId);
  }

  // 북마크
  @Post(':id/bookmark')
  addBookmark(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.meetingService.addBookmark(id, userId);
  }

  @Delete(':id/bookmark')
  removeBookmark(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.meetingService.removeBookmark(id, userId);
  }

  // 활동 기록
  @Public()
  @Get(':id/activities')
  getActivities(@Param('id') id: string) {
    return this.meetingService.getActivities(id);
  }

  @Post(':id/activities')
  createActivity(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateActivityDto,
  ) {
    return this.meetingService.createActivity(id, userId, dto);
  }

  @Put('activities/:activityId')
  updateActivity(
    @Param('activityId') activityId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.meetingService.updateActivity(activityId, userId, dto);
  }

  @Delete('activities/:activityId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteActivity(@Param('activityId') activityId: string, @CurrentUser('id') userId: string) {
    return this.meetingService.deleteActivity(activityId, userId);
  }

  // 활동 이미지
  @Post('activities/:activityId/images')
  addActivityImages(
    @Param('activityId') activityId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddActivityImagesDto,
  ) {
    return this.meetingService.addActivityImages(activityId, userId, dto);
  }

  @Delete('activities/images/:imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteActivityImage(@Param('imageId') imageId: string, @CurrentUser('id') userId: string) {
    return this.meetingService.deleteActivityImage(imageId, userId);
  }

  // 활동 참석 관리
  @Put('activities/:activityId/attendance')
  updateAttendance(
    @Param('activityId') activityId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.meetingService.updateAttendance(activityId, userId, dto);
  }

  @Get('activities/:activityId/attendances')
  getActivityAttendances(@Param('activityId') activityId: string) {
    return this.meetingService.getActivityAttendances(activityId);
  }

  @Get('activities/:activityId/my-attendance')
  getMyAttendance(@Param('activityId') activityId: string, @CurrentUser('id') userId: string) {
    return this.meetingService.getMyAttendance(activityId, userId);
  }
}
