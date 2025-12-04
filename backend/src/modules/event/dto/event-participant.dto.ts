import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EventParticipantStatus } from '@prisma/client';

export class UpdateEventParticipantDto {
  @IsEnum(EventParticipantStatus)
  status: EventParticipantStatus;
}

export class QrCheckInDto {
  @IsString()
  qrCode: string;
}
