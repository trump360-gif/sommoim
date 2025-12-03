import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('meetings/:meetingId/chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  getMessages(
    @Param('meetingId') meetingId: string,
    @CurrentUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.chatService.getMessages(meetingId, userId, +page, +limit);
  }

  @Delete(':messageId')
  deleteMessage(
    @Param('messageId') messageId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.deleteMessage(messageId, userId);
  }
}
