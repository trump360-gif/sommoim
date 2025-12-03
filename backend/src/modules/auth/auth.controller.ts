import { Controller, Post, Get, Body, Res, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return { success: true, data: await this.authService.register(dto) };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    this.setTokenCookies(res, await this.authService.login(dto));
    return { success: true, data: { message: '로그인 성공' } };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser('id') userId: string, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.access_token;
    if (token) {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      await this.authService.logout(userId, payload.jti);
    }
    this.clearTokenCookies(res);
    return { success: true, data: { message: '로그아웃 성공' } };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.setTokenCookies(res, await this.authService.refreshTokens(req.cookies?.refresh_token));
    return { success: true, data: { message: '토큰 갱신 성공' } };
  }

  @Get('me')
  async getMe(@CurrentUser('id') userId: string) {
    return { success: true, data: await this.authService.getMe(userId) };
  }

  private setTokenCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    const opts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const };
    res.cookie('access_token', tokens.accessToken, { ...opts, maxAge: 900000 });
    res.cookie('refresh_token', tokens.refreshToken, { ...opts, maxAge: 604800000 });
  }

  private clearTokenCookies(res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }
}
