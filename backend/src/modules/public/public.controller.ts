import { Controller, Get, Query } from '@nestjs/common';
import { PublicService, PublicStats, RecentActivity } from './public.service';
import { Public } from '../auth/decorators/public.decorator';

// ================================
// Controller
// ================================

@Controller('public')
@Public()
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  // ================================
  // Stats API
  // ================================

  @Get('stats')
  getStats(): Promise<PublicStats> {
    return this.publicService.getPublicStats();
  }

  // ================================
  // Recent Activities API
  // ================================

  @Get('recent-activities')
  getRecentActivities(@Query('limit') limit?: string): Promise<RecentActivity[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.publicService.getRecentActivities(Math.min(limitNum, 50));
  }
}
