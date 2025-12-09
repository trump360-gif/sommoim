import { IsString, IsOptional, IsBoolean, IsInt, IsObject, IsDateString } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsObject()
  layoutJson: Record<string, any>;

  @IsInt()
  order: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateBannerDto {
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsInt()
  order: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsInt()
  order: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ReorderDto {
  @IsObject({ each: true })
  items: { id: string; order: number }[];
}
