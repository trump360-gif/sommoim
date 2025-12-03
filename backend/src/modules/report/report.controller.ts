import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportStatus } from '@prisma/client';

@Controller()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('meetings/:meetingId/report')
  reportMeeting(
    @Param('meetingId') meetingId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportService.reportMeeting(meetingId, userId, dto);
  }

  @Post('users/:targetId/report')
  reportUser(
    @Param('targetId') targetId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportService.reportUser(targetId, userId, dto);
  }

  // 관리자 전용
  @Get('admin/reports')
  @Roles('ADMIN', 'MODERATOR')
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: ReportStatus,
  ) {
    return this.reportService.findAll(+page, +limit, status);
  }

  @Get('admin/reports/:id')
  @Roles('ADMIN', 'MODERATOR')
  findOne(@Param('id') id: string) {
    return this.reportService.findOne(id);
  }

  @Put('admin/reports/:id/status')
  @Roles('ADMIN', 'MODERATOR')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body('status') status: ReportStatus,
  ) {
    return this.reportService.updateStatus(id, adminId, status);
  }

  @Delete('admin/reports/:id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.reportService.remove(id);
  }
}
