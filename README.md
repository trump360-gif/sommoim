# 소모임 (Sommoim)

관심사가 비슷한 사람들과 모임을 만들고 참여할 수 있는 플랫폼

## 기술 스택

### Backend
- NestJS 10
- Prisma ORM
- PostgreSQL 15
- Redis 7

### Frontend
- Next.js 14 (App Router)
- TypeScript
- React Query (TanStack Query)
- Zustand
- Tailwind CSS

### Infrastructure
- Podman (Rootless Container)
- Cloudflare R2 (File Storage)

## 시작하기

### 요구 사항
- Node.js 20+
- Podman 4.0+
- podman-compose

### 개발 환경 실행

```bash
# 컨테이너 실행
podman-compose up -d

# 백엔드 개발 서버
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev

# 프론트엔드 개발 서버
cd frontend
npm install
npm run dev
```

### 환경 변수

`.env.example`을 참조하여 `.env` 파일을 생성하세요.

## 프로젝트 구조

```
sommoim/
├── backend/           # NestJS 백엔드
│   ├── src/
│   │   ├── modules/   # 기능별 모듈
│   │   ├── common/    # 공통 유틸리티
│   │   └── prisma/    # Prisma 서비스
│   └── prisma/        # 스키마 및 마이그레이션
├── frontend/          # Next.js 프론트엔드
│   └── src/
│       ├── app/       # App Router 페이지
│       ├── components/# React 컴포넌트
│       ├── hooks/     # Custom Hooks
│       ├── stores/    # Zustand 스토어
│       └── types/     # TypeScript 타입
└── docs/              # 문서
```

## 개발 규칙

- 모든 함수/메서드/컴포넌트는 500자 이내로 작성
- 커밋 메시지는 conventional commits 형식 준수
- PR 생성 시 코드 리뷰 필수

## 라이선스

MIT
