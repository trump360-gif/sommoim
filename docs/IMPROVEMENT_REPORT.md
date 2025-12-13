# Sommoim 프로젝트 개선 리포트

**작성일**: 2025-12-12
**버전**: v3.9

---

## 1. Community vs Sommoim 관리자 기능 비교 분석

### 1.1 관리자 레이아웃 비교

| 기능 | Community | Sommoim | 적용 필요 |
|------|-----------|---------|----------|
| 모바일 사이드바 (햄버거 메뉴) | ✅ 완전 구현 | ❌ 없음 | ⭐ 우선 |
| 사이드바 접힘/펼침 | ✅ 모바일에서 오버레이 | ❌ 없음 | ⭐ 우선 |
| 메뉴 배지 (알림 카운트) | ✅ badge 속성 지원 | ❌ 없음 | ⭐ 우선 |
| 다크모드 지원 | ✅ 완전 지원 | ❌ 없음 | 중간 |
| 사이트로 돌아가기 버튼 | ✅ 있음 | ❌ 없음 | ⭐ 우선 |
| 로딩 상태 UI | ✅ 스피너 + 텍스트 | ⚠️ 기본적 | 중간 |
| 섹션 그룹핑 | ⚠️ 단일 리스트 | ✅ 3개 섹션으로 구분 | 유지 |

### 1.2 대시보드 비교

| 기능 | Community | Sommoim | 적용 필요 |
|------|-----------|---------|----------|
| 통계 카드 | ✅ AdminStatCard (variant, trend) | ⚠️ 기본 카드 | ⭐ 우선 |
| 트렌드 표시 (↑↓) | ✅ TrendingUp/Down 아이콘 | ❌ 없음 | ⭐ 우선 |
| 차트 (Recharts) | ✅ 다양한 차트 (Area, Pie, Line) | ❌ 없음 | ⭐ 우선 |
| 최근 신고 알림 | ✅ 대기 신고 배너 + 리스트 | ⚠️ 기본 리스트 | 중간 |
| 시스템 정보 | ✅ 버전, DB, 캐시 정보 | ❌ 없음 | 낮음 |
| 클릭 가능한 통계 카드 | ✅ href로 해당 페이지 이동 | ❌ 없음 | 중간 |

### 1.3 CMS / 배너 관리 비교

| 기능 | Community | Sommoim | 적용 필요 |
|------|-----------|---------|----------|
| 탭 기반 CMS 관리 | ✅ AdminTabs (underline, pills, buttons) | ⚠️ 기본 탭 | ⭐ 우선 |
| 배너 순서 변경 (↑↓) | ✅ moveBanner | ✅ 있음 | 유지 |
| 배너 미리보기 | ✅ 실시간 프리뷰 | ✅ 있음 | 유지 |
| 배너 색상 피커 | ✅ input type="color" + hex | ✅ 있음 | 유지 |
| 히어로 버튼 커스터마이징 | ✅ buttonLabel, buttonUrl | ⚠️ 제한적 | 중간 |
| 배너 활성화/비활성화 토글 | ✅ Eye/EyeOff | ✅ 있음 | 유지 |

### 1.4 재사용 컴포넌트 비교

| 컴포넌트 | Community | Sommoim | 적용 필요 |
|----------|-----------|---------|----------|
| AdminTabs | ✅ 3가지 variant (underline, pills, buttons) | ❌ 없음 | ⭐ 우선 |
| AdminTable | ✅ 정렬, 검색, 로딩 상태 | ❌ 없음 | ⭐ 우선 |
| AdminStatCard | ✅ variant, trend, href | ❌ 없음 | ⭐ 우선 |
| AdminModal | ✅ 일반 + ConfirmModal | ⚠️ 기본 | 중간 |
| AdminPagination | ✅ 있음 | ⚠️ 기본 | 중간 |
| AdminToast | ✅ ToastProvider + useToast | ⚠️ 없음 | 중간 |
| AnalyticsCharts | ✅ Recharts 기반 | ❌ 없음 | ⭐ 우선 |

### 1.5 메인 페이지 비교

| 기능 | Community | Sommoim | 적용 필요 |
|------|-----------|---------|----------|
| 히어로 섹션 | ✅ 동적 버튼 배열 지원 | ⚠️ 2개 고정 버튼 | 중간 |
| 인기글/최신글 분리 | ✅ 2컬럼 레이아웃 | ⚠️ 단일 섹션 | ⭐ 우선 |
| 갤러리 그리드 | ✅ 최근 글 포함 카드 | ❌ 없음 (모임 카드만) | 다름 |
| 공지사항 섹션 | ✅ 별도 공지 영역 | ❌ 없음 | 중간 |
| 상대 시간 표시 | ✅ date-fns formatDistanceToNow | ⚠️ 기본 | 중간 |

---

## 2. 5대 개선 우선순위 상세 계획

### P0-1: 히어로 섹션 강화

**현재 문제점**:
- 고정된 2개 버튼 (모임 찾아보기, 모임 만들기)
- 정적인 그라디언트 배경
- 시각적 임팩트 부족

**Community에서 참고할 점**:
- 동적 버튼 배열 (`buttons: HeroButton[]`)
- 배경 데코레이션 (원형 도형)
- 버튼 variant 지원 (primary, secondary)

**구현 계획**:
```
📁 frontend/src/components/home/HeroSection.tsx (신규)
├── HeroBannerProps 타입 정의
├── 동적 버튼 렌더링
├── 배경 애니메이션 (Framer Motion)
├── 그라디언트 오버레이 개선
└── 모바일 반응형 최적화

📁 frontend/src/app/admin/sections/hero-editor.tsx (신규)
├── 히어로 버튼 CRUD
├── 배경 이미지/색상 편집기
└── 실시간 미리보기
```

**예상 작업량**: 4-6시간
**우선순위**: ⭐⭐⭐ (매우 높음)

---

### P0-2: 메인 페이지 섹션 추가 (통계/후기/트렌드)

**현재 문제점**:
- 모임 카드만 반복적으로 표시
- 사용자 참여 유도 요소 부족
- 다양성 없는 콘텐츠 구성

**Community에서 참고할 점**:
- 2컬럼 레이아웃 (인기글 | 최신글)
- 랭킹 번호 표시 (1-3위 하이라이트)
- 갤러리 그리드 (최근 글 포함)

**구현 계획**:
```
📁 frontend/src/components/home/TrendingSection.tsx (신규)
├── 실시간 인기 모임 Top 10
├── 순위 뱃지 (1-3위 골드/실버/브론즈)
├── 좋아요/참가자 수 표시
└── 24시간/7일 필터

📁 frontend/src/components/home/RecentActivitySection.tsx (신규)
├── 최신 모임 참가 알림
├── 최근 생성된 모임
├── 상대 시간 표시
└── 더보기 링크

📁 frontend/src/components/home/StatsSection.tsx (신규)
├── 전체 모임 수
├── 이번 주 신규 모임
├── 활성 사용자 수
└── 애니메이션 카운터
```

**예상 작업량**: 6-8시간
**우선순위**: ⭐⭐⭐ (매우 높음)

---

### P1-1: 관리자 사이드바 개선

**현재 문제점**:
- 모바일에서 사이드바 접근 불가
- 알림 배지 없음
- 사이트로 돌아가기 버튼 없음

**Community에서 참고할 점**:
- 모바일 햄버거 메뉴 + 오버레이
- 메뉴 아이템 badge 속성
- ChevronLeft "사이트로 돌아가기"
- X 버튼으로 닫기

**구현 계획**:
```
📁 frontend/src/components/admin/Sidebar.tsx (수정)
├── sidebarOpen state 추가
├── 모바일 오버레이 (lg:hidden)
├── 햄버거 메뉴 버튼
├── badge 속성 추가 (신고 건수 등)
├── "사이트로 돌아가기" 링크
└── 라우트 변경 시 자동 닫힘

📁 frontend/src/app/admin/layout.tsx (수정)
├── 모바일 헤더 추가
└── Menu 아이콘 버튼
```

**예상 작업량**: 3-4시간
**우선순위**: ⭐⭐ (높음)

---

### P1-2: 모바일 네비게이션 개선

**현재 문제점**:
- 메가 메뉴가 모바일에서 사용하기 어려움
- 햄버거 메뉴 없음
- 터치 친화적이지 않음

**구현 계획**:
```
📁 frontend/src/components/layout/MobileNav.tsx (신규)
├── Sheet/Drawer 컴포넌트 활용
├── 햄버거 메뉴 트리거
├── 전체 화면 네비게이션
├── 사용자 프로필 영역
├── 빠른 액션 버튼
└── 스와이프 제스처 지원

📁 frontend/src/components/layout/Header.tsx (수정)
├── md:hidden 햄버거 버튼 추가
├── MobileNav 통합
└── 메가 메뉴 모바일 숨김
```

**예상 작업량**: 4-5시간
**우선순위**: ⭐⭐ (높음)

---

### P2: 애니메이션/마이크로인터랙션

**현재 문제점**:
- 정적인 UI
- 페이지 전환 효과 없음
- 호버 효과 기본적

**구현 계획**:
```
📁 frontend/package.json (수정)
└── framer-motion 설치

📁 frontend/src/components/motion/index.tsx (신규)
├── FadeIn 래퍼
├── SlideUp 래퍼
├── ScaleOnHover 래퍼
└── StaggerChildren 래퍼

📁 frontend/src/components/home/*.tsx (수정)
├── 스크롤 트리거 애니메이션
├── 카드 호버 스케일
└── 숫자 카운트업 애니메이션

📁 frontend/src/app/layout.tsx (수정)
└── 페이지 전환 애니메이션
```

**예상 작업량**: 3-4시간
**우선순위**: ⭐ (중간)

---

## 3. 관리자 컴포넌트 마이그레이션 계획

### 3.1 Community에서 가져올 컴포넌트

| 컴포넌트 | 파일 | 의존성 | 수정 필요 |
|----------|------|--------|----------|
| AdminTabs | AdminTabs.tsx | 없음 | 스타일 조정 |
| AdminStatCard | AdminStatCard.tsx | lucide-react | 색상 테마 |
| AdminTable | AdminTable.tsx | lucide-react | API 연동 |
| AdminToast | AdminToast.tsx | 없음 | 스타일 조정 |
| AnalyticsCharts | AnalyticsCharts.tsx | recharts | 데이터 타입 |

### 3.2 설치 필요 패키지

```bash
npm install recharts
npm install framer-motion
```

### 3.3 마이그레이션 단계

1. **컴포넌트 복사**: Community → Sommoim
2. **스타일 조정**: primary 색상 통일
3. **타입 수정**: 데이터 구조 맞춤
4. **API 연동**: 백엔드 엔드포인트 연결
5. **테스트**: 각 컴포넌트 단위 테스트

---

## 4. 실행 로드맵

### Week 1: 핵심 UI 개선
- [ ] P0-1: 히어로 섹션 강화
- [ ] P1-1: 관리자 사이드바 개선

### Week 2: 콘텐츠 다양화
- [ ] P0-2: 메인 페이지 섹션 추가
- [ ] AdminStatCard, AnalyticsCharts 마이그레이션

### Week 3: 모바일 최적화
- [ ] P1-2: 모바일 네비게이션
- [ ] 반응형 테스트 및 수정

### Week 4: 폴리싱
- [ ] P2: 애니메이션 적용
- [ ] 전체 UI 일관성 검토
- [ ] 성능 최적화

---

## 5. 기대 효과

### 정량적 개선
| 지표 | 현재 | 목표 |
|------|------|------|
| 메인 페이지 완성도 | 50% | 85% |
| 관리자 대시보드 완성도 | 60% | 90% |
| 모바일 사용성 | 40% | 80% |
| 시각적 완성도 | 60% | 85% |

### 정성적 개선
- 사용자 첫인상 향상
- 관리자 업무 효율성 증가
- 모바일 접근성 확보
- 전문적인 플랫폼 이미지 구축

---

## 6. 참고 파일 경로

### Community 프로젝트 (참고용)
```
/Users/jeonminjun/claude/community/apps/frontend/
├── app/admin/layout.tsx           # 모바일 사이드바 참고
├── app/admin/dashboard/page.tsx   # 대시보드 구조 참고
├── app/admin/cms/                  # CMS 탭 구조 참고
├── components/admin/
│   ├── AdminTabs.tsx              # 탭 컴포넌트
│   ├── AdminStatCard.tsx          # 통계 카드
│   ├── AdminTable.tsx             # 테이블 컴포넌트
│   └── AnalyticsCharts.tsx        # 차트 컴포넌트
└── app/page.tsx                   # 메인 페이지 레이아웃
```

### Sommoim 프로젝트 (수정 대상)
```
/Users/jeonminjun/claude/sommoim/frontend/
├── src/app/page.tsx               # 메인 페이지
├── src/app/admin/layout.tsx       # 관리자 레이아웃
├── src/components/admin/Sidebar.tsx
├── src/components/home/           # 홈 컴포넌트들
└── src/components/layout/Header.tsx
```

---

**작성자**: Claude AI Assistant
**검토 필요**: 프로젝트 담당자
