import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ParticipantStatus } from '@prisma/client';

// ================================
// Join Question DTOs
// ================================

export class CreateJoinQuestionDto {
  @IsString()
  @MaxLength(500)
  question: string;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean = true;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class UpdateJoinQuestionDto {
  @IsString()
  @MaxLength(500)
  @IsOptional()
  question?: string;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

// ================================
// Application DTOs
// ================================

export class JoinAnswerDto {
  @IsString()
  questionId: string;

  @IsString()
  @MaxLength(1000)
  answer: string;
}

export class ApplyMeetingDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  introduction?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JoinAnswerDto)
  @IsOptional()
  answers?: JoinAnswerDto[];
}

export class ReviewApplicationDto {
  @IsEnum(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}

export class BulkReviewDto extends ReviewApplicationDto {
  @IsArray()
  @IsString({ each: true })
  participantIds: string[];
}
