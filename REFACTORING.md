# Sommoim 모듈화 리팩터링 가이드

## 현재 문제점 요약

| 문제 | 파일 | 상태 |
|------|------|------|
| 500줄 초과 | event-list.tsx (695줄) | 분리 필요 |
| 500줄 초과 | staff-management.tsx (597줄) | 분리 필요 |
| 중복 코드 | formatDate 함수 3곳 | 통합 필요 |
| 중복 코드 | categoryLabels, statusLabels 2곳 | 통합 필요 |
| 중복 컴포넌트 | EventList 2개 존재 | 통합 필요 |
| 유사 컴포넌트 | ImageUpload vs ImageUploader | 정리 필요 |
| 부재 | shared/ 디렉토리 | 생성 필요 |

---

## 개선 작업

### 1. event-list.tsx 분리 (695줄 → 5개 파일)

**현재:** `src/components/meeting/event-list.tsx`

**분리 후:**
```
src/components/meeting/event-list/
├── index.tsx (메인 컴포넌트 - ~150줄)
├── event-filters.tsx (필터 UI - ~100줄)
├── event-modal.tsx (생성/수정 모달 - ~150줄)
├── event-card.tsx (카드 렌더러 - ~100줄)
└── use-events.ts (훅 추출 - ~50줄)
```

---

### 2. staff-management.tsx 분리 (597줄 → 5개 파일)

**현재:** `src/components/meeting/staff-management.tsx`

**분리 후:**
```
src/components/meeting/staff-management/
├── index.tsx (메인 컴포넌트 - ~100줄)
├── staff-list.tsx (리스트 표시 - ~150줄)
├── add-staff-modal.tsx (스태프 추가 폼 - ~150줄)
├── staff-card.tsx (스태프 아이템 - ~100줄)
└── use-staff.ts (훅 추출 - ~50줄)
```

---

### 3. formatDate 함수 통합

**중복 위치:**
- `src/lib/utils.ts` (기본)
- `src/app/meetings/[id]/_components/constants.ts` (변형)
- `src/components/meeting/event-list.tsx` (내부 정의)

**작업:**
1. `src/lib/utils/format.ts` 생성
2. 모든 포맷 함수 통합

```typescript
// src/lib/utils/format.ts
export function formatDate(date: Date | string, options?: {
  includeWeekday?: boolean;
  includeTime?: boolean;
}): string { ... }

export function formatEventDate(dateStr: string): {
  month: string;
  day: number;
  weekday: string;
  time: string;
} { ... }
```

3. 기존 위치에서 삭제 후 import 변경

---

### 4. Constants 통합

**중복 위치:**
- `src/app/meetings/[id]/_components/constants.ts`
- `src/components/meeting/meeting-card.tsx` (내부)
- `src/components/meeting/event-list.tsx` (내부)

**작업:**
1. `src/lib/constants.ts` 생성 (또는 `src/shared/constants/index.ts`)

```typescript
// src/lib/constants.ts
export const CATEGORY_LABELS: Record<string, string> = {
  SPORTS: '운동',
  GAMES: '게임',
  FOOD: '음식',
  CULTURE: '문화',
  TRAVEL: '여행',
  STUDY: '학습',
};

export const STATUS_LABELS: Record<string, string> = {
  RECRUITING: '모집중',
  ONGOING: '진행중',
  COMPLETED: '완료',
  CANCELLED: '취소됨',
};

export const EVENT_TYPE_LABELS: Record<string, string> = { ... };
```

2. 기존 위치에서 삭제 후 import 변경

---

### 5. EventList 중복 제거

**현재 2개 존재:**
- `src/components/meeting/event-list.tsx` (695줄) - 공유 버전
- `src/app/meetings/[id]/_components/event-list.tsx` (273줄) - 페이지 전용

**작업:**
1. 페이지 전용 버전 삭제
2. 공유 버전만 사용하도록 import 경로 수정

```typescript
// 변경 전
import { EventList } from './_components/event-list';

// 변경 후
import { EventList } from '@/components/meeting/event-list';
```

---

### 6. ImageUpload 정리

**현재 2개 존재:**
- `src/components/ui/image-upload.tsx` (292줄) - URL 입력 지원
- `src/components/ui/image-uploader.tsx` (208줄) - 파일 업로드 전문

**선택지:**

**A. 통합 (권장)**
```typescript
// src/components/ui/image-upload.tsx
interface ImageUploadProps {
  urlInputEnabled?: boolean;  // URL 입력 허용 여부
  // ... 나머지 props
}
```

**B. 분리 유지 시 목적 명확화**
- `image-upload.tsx` → 기본 (URL + 파일)
- `image-uploader.tsx` → 고급 (압축, 비율 조정)

---

### 7. shared/ 디렉토리 생성

**생성:**
```
src/shared/
├── index.ts (re-export)
├── constants/
│   ├── index.ts
│   ├── category.ts
│   ├── status.ts
│   └── labels.ts
├── utils/
│   ├── index.ts
│   ├── format.ts
│   └── date.ts
└── hooks/
    ├── index.ts
    ├── use-event-list.ts
    └── use-image-upload.ts
```

**index.ts:**
```typescript
// src/shared/index.ts
export * from './constants';
export * from './utils';
export * from './hooks';
```

**사용 예시:**
```typescript
// Before
import { categoryLabels } from '@/app/meetings/[id]/_components/constants';
import { formatDate } from '@/lib/utils';

// After
import { categoryLabels, formatDate } from '@/shared';
```

---

## 작업 순서 (권장)

1. formatDate 함수 통합 (다른 작업의 의존성)
2. Constants 통합
3. EventList 중복 제거
4. event-list.tsx 분리 (695줄)
5. staff-management.tsx 분리 (597줄)
6. ImageUpload 정리
7. shared/ 디렉토리 생성 + index.ts

---

## 모듈화 규칙 (작업 시 참고)

- 여러 페이지에서 사용 → shared/ 또는 components/
- 한 페이지에서만 사용 → 해당 페이지 _components/에 포함
- 동일 코드 2곳 이상 → shared/로 이동
- 파일 500줄 초과 시 분리
- shared/index.ts에서 모든 공통 모듈 re-export
- 수정 전 shared/index.ts 확인
