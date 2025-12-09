import { IsString, IsOptional, MaxLength, IsArray, IsEnum } from 'class-validator';
import { Category } from '@prisma/client';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  faceImageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Category, { each: true })
  interests?: Category[];
}
