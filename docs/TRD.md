# 소모임 플랫폼 (Sommoim) - TRD v3.2

**작성일:** 2025-12-03
**버전:** 3.2
**상태:** 개발 진행 중 (Phase 1 완료)

---

## 1. 기술 스택

### 1.1 프론트엔드

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 14.x | App Router, SSR/SSG |
| TypeScript | 5.x | 타입 안전성 |
| React Query | 5.x | 서버 상태 관리 |
| Zustand | 4.x | 클라이언트 상태 |
| Socket.IO Client | 4.x | 실시간 통신 |
| Tailwind CSS | 3.x | 스타일링 |
| React Hook Form | 7.x | 폼 관리 |
| Zod | 3.x | 스키마 검증 |

### 1.2 백엔드

| 기술 | 버전 | 용도 |
|------|------|------|
| NestJS | 10.x | 프레임워크 |
| TypeScript | 5.x | 타입 안전성 |
| Prisma | 5.x | ORM |
| PostgreSQL | 15.x | 메인 DB |
| Redis | 7.x | 캐싱, 세션, 큐 |
| Bull | 4.x | 작업 큐 |
| Socket.IO | 4.x | WebSocket |
| Passport | 0.7.x | 인증 |

### 1.3 인프라

| 기술 | 용도 |
|------|------|
| Podman | 컨테이너 (루트리스) |
| Cloudflare R2 | 이미지 저장소 |
| Fly.io | 배포 (서울 리전) |
| Sentry | 에러 모니터링 |
| GitHub Actions | CI/CD |

---

## 2. 시스템 아키텍처

### 2.1 전체 구조

```
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │   (CDN, WAF)    │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────┴─────────┐         ┌────────┴────────┐
    │    Frontend       │         │     Backend     │
    │   (Next.js)       │────────▶│    (NestJS)     │
    │   Port: 3001      │         │   Port: 3000    │
    └───────────────────┘         └────────┬────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
          ┌─────────┴─────────┐  ┌────────┴────────┐  ┌─────────┴─────────┐
          │    PostgreSQL     │  │      Redis      │  │  Cloudflare R2    │
          │    Port: 5432     │  │   Port: 6379    │  │   (이미지 저장)   │
          └───────────────────┘  └─────────────────┘  └───────────────────┘
```

### 2.2 데이터 흐름

```
사용자 요청
  ↓
[Cloudflare CDN/WAF]
  ↓
[Next.js Frontend] ──→ [정적 자산]
  ↓
[NestJS Backend]
  ↓
[인증/권한 검증]
  ↓
[비즈니스 로직]
  ↓
[PostgreSQL / Redis / R2]
  ↓
[응답]
```

---

## 3. 500자 제약 규칙

### 3.1 핵심 원칙

**모든 함수/메서드/컴포넌트는 500자 이내**

| 대상 | 최대 글자 수 |
|------|-------------|
| 일반 함수 | 500자 |
| 클래스 메서드 | 500자 |
| React 컴포넌트 | 500자 |
| 유틸리티 함수 | 300자 |
| 테스트 케이스 | 800자 |

### 3.2 자동 검사 스크립트

```typescript
// scripts/check-500-rule.ts
import { Project, SyntaxKind } from 'ts-morph';

const MAX_CHARS = 500;
const project = new Project({
  tsConfigFilePath: './tsconfig.json'
});

const violations: Array<{
  file: string;
  name: string;
  line: number;
  chars: number;
}> = [];

project.getSourceFiles('src/**/*.ts').forEach(sourceFile => {
  const filePath = sourceFile.getFilePath();
  const maxChars = filePath.includes('.spec.') ? 800 : MAX_CHARS;

  // 함수 검사
  sourceFile.getFunctions().forEach(fn => {
    if (fn.getText().length > maxChars) {
      violations.push({
        file: filePath,
        name: fn.getName() || 'anonymous',
        line: fn.getStartLineNumber(),
        chars: fn.getText().length
      });
    }
  });

  // 클래스 메서드 검사
  sourceFile.getClasses().forEach(cls => {
    cls.getMethods().forEach(method => {
      if (method.getText().length > maxChars) {
        violations.push({
          file: filePath,
          name: `${cls.getName()}.${method.getName()}`,
          line: method.getStartLineNumber(),
          chars: method.getText().length
        });
      }
    });
  });
});

if (violations.length > 0) {
  console.log(`❌ 500자 규칙 위반: ${violations.length}건`);
  violations.forEach(v => {
    console.log(`  ${v.file}:${v.line} - ${v.name} (${v.chars}자)`);
  });
  process.exit(1);
}

console.log('✅ 모든 함수가 500자 이내입니다!');
```

### 3.3 NPM 스크립트

```json
{
  "scripts": {
    "check:500": "ts-node scripts/check-500-rule.ts",
    "lint": "eslint src --max-warnings 0",
    "build": "npm run check:500 && npm run lint && nest build"
  }
}
```

---

## 4. 데이터베이스 스키마

### 4.1 ERD 개요

```
User ──1:N──▶ Meeting (host)
User ──1:N──▶ Participant
User ──1:N──▶ Review
User ──1:N──▶ Notification
User ──1:N──▶ ChatMessage

Meeting ──1:N──▶ MeetingSchedule
Meeting ──1:N──▶ Participant
Meeting ──1:N──▶ Review
Meeting ──1:N──▶ ChatMessage

User ──M:N──▶ User (Follow)
User ──M:N──▶ User (Block)
User ──M:N──▶ Meeting (Bookmark)
```

### 4.2 주요 테이블

#### User
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  nickname  String   @unique
  role      UserRole @default(USER)

  deletedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum UserRole {
  ADMIN
  MODERATOR
  USER
}
```

#### Meeting
```prisma
model Meeting {
  id              String        @id @default(cuid())
  title           String
  description     String
  category        Category
  location        String
  maxParticipants Int
  imageUrl        String?
  status          MeetingStatus @default(RECRUITING)
  autoApprove     Boolean       @default(false)

  hostId          String

  deletedAt       DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

enum Category {
  SPORTS
  GAMES
  FOOD
  CULTURE
  TRAVEL
  STUDY
}

enum MeetingStatus {
  DRAFT
  RECRUITING
  ONGOING
  COMPLETED
  CANCELLED
}
```

#### Participant
```prisma
model Participant {
  id        String            @id @default(cuid())
  meetingId String
  userId    String
  status    ParticipantStatus @default(PENDING)

  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt

  @@unique([meetingId, userId])
}

enum ParticipantStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
  KICKED
}
```

### 4.3 인덱스 전략

```prisma
// 자주 조회되는 필드
@@index([email])           // User
@@index([hostId])          // Meeting
@@index([category])        // Meeting
@@index([status])          // Meeting, Participant
@@index([meetingId])       // Participant, Review, ChatMessage
@@index([userId])          // Participant, Review, Notification
@@index([createdAt])       // 정렬용
@@index([deletedAt])       // 소프트 삭제 필터
```

---

## 5. API 명세

### 5.1 응답 형식

#### 성공 응답
```typescript
// 단일 객체
{
  "success": true,
  "data": { ... }
}

// 목록 (페이지네이션)
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### 에러 응답
```typescript
{
  "success": false,
  "error": {
    "statusCode": 400,
    "error": "Bad Request",
    "message": ["이메일 형식이 올바르지 않습니다"],
    "timestamp": "2025-12-03T10:00:00.000Z",
    "path": "/api/auth/register",
    "requestId": "req_abc123"
  }
}
```

### 5.2 API 엔드포인트

#### 인증 (7개)
```
POST   /api/auth/register        - 회원가입
POST   /api/auth/login           - 로그인
POST   /api/auth/logout          - 로그아웃
POST   /api/auth/refresh         - 토큰 갱신
POST   /api/auth/password-reset  - 비밀번호 초기화 요청
PUT    /api/auth/password        - 비밀번호 변경
POST   /api/auth/verify-email    - 이메일 인증
```

#### 사용자 (13개)
```
GET    /api/users/me             - 내 프로필
PUT    /api/users/me             - 프로필 수정
POST   /api/users/me/avatar      - 프로필 사진 업로드
DELETE /api/users/me             - 회원 탈퇴
GET    /api/users/:id            - 사용자 프로필
POST   /api/users/:id/follow     - 팔로우
DELETE /api/users/:id/follow     - 언팔로우
GET    /api/users/:id/followers  - 팔로워 목록
GET    /api/users/:id/following  - 팔로잉 목록
POST   /api/users/:id/block      - 차단
DELETE /api/users/:id/block      - 차단 해제
GET    /api/users/me/blocked     - 차단 목록
POST   /api/users/:id/report     - 사용자 신고
```

#### 모임 (16개)
```
POST   /api/meetings                           - 모임 생성
GET    /api/meetings                           - 모임 목록
GET    /api/meetings/:id                       - 모임 상세
PUT    /api/meetings/:id                       - 모임 수정
DELETE /api/meetings/:id                       - 모임 삭제
POST   /api/meetings/:id/cancel                - 모임 취소
POST   /api/meetings/:id/schedules             - 일정 추가
GET    /api/meetings/:id/schedules             - 일정 목록
PUT    /api/meetings/:id/schedules/:sid        - 일정 수정
DELETE /api/meetings/:id/schedules/:sid        - 일정 삭제
POST   /api/meetings/:id/image                 - 이미지 업로드
GET    /api/meetings/:id/stats                 - 모임 통계
POST   /api/meetings/:id/bookmark              - 북마크
DELETE /api/meetings/:id/bookmark              - 북마크 취소
GET    /api/users/me/bookmarks                 - 북마크 목록
POST   /api/meetings/:id/report                - 모임 신고
```

#### 참가 (6개)
```
POST   /api/meetings/:id/participants          - 참가 신청
GET    /api/meetings/:id/participants          - 참가자 목록
PUT    /api/participants/:id/approve           - 승인
PUT    /api/participants/:id/reject            - 거절
PUT    /api/participants/:id/cancel            - 취소
DELETE /api/participants/:id                   - 강퇴
```

#### 리뷰 (5개)
```
POST   /api/meetings/:id/reviews  - 리뷰 작성
GET    /api/meetings/:id/reviews  - 리뷰 목록
GET    /api/reviews/:id           - 리뷰 상세
PUT    /api/reviews/:id           - 리뷰 수정
DELETE /api/reviews/:id           - 리뷰 삭제
```

#### 알림 (5개)
```
GET    /api/notifications              - 알림 목록
GET    /api/notifications/unread       - 미읽음 알림
PUT    /api/notifications/:id/read     - 읽음 표시
PUT    /api/notifications/read-all     - 모두 읽음
DELETE /api/notifications/:id          - 알림 삭제
```

#### 채팅 (3개 + WebSocket)
```
GET    /api/meetings/:id/chats             - 메시지 조회
POST   /api/meetings/:id/chats             - 메시지 저장
DELETE /api/meetings/:id/chats/:messageId  - 메시지 삭제

WebSocket:
- connect    : 연결 (JWT 인증)
- join       : 채팅방 입장
- leave      : 채팅방 퇴장
- message    : 메시지 전송
- message:new: 새 메시지 수신
```

#### 관리자 (20개)
```
# 섹션
GET    /api/admin/sections              - 목록
POST   /api/admin/sections              - 생성
PUT    /api/admin/sections/:id          - 수정
DELETE /api/admin/sections/:id          - 삭제
PUT    /api/admin/sections/reorder      - 정렬

# 배너
GET    /api/admin/banners               - 목록
POST   /api/admin/banners               - 생성
PUT    /api/admin/banners/:id           - 수정
DELETE /api/admin/banners/:id           - 삭제

# 카테고리
GET    /api/admin/categories            - 목록
POST   /api/admin/categories            - 생성
PUT    /api/admin/categories/:id        - 수정
DELETE /api/admin/categories/:id        - 삭제

# 신고
GET    /api/admin/reports               - 목록
GET    /api/admin/reports/:id           - 상세
PUT    /api/admin/reports/:id/status    - 처리
DELETE /api/admin/reports/:id           - 삭제

# 기타
GET    /api/admin/dashboard             - 대시보드
GET    /api/admin/activity-logs         - 활동 로그
PUT    /api/admin/system/maintenance    - 점검 모드
```

**총 API: 77개**

---

## 6. 폴더 구조

### 6.1 백엔드

```
backend/
├── src/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   ├── guards/
│   │   └── dto/
│   │
│   ├── users/
│   ├── meetings/
│   ├── participants/
│   ├── reviews/
│   ├── reports/
│   ├── notifications/
│   ├── chat/
│   ├── admin/
│   ├── upload/
│   │
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   ├── dto/
│   │   └── interfaces/
│   │
│   ├── config/
│   ├── prisma/
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── scripts/
│   └── check-500-rule.ts
│
├── test/
├── Containerfile
└── package.json
```

### 6.2 프론트엔드

```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (main)/
│   │   ├── meetings/
│   │   ├── profile/
│   │   ├── notifications/
│   │   └── bookmarks/
│   └── admin/
│
├── components/
│   ├── common/
│   ├── layout/
│   ├── meeting/
│   ├── chat/
│   └── admin/
│
├── lib/
│   ├── api/
│   ├── hooks/
│   ├── stores/
│   ├── utils/
│   └── types/
│
├── public/
├── styles/
├── Containerfile
└── package.json
```

---

## 7. 상태 관리

### 7.1 Zustand 스토어

```typescript
// lib/stores/auth.store.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

// lib/stores/notification.store.ts
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Notification) => void;
  markAsRead: (id: string) => void;
}

// lib/stores/chat.store.ts
interface ChatState {
  messages: Map<string, Message[]>;
  addMessage: (meetingId: string, msg: Message) => void;
}
```

### 7.2 React Query 사용

```typescript
// 모임 목록
const { data, isLoading } = useQuery({
  queryKey: ['meetings', filters],
  queryFn: () => meetingsApi.getList(filters)
});

// 모임 생성
const mutation = useMutation({
  mutationFn: meetingsApi.create,
  onSuccess: () => {
    queryClient.invalidateQueries(['meetings']);
  }
});
```

---

## 8. Podman 설정

### 8.1 podman-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: sommoim_postgres
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - backend_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: sommoim_redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - backend_network

  backend:
    build:
      context: ./backend
      dockerfile: Containerfile
    container_name: sommoim_backend
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - backend_network
      - frontend_network

  frontend:
    build:
      context: ./frontend
      dockerfile: Containerfile
    container_name: sommoim_frontend
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    ports:
      - "3001:3000"
    depends_on:
      - backend
    networks:
      - frontend_network

volumes:
  postgres_data:
  redis_data:

networks:
  backend_network:
  frontend_network:
```

### 8.2 Containerfile (Backend)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

RUN adduser -S nestjs
USER nestjs

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

---

## 9. 환경 변수

```env
# 애플리케이션
NODE_ENV=production
PORT=3000

# 데이터베이스
DATABASE_URL=postgresql://user:password@postgres:5432/sommoim
DB_NAME=sommoim
DB_USER=sommoim_user
DB_PASSWORD=strong_password

# Redis
REDIS_URL=redis://:password@redis:6379
REDIS_PASSWORD=redis_password

# JWT
JWT_SECRET=your-32-character-minimum-secret-key
JWT_EXPIRATION=24h
REFRESH_TOKEN_SECRET=another-32-character-secret-key
REFRESH_TOKEN_EXPIRATION=7d

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=account_id
CLOUDFLARE_ACCESS_KEY_ID=key_id
CLOUDFLARE_SECRET_ACCESS_KEY=secret_key
CLOUDFLARE_BUCKET_NAME=sommoim-images
R2_PUBLIC_URL=https://bucket.r2.dev

# URLs
FRONTEND_URL=https://sommoim.com
NEXT_PUBLIC_API_URL=https://api.sommoim.com

# 모니터링
SENTRY_DSN=https://...@sentry.io/...
```

---

## 10. 개발 일정 (12주)

### Phase 1: 기초 구축 (1.5주) ✅ 완료
- ✅ NestJS 프로젝트 초기화
- ✅ Prisma 스키마 작성 (17개 모델)
- ✅ Next.js 프론트엔드 초기화
- ✅ Auth 모듈 (회원가입, 로그인, JWT, httpOnly 쿠키)
- ✅ Podman 설정

### Phase 2: 코어 기능 (2.5주) 🔜 진행 예정
- 모임 CRUD
- 검색 & 필터링
- 참가 신청/승인
- R2 파일 업로드

### Phase 3: 확장 기능 (3주)
- 일정 관리
- Bull Queue 알림
- 리뷰/평점
- 신고/차단

### Phase 4: 관리자 (2주)
- 섹션/배너/카테고리 CRUD
- 대시보드

### Phase 5: 실시간 통신 (1.5주)
- Socket.IO 채팅
- 실시간 알림

### Phase 6: 폴리싱 (2주)
- 성능 최적화
- 테스트
- 배포

---

## 11. 구현 현황

### 11.1 백엔드 모듈

| 모듈 | 파일 | 상태 |
|------|------|------|
| Auth | `src/modules/auth/` | ✅ 완료 |
| Users | `src/modules/users/` | 🔜 예정 |
| Meetings | `src/modules/meetings/` | 🔜 예정 |
| Participants | `src/modules/participants/` | 🔜 예정 |
| Reviews | `src/modules/reviews/` | 🔜 예정 |
| Notifications | `src/modules/notifications/` | 🔜 예정 |
| Chat | `src/modules/chat/` | 🔜 예정 |
| Admin | `src/modules/admin/` | 🔜 예정 |
| Upload | `src/modules/upload/` | 🔜 예정 |

### 11.2 Auth 모듈 상세

```
backend/src/modules/auth/
├── auth.module.ts          # 모듈 정의
├── auth.controller.ts      # API 엔드포인트
├── auth.service.ts         # 비즈니스 로직
├── strategies/
│   └── jwt.strategy.ts     # JWT 검증 전략
├── guards/
│   ├── jwt-auth.guard.ts   # 인증 가드
│   └── roles.guard.ts      # 권한 가드
├── decorators/
│   ├── public.decorator.ts     # @Public()
│   ├── roles.decorator.ts      # @Roles()
│   └── current-user.decorator.ts # @CurrentUser()
└── dto/
    ├── register.dto.ts     # 회원가입 DTO
    └── login.dto.ts        # 로그인 DTO
```

### 11.3 Prisma 스키마

```
17개 모델 구현 완료:
- User, Profile, Follow
- Meeting, MeetingSchedule
- Participant, Review, Report
- UserBlock, Notification, ChatMessage
- Bookmark, PageSection, Banner
- CategoryEntity, ActivityLog
- RefreshToken, TokenBlacklist
- SystemSetting, UploadedFile
```

---

**관련 문서:**
- [PRD.md](./PRD.md) - 제품 요구사항
- [SECURITY.md](./SECURITY.md) - 보안 정책
