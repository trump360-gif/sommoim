import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // 공개 엔드포인트에서도 JWT가 있으면 파싱하여 user 정보 설정
      try {
        await super.canActivate(context);
      } catch {
        // JWT가 없거나 유효하지 않아도 공개 엔드포인트이므로 허용
      }
      return true;
    }

    return super.canActivate(context) as Promise<boolean>;
  }
}
