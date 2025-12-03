import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ParticipantStatus } from '@prisma/client';

export class UpdateParticipantStatusDto {
  @IsEnum(['APPROVED', 'REJECTED', 'KICKED'])
  status: 'APPROVED' | 'REJECTED' | 'KICKED';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}

export class ParticipantQueryDto {
  @IsOptional()
  @IsEnum(ParticipantStatus)
  status?: ParticipantStatus;
}
