import { Module } from '@nestjs/common';
import { EventController, EventQrController } from './event.controller';
import { EventService } from './event.service';

@Module({
  controllers: [EventController, EventQrController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
