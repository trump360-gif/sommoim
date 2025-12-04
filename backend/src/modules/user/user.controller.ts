import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { MeetingCalendarService } from '../meeting/meeting-calendar.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CalendarQueryDto } from '../meeting/dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly calendarService: MeetingCalendarService,
  ) {}

  @Get('me')
  getProfile(@CurrentUser('id') userId: string) {
    return this.userService.getProfile(userId);
  }

  @Put('me')
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(userId, dto);
  }

  @Delete('me')
  deleteAccount(@CurrentUser('id') userId: string) {
    return this.userService.deleteAccount(userId);
  }

  @Get('me/bookmarks')
  getMyBookmarks(
    @CurrentUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.userService.getMyBookmarks(userId, +page, +limit);
  }

  @Get('me/blocked')
  getBlockedUsers(@CurrentUser('id') userId: string) {
    return this.userService.getBlockedUsers(userId);
  }

  @Get('me/calendar')
  getMyCalendar(@CurrentUser('id') userId: string, @Query() query: CalendarQueryDto) {
    return this.calendarService.getMyCalendarEvents(userId, query);
  }

  @Get(':id')
  getUserById(@Param('id') id: string, @CurrentUser('id') currentUserId?: string) {
    return this.userService.getUserById(id, currentUserId);
  }

  @Post(':id/follow')
  follow(@CurrentUser('id') userId: string, @Param('id') targetId: string) {
    return this.userService.follow(userId, targetId);
  }

  @Delete(':id/follow')
  unfollow(@CurrentUser('id') userId: string, @Param('id') targetId: string) {
    return this.userService.unfollow(userId, targetId);
  }

  @Get(':id/followers')
  getFollowers(@Param('id') id: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.userService.getFollowers(id, +page, +limit);
  }

  @Get(':id/following')
  getFollowing(@Param('id') id: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.userService.getFollowing(id, +page, +limit);
  }

  @Post(':id/block')
  blockUser(@CurrentUser('id') userId: string, @Param('id') targetId: string) {
    return this.userService.blockUser(userId, targetId);
  }

  @Delete(':id/unblock')
  unblockUser(@CurrentUser('id') userId: string, @Param('id') targetId: string) {
    return this.userService.unblockUser(userId, targetId);
  }
}
