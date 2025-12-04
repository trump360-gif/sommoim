// ================================
// Imports & Dependencies
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
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto, CreateRecurringEventDto, UpdateEventDto, UpdateEventParticipantDto, QrCheckInDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { EventType } from '@prisma/client';

// ================================
// Controller
// ================================

@Controller('meetings/:meetingId/events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // ================================
  // Event CRUD
  // ================================

  @Post()
  create(
    @Param('meetingId') meetingId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateEventDto,
  ) {
    return this.eventService.create(meetingId, userId, dto);
  }

  @Post('recurring')
  createRecurring(
    @Param('meetingId') meetingId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRecurringEventDto,
  ) {
    return this.eventService.createRecurring(meetingId, userId, dto);
  }

  @Public()
  @Get()
  findAll(
    @Param('meetingId') meetingId: string,
    @Query('type') type?: EventType,
  ) {
    return this.eventService.findAllByMeeting(meetingId, type);
  }

  @Public()
  @Get(':eventId')
  findOne(@Param('eventId') eventId: string) {
    return this.eventService.findOne(eventId);
  }

  @Put(':eventId')
  update(
    @Param('eventId') eventId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventService.update(eventId, userId, dto);
  }

  @Delete(':eventId')
  delete(
    @Param('eventId') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventService.delete(eventId, userId);
  }

  // ================================
  // Participant Management
  // ================================

  @Post(':eventId/join')
  joinEvent(
    @Param('eventId') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventService.joinEvent(eventId, userId);
  }

  @Delete(':eventId/leave')
  leaveEvent(
    @Param('eventId') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventService.leaveEvent(eventId, userId);
  }

  @Get(':eventId/participants')
  getParticipants(@Param('eventId') eventId: string) {
    return this.eventService.getParticipants(eventId);
  }

  @Put(':eventId/participants/:participantUserId')
  updateParticipantStatus(
    @Param('eventId') eventId: string,
    @Param('participantUserId') participantUserId: string,
    @CurrentUser('id') hostUserId: string,
    @Body() dto: UpdateEventParticipantDto,
  ) {
    return this.eventService.updateParticipantStatus(eventId, participantUserId, hostUserId, dto.status);
  }

  // ================================
  // QR Check-in
  // ================================

  @Post(':eventId/qr')
  generateQrCode(
    @Param('eventId') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventService.generateQrCode(eventId, userId);
  }

  @Get(':eventId/attendance')
  getAttendanceStats(@Param('eventId') eventId: string) {
    return this.eventService.getAttendanceStats(eventId);
  }
}

// ================================
// QR Check-in Controller (별도 경로)
// ================================

@Controller('events')
export class EventQrController {
  constructor(private readonly eventService: EventService) {}

  @Post('check-in')
  checkInWithQr(
    @Body() dto: QrCheckInDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventService.checkInWithQr(dto.qrCode, userId);
  }
}
