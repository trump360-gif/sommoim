import { IsString, IsOptional, IsBoolean, IsInt, IsObject } from 'class-validator';

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
  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsInt()
  order: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
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
