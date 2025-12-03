import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@/prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    await this.checkDuplicates(dto.email, dto.nickname);
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: { email: dto.email, password: hashedPassword, nickname: dto.nickname, profile: { create: {} } },
      select: { id: true, email: true, nickname: true, role: true },
    });
  }

  private async checkDuplicates(email: string, nickname: string) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { nickname }], deletedAt: null },
    });
    if (existing) {
      throw new ConflictException(`이미 사용 중인 ${existing.email === email ? '이메일' : '닉네임'}입니다`);
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email, deletedAt: null } });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }
    return this.generateTokens(user.id, user.email, user.role);
  }

  async generateTokens(userId: string, email: string, role: string) {
    const jti = uuidv4();
    const payload: JwtPayload = { sub: userId, email, role, jti };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.createRefreshToken(userId, jti),
    ]);
    return { accessToken, refreshToken };
  }

  private async createRefreshToken(userId: string, jti: string) {
    const expiresIn = this.config.get('JWT_REFRESH_EXPIRES_IN', '7d');
    const token = this.jwtService.sign({ sub: userId, jti, type: 'refresh' }, { expiresIn });
    const tokenHash = await bcrypt.hash(token, 10);
    await this.prisma.refreshToken.create({ data: { tokenHash, userId, expiresAt: this.calcExpiry(expiresIn) } });
    return token;
  }

  private calcExpiry(duration: string): Date {
    const m = duration.match(/^(\d+)([dhms])$/);
    if (!m) return new Date(Date.now() + 604800000);
    const ms = { d: 86400000, h: 3600000, m: 60000, s: 1000 }[m[2]] || 86400000;
    return new Date(Date.now() + parseInt(m[1]) * ms);
  }

  async logout(userId: string, jti: string) {
    await this.prisma.$transaction([
      this.prisma.tokenBlacklist.create({ data: { jti, userId, type: 'LOGOUT', expiresAt: new Date(Date.now() + 86400000) } }),
      this.prisma.refreshToken.deleteMany({ where: { userId } }),
    ]);
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      if (payload.type !== 'refresh') throw new UnauthorizedException('유효하지 않은 토큰입니다');
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub, deletedAt: null } });
      if (!user) throw new UnauthorizedException('사용자를 찾을 수 없습니다');
      await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('토큰 갱신에 실패했습니다');
    }
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, nickname: true, role: true, profile: { select: { bio: true, avatarUrl: true } } },
    });
  }
}
