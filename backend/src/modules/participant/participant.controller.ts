import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ParticipantService } from './participant.service';
import { UpdateParticipantStatusDto, ParticipantQueryDto } from './dto/participant.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller()
export class ParticipantController {
  constructor(private readonly participantService: ParticipantService) {}

  // 참가 신청
  @Post('meetings/:meetingId/participants')
  apply(@Param('meetingId') meetingId: string, @CurrentUser('id') userId: string) {
    return this.participantService.apply(meetingId, userId);
  }

  // 참가 취소 (본인)
  @Delete('meetings/:meetingId/participants/me')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancel(@Param('meetingId') meetingId: string, @CurrentUser('id') userId: string) {
    return this.participantService.cancel(meetingId, userId);
  }

  // 참가자 상태 변경 (모임주)
  @Put('meetings/:meetingId/participants/:participantId')
  updateStatus(
    @Param('meetingId') meetingId: string,
    @Param('participantId') participantId: string,
    @CurrentUser('id') hostId: string,
    @Body() dto: UpdateParticipantStatusDto,
  ) {
    return this.participantService.updateStatus(meetingId, participantId, hostId, dto.status);
  }

  // 모임 참가자 목록
  @Get('meetings/:meetingId/participants')
  findByMeeting(@Param('meetingId') meetingId: string, @Query() query: ParticipantQueryDto) {
    return this.participantService.findByMeeting(meetingId, query.status);
  }

  // 내 참가 모임 목록
  @Get('users/me/participations')
  findMyParticipations(@CurrentUser('id') userId: string, @Query() query: ParticipantQueryDto) {
    return this.participantService.findMyParticipations(userId, query.status);
  }
}
