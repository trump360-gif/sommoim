# 소모임 플랫폼 (Sommoim) - TRD v4.0

**작성일:** 2025-12-13
**버전:** 4.0
**상태:** 개발 진행 중 (Phase 1-9 완료)

---

## 1. 기술 스택

### 1.1 프론트엔드

| 기술 | 버전 | 용도 | 상태 |
|------|------|------|------|
| Next.js | 14.x | App Router, SSR/SSG | ✅ 구현 |
| TypeScript | 5.x | 타입 안전성 | ✅ 구현 |
| React Query | 5.x | 서버 상태 관리 | ✅ 구현 |
| Zustand | 4.x | 클라이언트 상태 | ✅ 구현 |
| Socket.IO Client | 4.x | 실시간 통신 | ✅ 구현 |
| Tailwind CSS | 3.x | 스타일링 | ✅ 구현 |
| React Hook Form | 7.x | 폼 관리 | ✅ 구현 |
| Zod | 3.x | 스키마 검증 | ✅ 구현 |
| @dnd-kit | 6.x | 드래그앤드롭 | ✅ 구현 |
| Sonner | 2.x | 토스트 알림 | ✅ 구현 |
| Lucide React | - | 아이콘 | ✅ 구현 |
| browser-image-compression | 2.x | 클라이언트 이미지 압축 | ✅ 구현 |
| Framer Motion | 11.x | 애니메이션 | ✅ 구현 |

### 1.2 백엔드

| 기술 | 버전 | 용도 | 상태 |
|------|------|------|------|
| NestJS | 10.x | 프레임워크 | ✅ 구현 |
| TypeScript | 5.x | 타입 안전성 | ✅ 구현 |
| Prisma | 5.x | ORM | ✅ 구현 |
| PostgreSQL | 15.x | 메인 DB | ✅ 구현 |
| Redis | 7.x | 캐싱, 세션 | 🔜 예정 |
| Socket.IO | 4.x | WebSocket | ✅ 구현 |
| Passport | 0.7.x | 인증 | ✅ 구현 |

### 1.3 인프라

| 기술 | 용도 | 상태 |
|------|------|------|
| Podman | 컨테이너 (루트리스) | ✅ 구현 |
| Cloudflare R2 | 이미지 저장소 | 🔜 예정 |
| Fly.io | 배포 (서울 리전) | 🔜 예정 |
| GitHub Actions | CI/CD | 🔜 예정 |

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
          │    Port: 5434     │  │   Port: 6379    │  │   (이미지 저장)   │
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

## 3. 데이터베이스 스키마

### 3.1 ERD 개요

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
Meeting ──1:N──▶ MeetingActivity

MeetingActivity ──1:N──▶ ActivityImage

User ──M:N──▶ User (Follow)
User ──M:N──▶ User (Block)
User ──M:N──▶ Meeting (Bookmark)
```

### 3.2 주요 테이블 (22개 모델)

#### User & Profile
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

  profile       Profile?
  meetings      Meeting[]
  participants  Participant[]
  reviews       Review[]
  notifications Notification[]
  // ... relations
}

model Profile {
  id        String     @id @default(cuid())
  userId    String     @unique
  avatarUrl String?
  bio       String?
  interests Category[] // 관심사 카테고리 배열
  user      User       @relation(fields: [userId], references: [id])
}
```

#### Meeting & Schedule
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
  viewCount       Int           @default(0)
  hostId          String
  deletedAt       DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  host          User             @relation(fields: [hostId], references: [id])
  schedules     MeetingSchedule[]
  participants  Participant[]
  reviews       Review[]
  activities    MeetingActivity[]
  // ... relations
}

model MeetingSchedule {
  id        String   @id @default(cuid())
  meetingId String
  startTime DateTime
  endTime   DateTime
  location  String?
  note      String?
  meeting   Meeting  @relation(fields: [meetingId], references: [id])
}
```

#### Activity & Images (신규)
```prisma
model MeetingActivity {
  id          String   @id @default(cuid())
  meetingId   String
  title       String
  description String?
  date        DateTime
  location    String?
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  meeting Meeting         @relation(fields: [meetingId], references: [id])
  images  ActivityImage[]

  @@index([meetingId])
  @@index([date])
}

model ActivityImage {
  id           String   @id @default(cuid())
  activityId   String
  imageUrl     String
  caption      String?
  order        Int      @default(0)
  uploadedById String
  createdAt    DateTime @default(now())

  activity MeetingActivity @relation(fields: [activityId], references: [id])

  @@index([activityId])
}
```

#### Admin Models
```prisma
model PageSection {
  id         String   @id @default(cuid())
  type       String
  title      String?
  layoutJson Json     @default("{}")
  order      Int      @default(0)
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model Banner {
  id         String    @id @default(cuid())
  imageUrl   String
  linkUrl    String?
  order      Int       @default(0)
  isActive   Boolean   @default(true)
  startDate  DateTime?
  endDate    DateTime?
  clickCount Int       @default(0)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}

model CategoryEntity {
  id        String   @id @default(cuid())
  name      String   @unique
  icon      String?
  color     String?
  order     Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Staff & Join Questions (신규)
```prisma
model MeetingStaff {
  id          String           @id @default(cuid())
  meetingId   String
  userId      String
  role        StaffRole        @default(STAFF)
  permissions StaffPermission[]
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  meeting     Meeting          @relation(fields: [meetingId], references: [id])
  user        User             @relation(fields: [userId], references: [id])

  @@unique([meetingId, userId])
}

enum StaffRole {
  CO_HOST    // 공동호스트
  MANAGER    // 매니저
  STAFF      // 스태프
}

enum StaffPermission {
  MANAGE_EVENTS
  MANAGE_SCHEDULES
  MANAGE_ACTIVITIES
  MANAGE_MEMBERS
  MANAGE_CHAT
  VIEW_STATS
}

model JoinQuestion {
  id         String      @id @default(cuid())
  meetingId  String
  question   String
  isRequired Boolean     @default(true)
  order      Int         @default(0)
  createdAt  DateTime    @default(now())

  meeting    Meeting     @relation(fields: [meetingId], references: [id])
  answers    JoinAnswer[]
}

model JoinAnswer {
  id            String       @id @default(cuid())
  questionId    String
  participantId String
  answer        String
  createdAt     DateTime     @default(now())

  question      JoinQuestion @relation(fields: [questionId], references: [id])
  participant   Participant  @relation(fields: [participantId], references: [id])
}
```

### 3.3 인덱스 전략

```prisma
// 자주 조회되는 필드
@@index([email])           // User
@@index([hostId])          // Meeting
@@index([category])        // Meeting
@@index([status])          // Meeting, Participant
@@index([meetingId])       // Participant, Review, ChatMessage, Activity
@@index([userId])          // Participant, Review, Notification
@@index([createdAt])       // 정렬용
@@index([deletedAt])       // 소프트 삭제 필터
@@index([date])            // MeetingActivity
@@index([activityId])      // ActivityImage
```

---

## 4. API 명세

### 4.1 응답 형식

#### 성공 응답
```typescript
// 단일 객체
{
  "id": "...",
  "title": "...",
  // ... fields
}

// 목록 (페이지네이션)
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

#### 에러 응답
```typescript
{
  "statusCode": 400,
  "message": "이메일 형식이 올바르지 않습니다",
  "error": "Bad Request"
}
```

### 4.2 구현된 API 엔드포인트 (80개+)

#### 인증 (7개) ✅
```
POST   /api/auth/register              - 회원가입
POST   /api/auth/login                 - 로그인
POST   /api/auth/logout                - 로그아웃
POST   /api/auth/refresh               - 토큰 갱신
GET    /api/auth/me                    - 내 정보 조회
POST   /api/auth/password-reset        - 비밀번호 재설정 요청
POST   /api/auth/password-reset/confirm - 비밀번호 재설정 확인
```

#### 모임 (16개) ✅
```
POST   /api/meetings                           - 모임 생성
GET    /api/meetings                           - 모임 목록
GET    /api/meetings/:id                       - 모임 상세
PUT    /api/meetings/:id                       - 모임 수정
DELETE /api/meetings/:id                       - 모임 삭제
POST   /api/meetings/:id/cancel                - 모임 취소
POST   /api/meetings/:id/schedules             - 일정 추가
PUT    /api/meetings/schedules/:sid            - 일정 수정
DELETE /api/meetings/schedules/:sid            - 일정 삭제
POST   /api/meetings/:id/bookmark              - 북마크
DELETE /api/meetings/:id/bookmark              - 북마크 취소
GET    /api/meetings/:id/activities            - 활동 목록
POST   /api/meetings/:id/activities            - 활동 생성
PUT    /api/meetings/activities/:activityId    - 활동 수정
DELETE /api/meetings/activities/:activityId    - 활동 삭제
POST   /api/meetings/activities/:id/images     - 활동 이미지 추가
DELETE /api/meetings/activities/images/:id     - 활동 이미지 삭제
```

#### 참가 (7개) ✅
```
POST   /api/meetings/:id/participants          - 참가 신청
GET    /api/meetings/:id/participants          - 참가자 목록
PUT    /api/participants/:id/approve           - 승인
PUT    /api/participants/:id/reject            - 거절
DELETE /api/participants/:id                   - 강퇴
DELETE /api/participants/:id/withdraw          - 탈퇴 (사유 포함)
POST   /api/activities/:id/attendance          - 활동 출석체크
```

#### 리뷰 (4개) ✅
```
POST   /api/meetings/:id/reviews  - 리뷰 작성
GET    /api/meetings/:id/reviews  - 리뷰 목록
PUT    /api/reviews/:id           - 리뷰 수정
DELETE /api/reviews/:id           - 리뷰 삭제
```

#### 알림 (5개) ✅
```
GET    /api/notifications              - 알림 목록
GET    /api/notifications/unread       - 읽지 않은 알림 조회
PUT    /api/notifications/:id/read     - 읽음 표시
PUT    /api/notifications/read-all     - 모두 읽음
DELETE /api/notifications/:id          - 알림 삭제
```

#### 신고/차단 (4개) ✅
```
POST   /api/reports          - 신고하기
POST   /api/users/:id/block  - 사용자 차단
DELETE /api/users/:id/block  - 차단 해제
GET    /api/users/me/blocked - 차단 목록
```

#### 팔로우 (4개) ✅
```
POST   /api/users/:id/follow     - 팔로우
DELETE /api/users/:id/follow     - 언팔로우
GET    /api/users/:id/followers  - 팔로워 목록
GET    /api/users/:id/following  - 팔로잉 목록
```

#### 운영진 (5개) ✅
```
GET    /api/meetings/:id/staff            - 운영진 목록
POST   /api/meetings/:id/staff            - 운영진 추가
PUT    /api/meetings/:id/staff/:userId    - 운영진 수정
DELETE /api/meetings/:id/staff/:userId    - 운영진 삭제
GET    /api/meetings/:id/my-role          - 내 역할 조회
```

#### 가입 질문 (8개) ✅
```
GET    /api/meetings/:id/join-questions         - 질문 목록
POST   /api/meetings/:id/join-questions         - 질문 생성
PUT    /api/meetings/join-questions/:id         - 질문 수정
DELETE /api/meetings/join-questions/:id         - 질문 삭제
POST   /api/meetings/:id/apply                  - 가입 신청
GET    /api/meetings/:id/applications           - 신청 목록
PUT    /api/meetings/applications/:id/review    - 신청 심사
POST   /api/meetings/:id/applications/bulk      - 일괄 심사
```

#### 추천 (4개) ✅
```
GET    /api/meetings/recommended      - 맞춤 추천
GET    /api/meetings/popular          - 인기 모임
GET    /api/meetings/nearby           - 근처 모임
GET    /api/meetings/category/:cat    - 카테고리별
```

#### 채팅 (3개 + WebSocket) ✅
```
GET    /api/meetings/:id/chats  - 메시지 조회
POST   /api/meetings/:id/chats  - 메시지 전송
DELETE /api/chats/:messageId    - 메시지 삭제

WebSocket Events:
- connect    : 연결 (JWT 인증)
- join       : 채팅방 입장
- leave      : 채팅방 퇴장
- message    : 메시지 전송
- message:new: 새 메시지 수신
```

#### 관리자 (25개) ✅
```
# 대시보드
GET    /api/admin/dashboard             - 통계 조회

# 섹션
GET    /api/admin/page-sections         - 목록
POST   /api/admin/page-sections         - 생성
PUT    /api/admin/page-sections/:id     - 수정
DELETE /api/admin/page-sections/:id     - 삭제
PUT    /api/admin/page-sections/reorder - 정렬

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

# 사용자
GET    /api/admin/users                 - 목록
PUT    /api/admin/users/:id/role        - 역할 변경
DELETE /api/admin/users/:id             - 삭제

# 모임
GET    /api/admin/meetings              - 목록
DELETE /api/admin/meetings/:id          - 삭제

# 신고
GET    /api/admin/reports               - 목록
PUT    /api/admin/reports/:id           - 상태 변경

# 파일 관리
GET    /api/admin/files                 - 파일 목록
GET    /api/admin/files/stats           - 파일 통계
DELETE /api/admin/files/:id             - 파일 삭제

# 활동 로그
GET    /api/admin/logs                  - 로그 목록

# 시스템 설정
GET    /api/admin/settings              - 설정 조회
PUT    /api/admin/settings              - 설정 저장
```

#### 공개 API (3개) ✅
```
GET    /api/admin/public/sections      - 활성 섹션
GET    /api/admin/public/banners       - 활성 배너 (기간 필터)
GET    /api/admin/public/categories    - 활성 카테고리
```

---

## 5. 폴더 구조

### 5.1 백엔드

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/              ✅ 완료
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/jwt.strategy.ts
│   │   │   ├── guards/
│   │   │   ├── decorators/
│   │   │   └── dto/
│   │   │
│   │   ├── meeting/           ✅ 완료
│   │   │   ├── meeting.module.ts
│   │   │   ├── meeting.controller.ts
│   │   │   ├── meeting.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── participant/       ✅ 완료
│   │   │   ├── participant.module.ts
│   │   │   ├── participant.controller.ts
│   │   │   └── participant.service.ts
│   │   │
│   │   ├── notification/      ✅ 완료
│   │   │   ├── notification.module.ts
│   │   │   ├── notification.controller.ts
│   │   │   └── notification.service.ts
│   │   │
│   │   ├── report/            ✅ 완료
│   │   │   ├── report.module.ts
│   │   │   ├── report.controller.ts
│   │   │   └── report.service.ts
│   │   │
│   │   ├── chat/              ✅ 완료
│   │   │   ├── chat.module.ts
│   │   │   ├── chat.controller.ts
│   │   │   ├── chat.service.ts
│   │   │   └── chat.gateway.ts
│   │   │
│   │   └── admin/             ✅ 완료
│   │       ├── admin.module.ts
│   │       ├── admin.controller.ts
│   │       ├── admin.service.ts
│   │       └── dto/
│   │
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   └── interceptors/
│   │
│   ├── prisma/
│   │   └── prisma.service.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── prisma/
│   ├── schema.prisma          ✅ 19개 모델
│   └── seed.ts
│
└── package.json
```

### 5.2 프론트엔드

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx         ✅
│   │   ├── page.tsx           ✅ 홈 (배너/카테고리 연동)
│   │   ├── providers.tsx      ✅
│   │   │
│   │   ├── login/             ✅
│   │   ├── register/          ✅
│   │   │
│   │   ├── meetings/
│   │   │   ├── page.tsx       ✅ 목록
│   │   │   ├── create/        ✅ 생성
│   │   │   └── [id]/
│   │   │       ├── page.tsx   ✅ 상세 (탭: 정보/활동/리뷰)
│   │   │       ├── edit/      ✅ 수정
│   │   │       └── chat/      ✅ 채팅
│   │   │
│   │   ├── profile/
│   │   │   ├── page.tsx       ✅ 내 프로필
│   │   │   ├── edit/          ✅ 프로필 수정
│   │   │   └── [id]/          ✅ 타인 프로필
│   │   │
│   │   ├── notifications/     ✅
│   │   ├── bookmarks/         ✅
│   │   │
│   │   └── admin/
│   │       ├── page.tsx       ✅ 대시보드
│   │       ├── sections/      ✅
│   │       ├── banners/       ✅
│   │       ├── categories/    ✅
│   │       ├── users/         ✅
│   │       ├── meetings/      ✅
│   │       └── reports/       ✅
│   │
│   ├── components/
│   │   ├── ui/                ✅ 공통 UI 컴포넌트
│   │   │   └── image-uploader.tsx   ✅ 드래그앤드롭 업로더
│   │   ├── layout/            ✅ Header, Footer
│   │   ├── meeting/
│   │   │   ├── meeting-card.tsx     ✅
│   │   │   ├── activity-list.tsx    ✅ 활동 목록
│   │   │   └── image-gallery.tsx    ✅ 이미지 갤러리
│   │   └── admin/             ✅ 관리자 컴포넌트
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts      ✅ Axios 클라이언트
│   │   │   ├── auth.ts        ✅
│   │   │   ├── meetings.ts    ✅
│   │   │   ├── activities.ts  ✅ 활동 API
│   │   │   ├── admin.ts       ✅ 관리자 + 공개 API
│   │   │   └── upload.ts      ✅
│   │   └── utils/             ✅
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx    ✅
│   │
│   └── types/                 ✅
│
└── package.json
```

---

## 6. 상태 관리

### 6.1 AuthContext

```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}
```

### 6.2 React Query 패턴

```typescript
// 모임 목록
const { data, isLoading } = useQuery({
  queryKey: ['meetings', filters],
  queryFn: () => meetingsApi.getAll(filters)
});

// 모임 생성
const mutation = useMutation({
  mutationFn: meetingsApi.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['meetings'] });
  }
});

// 관리자 배너/카테고리
const { data: banners } = useQuery({
  queryKey: ['public', 'banners'],
  queryFn: () => adminApi.getPublicBanners(),
});
```

---

## 7. 실시간 통신

### 7.1 Socket.IO 설정

```typescript
// chat.gateway.ts
@WebSocketGateway({
  namespace: 'chat',
  cors: { origin: '*', credentials: true }
})
export class ChatGateway {
  @SubscribeMessage('join')
  handleJoin(client: Socket, meetingId: string) { ... }

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: MessageDto) { ... }
}
```

### 7.2 클라이언트 연결

```typescript
// Socket.IO 클라이언트
const socket = io('/chat', {
  auth: { token: accessToken }
});

socket.emit('join', meetingId);
socket.on('message:new', handleNewMessage);
```

---

## 8. 개발 일정

### Phase 1: 기초 구축 (1.5주) ✅ 완료
- ✅ NestJS 프로젝트 초기화
- ✅ Prisma 스키마 작성
- ✅ Next.js 프론트엔드 초기화
- ✅ Auth 모듈 (JWT, httpOnly 쿠키)
- ✅ Podman 설정

### Phase 2: 코어 기능 (2.5주) ✅ 완료
- ✅ 모임 CRUD
- ✅ 검색 & 필터링
- ✅ 참가 신청/승인
- ✅ 파일 업로드

### Phase 3: 확장 기능 (3주) ✅ 완료
- ✅ 일정 관리
- ✅ 알림 시스템
- ✅ 리뷰/평점
- ✅ 신고/차단

### Phase 4: 관리자 (2주) ✅ 완료
- ✅ 섹션/배너/카테고리 CRUD
- ✅ 대시보드
- ✅ 사용자/모임/신고 관리
- ✅ 공개 API (홈페이지 연동)

### Phase 5: 실시간 통신 (1.5주) ✅ 완료
- ✅ Socket.IO 채팅
- ✅ 실시간 메시지

### Phase 6: 추가 기능 ✅ 완료
- ✅ 모임 활동 기록
- ✅ 활동 이미지 갤러리
- ✅ 프로필 수정
- ✅ 북마크 페이지
- ✅ 모임 수정
- ✅ 활동 출석체크 및 캘린더
- ✅ 관리자 히어로 색상/이미지 편집
- ✅ 드래그앤드롭 이미지 업로더
- ✅ 관리자 시드 데이터 (섹션/배너)
- ✅ 참가자 탈퇴 기능 (사유 입력)
- ✅ 헤더 알림 드롭다운 UI
- ✅ 알림 자동 폴링 (30초 간격)
- ✅ 관리자 대시보드 UI 개선 (통계 카드, 빠른 액션, 최근 신고)
- ✅ 사용자 관리 정렬 기능 (닉네임/이메일/권한/가입일)
- ✅ 관리자 사이드바 Lucide 아이콘 적용
- ✅ 토스트 알림 시스템 (sonner) 도입
- ✅ 드래그앤드롭 정렬 (dnd-kit) 도입
- ✅ 로그인/회원가입 페이지 UI 개선
- ✅ 마이페이지 기능 확장

### Phase 7: 소셜 & 관리 기능 ✅ 완료
- ✅ 운영진 권한 관리 (역할: CO_HOST/MANAGER/STAFF)
- ✅ 운영진 권한 설정 (일정/활동/회원/채팅/통계)
- ✅ 가입 질문 관리 (CRUD, 필수/선택)
- ✅ 가입 신청 심사 (개별/일괄 승인/거절)
- ✅ 관심사 설정 (프로필에서 카테고리 선택)
- ✅ 관심사 기반 모임 추천 시스템
- ✅ 차단 관리 페이지 (마이페이지)
- ✅ 팔로우 시스템 (팔로우/언팔로우/목록)
- ✅ 홈페이지 맞춤 추천 섹션

### Phase 8: 인프라 & 관리 기능 ✅ 완료
- ✅ 비밀번호 재설정 (6자리 인증코드, 3단계 플로우)
- ✅ 클라이언트 이미지 압축 (browser-image-compression)
- ✅ 관리자 파일 관리 (목록/통계/삭제, 리스트/그리드 뷰)
- ✅ 관리자 활동 로그 (액션 필터, 검색)
- ✅ 관리자 시스템 설정 (일반/알림/보안/이메일/DB)
- ✅ 채팅 API 경로 정규화

### Phase 9: UI/UX 개선 ✅ 완료
- ✅ 메인 페이지 섹션 순서 동적 반영
- ✅ 관리자 사이드바 한글화 (ADMIN → 관리자)
- ✅ 배너 이미지 제거 시 null 처리 로직 수정
- ✅ 이미지 업로더 URL 직접 입력 기능 추가
- ✅ Framer Motion 애니메이션 컴포넌트 (FadeIn, SlideUp, ScrollReveal, CountUp)
- ✅ 모바일 네비게이션 (Sheet + MobileNav)
- ✅ 히어로 섹션 분리 및 배경 애니메이션
- ✅ 통계 섹션 (StatsSection) - 카운트업 애니메이션
- ✅ 인기 모임 섹션 (TrendingSection)
- ✅ 최근 활동 섹션 (RecentActivitySection)
- ✅ 사이드바 섹션별 동적 네비게이션 (API 연동)
- ✅ 코드 리팩토링 (shared 모듈, 컴포넌트 분리)
- ✅ 마이페이지 확장 (내 모임, 캘린더 API 연동, 알림 설정)
- ✅ 모임 상세 페이지 북마크 버튼 추가
- ✅ 헤더 메가메뉴 실제 데이터 연동 (참여 모임/북마크 수)
- ✅ 계정 전환 시 React Query 캐시 초기화
- ✅ 최근 활동 섹션 빈 상태 UI 개선

### Phase 10: 폴리싱 🔜 예정
- 🔜 Cloudflare R2 스토리지 연동
- 🔜 이메일 인증
- 🔜 성능 최적화
- 🔜 테스트
- 🔜 배포

---

## 9. 환경 변수

```env
# 백엔드
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://sommoim:sommoim@localhost:5434/sommoim
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h
REFRESH_TOKEN_SECRET=refresh-secret
REFRESH_TOKEN_EXPIRATION=7d
FRONTEND_URL=http://localhost:3001

# 프론트엔드
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

## 10. 구현 현황 요약

### 10.1 백엔드 모듈

| 모듈 | 파일 | 상태 |
|------|------|------|
| Auth | `src/modules/auth/` | ✅ 완료 |
| Meeting | `src/modules/meeting/` | ✅ 완료 |
| Participant | `src/modules/participant/` | ✅ 완료 |
| Notification | `src/modules/notification/` | ✅ 완료 |
| Report | `src/modules/report/` | ✅ 완료 |
| Chat | `src/modules/chat/` | ✅ 완료 |
| Admin | `src/modules/admin/` | ✅ 완료 |

### 10.2 Prisma 스키마

```
23개 모델 구현 완료:
- User, Profile, Follow
- Meeting, MeetingSchedule
- MeetingActivity, ActivityImage
- MeetingStaff (운영진)
- JoinQuestion, JoinAnswer (가입 질문)
- Participant, Review, Report
- UserBlock, Notification, ChatMessage
- Bookmark, PageSection, Banner
- CategoryEntity, ActivityLog
- RefreshToken, TokenBlacklist
- SystemSetting, UploadedFile
- PasswordResetToken (비밀번호 재설정)
```

### 10.3 프론트엔드 페이지

| 페이지 | 경로 | 상태 |
|--------|------|------|
| 홈 | `/` | ✅ 완료 |
| 로그인 | `/login` | ✅ 완료 |
| 회원가입 | `/register` | ✅ 완료 |
| 모임 목록 | `/meetings` | ✅ 완료 |
| 모임 생성 | `/meetings/create` | ✅ 완료 |
| 모임 상세 | `/meetings/[id]` | ✅ 완료 |
| 모임 수정 | `/meetings/[id]/edit` | ✅ 완료 |
| 모임 채팅 | `/meetings/[id]/chat` | ✅ 완료 |
| 마이페이지 | `/mypage` | ✅ 완료 |
| 프로필 수정 | `/mypage/edit` | ✅ 완료 |
| 내 모임 | `/mypage/meetings` | ✅ 완료 |
| 내 일정 | `/mypage/calendar` | ✅ 완료 |
| 팔로워/팔로잉 | `/mypage/followers` | ✅ 완료 |
| 알림 설정 | `/mypage/notifications` | ✅ 완료 |
| 차단 관리 | `/mypage/blocked` | ✅ 완료 |
| 타인 프로필 | `/profile/[id]` | ✅ 완료 |
| 알림 | `/notifications` | ✅ 완료 |
| 북마크 | `/bookmarks` | ✅ 완료 |
| 관리자 | `/admin/*` | ✅ 완료 |
| 비밀번호 찾기 | `/auth/forgot-password` | ✅ 완료 |
| 파일 관리 | `/admin/files` | ✅ 완료 |
| 활동 로그 | `/admin/logs` | ✅ 완료 |
| 시스템 설정 | `/admin/settings` | ✅ 완료 |

---

**관련 문서:**
- [PRD.md](./PRD.md) - 제품 요구사항
- [SECURITY.md](./SECURITY.md) - 보안 정책
