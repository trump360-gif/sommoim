import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserMeetingService } from './user-meeting.service';
import { MeetingModule } from '../meeting/meeting.module';

@Module({
  imports: [MeetingModule],
  controllers: [UserController],
  providers: [UserService, UserMeetingService],
  exports: [UserService],
})
export class UserModule { }
