import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { EventType, RecurringRule } from '@prisma/client';

export class CreateEventDto {
  @IsEnum(EventType)
  @IsOptional()
  type?: EventType = EventType.REGULAR;

  @IsString()
  @MaxLength(100)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsDateString()
  date: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  location?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxParticipants?: number;
}

export class CreateRecurringEventDto extends CreateEventDto {
  @IsEnum(RecurringRule)
  recurringRule: RecurringRule;

  @IsInt()
  @Min(1)
  count: number = 6; // 최대 6개
}

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  location?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxParticipants?: number;
}
