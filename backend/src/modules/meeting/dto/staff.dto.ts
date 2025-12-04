import { IsString, IsEnum, IsArray, IsOptional } from 'class-validator';
import { StaffRole, StaffPermission } from '@prisma/client';

export class AddStaffDto {
  @IsString()
  userId: string;

  @IsEnum(StaffRole)
  role: StaffRole;

  @IsArray()
  @IsEnum(StaffPermission, { each: true })
  @IsOptional()
  permissions?: StaffPermission[];
}

export class UpdateStaffDto {
  @IsEnum(StaffRole)
  @IsOptional()
  role?: StaffRole;

  @IsArray()
  @IsEnum(StaffPermission, { each: true })
  @IsOptional()
  permissions?: StaffPermission[];
}
