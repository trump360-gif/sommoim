import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class PasswordResetRequestDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  email: string;
}

export class PasswordResetConfirmDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  email: string;

  @IsString()
  @MinLength(6, { message: '인증 코드는 6자리입니다' })
  @MaxLength(6, { message: '인증 코드는 6자리입니다' })
  code: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  newPassword: string;
}
