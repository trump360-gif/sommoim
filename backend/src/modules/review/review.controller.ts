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
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('meetings/:meetingId/reviews')
  create(
    @Param('meetingId') meetingId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewService.create(meetingId, userId, dto);
  }

  @Public()
  @Get('meetings/:meetingId/reviews')
  findByMeeting(
    @Param('meetingId') meetingId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.reviewService.findByMeeting(meetingId, +page, +limit);
  }

  @Public()
  @Get('reviews/:id')
  findOne(@Param('id') id: string) {
    return this.reviewService.findOne(id);
  }

  @Put('reviews/:id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: Partial<CreateReviewDto>,
  ) {
    return this.reviewService.update(id, userId, dto);
  }

  @Delete('reviews/:id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.reviewService.remove(id, userId);
  }
}
