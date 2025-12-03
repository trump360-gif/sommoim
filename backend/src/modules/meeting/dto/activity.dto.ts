import { IsString, IsOptional, IsDateString, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateActivityDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  date: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ActivityImageDto)
  images?: ActivityImageDto[];
}

export class ActivityImageDto {
  @IsString()
  imageUrl: string;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}

export class UpdateActivityDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  location?: string;
}

export class AddActivityImagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityImageDto)
  images: ActivityImageDto[];
}
