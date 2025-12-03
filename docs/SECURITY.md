# 소모임 플랫폼 (Sommoim) - 보안 정책 v3.1

**작성일:** 2025-12-03
**버전:** 3.1
**상태:** 개발 준비 완료

---

## 1. 인증 & 토큰

### 1.1 JWT 구조

```typescript
// Access Token (24시간)
{
  header: { alg: 'HS256', typ: 'JWT' },
  payload: {
    sub: 'user_id',
    email: 'user@example.com',
    role: 'USER',
    iat: 1733232000,
    exp: 1733318400,
    jti: 'unique-token-id'
  }
}

// Refresh Token (7일)
{
  payload: {
    sub: 'user_id',
    type: 'refresh',
    iat: 1733232000,
    exp: 1733836800
  }
}
```

### 1.2 쿠키 설정

```typescript
// Access Token 쿠키
res.cookie('accessToken', token, {
  httpOnly: true,      // JS 접근 불가 (XSS 방어)
  secure: true,        // HTTPS만
  sameSite: 'strict',  // CSRF 방어
  maxAge: 24 * 60 * 60 * 1000,
  path: '/api'
});

// Refresh Token 쿠키
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth/refresh'
});
```

### 1.3 토큰 저장 스키마

```prisma
model RefreshToken {
  id         String   @id @default(cuid())
  tokenHash  String   @unique
  userId     String
  deviceInfo String?
  ipAddress  String?
  expiresAt  DateTime
  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([expiresAt])
}

model TokenBlacklist {
  id        String             @id @default(cuid())
  jti       String             @unique
  userId    String
  type      TokenBlacklistType
  expiresAt DateTime
  createdAt DateTime           @default(now())

  @@index([userId])
  @@index([expiresAt])
}

enum TokenBlacklistType {
  LOGOUT
  REVOKE
  PASSWORD_CHANGE
}
```

---

## 2. RBAC (역할 기반 접근 제어)

### 2.1 역할 정의

| 역할 | 권한 |
|------|------|
| ADMIN | 전체 접근 |
| MODERATOR | 신고/콘텐츠 관리 |
| USER | 기본 사용자 |

### 2.2 리소스 레벨 권한

| 리소스 | 권한 |
|--------|------|
| 모임 수정/삭제 | 모임주만 |
| 참가 승인/거절 | 모임주만 |
| 리뷰 수정/삭제 | 작성자만 |
| 채팅 접근 | 승인된 참가자만 |

### 2.3 Guard 구현

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!roles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return roles.includes(user.role);
  }
}

// 사용
@Post('/admin/categories')
@Roles(UserRole.ADMIN)
async createCategory() { ... }
```

---

## 3. 입력 검증

### 3.1 DTO 검증

```typescript
export class CreateMeetingDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @IsEnum(Category)
  category: Category;

  @IsInt()
  @Min(2)
  @Max(1000)
  maxParticipants: number;
}
```

### 3.2 비밀번호 정책

```typescript
// 8자 이상, 대소문자/숫자/특수문자 포함
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

@IsString()
@Matches(passwordRegex, {
  message: '비밀번호는 8자 이상, 대소문자/숫자/특수문자 포함'
})
password: string;
```

### 3.3 XSS 방어

```typescript
import DOMPurify from 'isomorphic-dompurify';

// 모든 태그 제거
function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

// 일부 포맷 허용
function sanitizeRichText(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: []
  });
}
```

### 3.4 SQL Injection 방어

```typescript
// ✅ 안전 (Prisma ORM)
const user = await prisma.user.findUnique({
  where: { email: userInput }
});

// ✅ Raw Query (Template Literal)
const result = await prisma.$queryRaw`
  SELECT * FROM "User" WHERE email = ${userInput}
`;

// ❌ 위험 (절대 금지)
const result = await prisma.$queryRawUnsafe(
  `SELECT * FROM "User" WHERE email = '${userInput}'`
);
```

---

## 4. Rate Limiting

### 4.1 제한 정책

| 엔드포인트 | 제한 | 윈도우 |
|------------|------|--------|
| 회원가입 | 3회 | 1시간 |
| 로그인 | 5회 | 1분 |
| 비밀번호 재설정 | 3회 | 1시간 |
| API 기본 | 100회 | 1분 |
| 모임 생성 | 10회 | 1시간 |
| 이미지 업로드 | 10회 | 1시간 |
| 채팅 메시지 | 50회 | 1분 |

### 4.2 구현

```typescript
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100
    })
  ]
})
export class AppModule {}

// 엔드포인트별 커스텀
@Post('/auth/login')
@Throttle(5, 60)
async login() { ... }
```

---

## 5. WebSocket 인증

```typescript
@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection {

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token
      || client.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      client.emit('error', { message: '인증 필요' });
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);

      // 블랙리스트 확인
      const isBlacklisted = await this.tokenService.isBlacklisted(payload.jti);
      if (isBlacklisted) {
        client.emit('error', { message: '만료된 토큰' });
        client.disconnect();
        return;
      }

      client.data.userId = payload.sub;
    } catch {
      client.emit('error', { message: '토큰 검증 실패' });
      client.disconnect();
    }
  }

  @SubscribeMessage('join')
  async handleJoin(client: Socket, meetingId: string) {
    const isParticipant = await this.participantService
      .isApprovedParticipant(meetingId, client.data.userId);

    if (!isParticipant) {
      client.emit('error', { message: '참가자만 입장 가능' });
      return;
    }

    client.join(`meeting:${meetingId}`);
  }
}
```

---

## 6. 보안 헤더

### 6.1 Helmet 설정

```typescript
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", process.env.API_URL]
  }
}));
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}));
```

### 6.2 응답 헤더

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 7. CORS

```typescript
app.enableCors({
  origin: [
    'https://sommoim.com',
    'https://www.sommoim.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
  maxAge: 86400
});
```

---

## 8. 데이터 보호

### 8.1 비밀번호 해싱

```typescript
import * as bcrypt from 'bcryptjs';

// 해싱 (cost 12)
const hash = await bcrypt.hash(password, 12);

// 검증
const isValid = await bcrypt.compare(password, hash);
```

### 8.2 민감정보 제거

```typescript
@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map(data => this.sanitize(data))
    );
  }

  private sanitize(data: any) {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };
    delete sanitized.password;
    delete sanitized.salt;
    delete sanitized.jti;

    return sanitized;
  }
}
```

### 8.3 소프트 삭제

```prisma
model User {
  // ...
  deletedAt DateTime?

  @@index([deletedAt])
}
```

```typescript
// 조회 시 삭제된 데이터 제외
const users = await prisma.user.findMany({
  where: { deletedAt: null }
});

// 삭제
await prisma.user.update({
  where: { id },
  data: { deletedAt: new Date() }
});

// 30일 후 완전 삭제 (스케줄러)
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async permanentDelete() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await prisma.user.deleteMany({
    where: { deletedAt: { lt: thirtyDaysAgo } }
  });
}
```

---

## 9. 환경 변수 검증

```typescript
import { plainToInstance } from 'class-transformer';
import { IsString, MinLength, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  @IsString()
  @MinLength(32)
  REFRESH_TOKEN_SECRET: string;

  @IsString()
  DATABASE_URL: string;
}

export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true
  });

  const errors = validateSync(validated);

  if (errors.length > 0) {
    throw new Error(`환경 변수 오류: ${errors.map(e =>
      Object.values(e.constraints || {})).flat().join(', ')}`);
  }

  return validated;
}
```

---

## 10. 로깅

### 10.1 로그 포맷

```json
{
  "timestamp": "2025-12-03T10:00:00.000Z",
  "level": "INFO",
  "requestId": "req_abc123",
  "userId": "user_123",
  "method": "POST",
  "path": "/api/meetings",
  "statusCode": 201,
  "duration": 45
}
```

### 10.2 로깅 인터셉터

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const requestId = randomUUID();
    const startTime = Date.now();

    request.headers['x-request-id'] = requestId;

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        this.logger.log({
          requestId,
          method,
          path: url,
          statusCode: response.statusCode,
          duration: Date.now() - startTime
        });
      })
    );
  }
}
```

---

## 11. OWASP Top 10 대응

| 취약점 | 대응 |
|--------|------|
| A01: Broken Access Control | RBAC + Resource 레벨 검증 |
| A02: Cryptographic Failures | bcrypt, HTTPS/TLS 1.3 |
| A03: Injection | Prisma ORM, DOMPurify |
| A04: Insecure Design | 보안 아키텍처 설계 |
| A05: Security Misconfiguration | 환경 변수 검증, 보안 헤더 |
| A06: Vulnerable Components | npm audit, 정기 업데이트 |
| A07: Auth Failures | 강한 비밀번호, JWT, Rate Limit |
| A08: Data Integrity | 코드 리뷰, 자동 테스트 |
| A09: Logging Failures | 구조화된 로깅, Sentry |
| A10: SSRF | URL 검증, 화이트리스트 |

---

## 12. 보안 체크리스트

### 개발 단계

```
[ ] JWT_SECRET 32자 이상
[ ] REFRESH_TOKEN_SECRET 별도 값
[ ] 비밀번호 bcrypt cost 12+
[ ] DTO 검증 (class-validator)
[ ] XSS 방어 (DOMPurify)
[ ] SQL Injection 방어 (Prisma)
[ ] Rate Limiting 설정
[ ] CORS 화이트리스트
[ ] 보안 헤더 (helmet)
[ ] WebSocket 인증
```

### 배포 전

```
[ ] HTTPS 강제
[ ] 환경 변수 검증
[ ] npm audit 통과
[ ] 민감정보 응답에서 제거
[ ] 에러 메시지 최소화
[ ] 로깅 설정
```

### 운영 중

```
[ ] 일일 보안 로그 검토
[ ] 주간 의존성 업데이트
[ ] 월간 보안 감사
[ ] 분기별 침투 테스트
```

---

**관련 문서:**
- [PRD.md](./PRD.md) - 제품 요구사항
- [TRD.md](./TRD.md) - 기술 요구사항
