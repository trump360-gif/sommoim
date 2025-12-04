import { Module } from '@nestjs/common';
import { MeetingController } from './meeting.controller';
import { MeetingService } from './meeting.service';
import { MeetingScheduleService } from './meeting-schedule.service';
import { MeetingActivityService } from './meeting-activity.service';
import { MeetingCalendarService } from './meeting-calendar.service';
import { MeetingRecommendationService } from './meeting-recommendation.service';
import { MeetingStaffService } from './meeting-staff.service';
import { MeetingJoinService } from './meeting-join.service';

@Module({
  controllers: [MeetingController],
  providers: [
    MeetingService,
    MeetingScheduleService,
    MeetingActivityService,
    MeetingCalendarService,
    MeetingRecommendationService,
    MeetingStaffService,
    MeetingJoinService,
  ],
  exports: [
    MeetingService,
    MeetingScheduleService,
    MeetingActivityService,
    MeetingCalendarService,
    MeetingRecommendationService,
    MeetingStaffService,
    MeetingJoinService,
  ],
})
export class MeetingModule {}
