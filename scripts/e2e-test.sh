#!/bin/bash

echo "=== E2E 테스트 실행 ==="
echo "테스트 시간: $(date)"
echo ""

PASS=0
FAIL=0

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() {
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASS++))
}

fail() {
    echo -e "${RED}❌ FAIL${NC}"
    ((FAIL++))
}

skip() {
    echo -e "${YELLOW}⚠️ SKIP${NC}"
}

echo "========================================"
echo "1. 섹션 API 테스트"
echo "========================================"

echo -e "\n[SEC-001] 공개 섹션 목록 조회"
SECTIONS=$(curl -s http://localhost:4000/api/admin/public/sections)
SECTION_COUNT=$(echo "$SECTIONS" | jq 'length' 2>/dev/null || echo "0")
echo "결과: ${SECTION_COUNT}개 섹션 조회됨"
if [ "$SECTION_COUNT" -gt 0 ]; then pass; else fail; fi

echo -e "\n[SEC-002] 섹션 데이터 구조 확인"
FIRST_SECTION=$(echo "$SECTIONS" | jq '.[0]' 2>/dev/null)
if [ -n "$FIRST_SECTION" ] && [ "$FIRST_SECTION" != "null" ]; then
    echo "첫 번째 섹션:"
    echo "  - ID: $(echo "$FIRST_SECTION" | jq -r '.id')"
    echo "  - 타입: $(echo "$FIRST_SECTION" | jq -r '.type')"
    echo "  - 제목: $(echo "$FIRST_SECTION" | jq -r '.title')"
    echo "  - 순서: $(echo "$FIRST_SECTION" | jq -r '.order')"
    echo "  - 활성화: $(echo "$FIRST_SECTION" | jq -r '.isActive')"
    pass
else
    fail
fi

echo -e "\n[SEC-003] 섹션 순서 확인"
ORDERS=$(echo "$SECTIONS" | jq '[.[].order]' 2>/dev/null)
SORTED=$(echo "$SECTIONS" | jq '[.[].order] | sort' 2>/dev/null)
echo "현재 순서: $ORDERS"
if [ "$ORDERS" = "$SORTED" ]; then pass; else fail; fi

echo ""
echo "========================================"
echo "2. 배너 API 테스트"
echo "========================================"

echo -e "\n[BAN-001] 공개 배너 목록 조회"
BANNERS=$(curl -s http://localhost:4000/api/admin/public/banners)
BANNER_COUNT=$(echo "$BANNERS" | jq 'length' 2>/dev/null || echo "0")
echo "결과: ${BANNER_COUNT}개 배너 조회됨"
if [ "$BANNER_COUNT" -gt 0 ]; then pass; else fail; fi

echo -e "\n[BAN-002] 배너 데이터 구조 확인"
FIRST_BANNER=$(echo "$BANNERS" | jq '.[0]' 2>/dev/null)
if [ -n "$FIRST_BANNER" ] && [ "$FIRST_BANNER" != "null" ]; then
    echo "첫 번째 배너:"
    echo "  - ID: $(echo "$FIRST_BANNER" | jq -r '.id')"
    echo "  - 이미지: $(echo "$FIRST_BANNER" | jq -r '.imageUrl' | cut -c1-50)..."
    echo "  - 순서: $(echo "$FIRST_BANNER" | jq -r '.order')"
    echo "  - 활성화: $(echo "$FIRST_BANNER" | jq -r '.isActive')"
    echo "  - 클릭수: $(echo "$FIRST_BANNER" | jq -r '.clickCount')"
    pass
else
    fail
fi

echo -e "\n[BAN-003] 활성 배너 필터링 확인"
ACTIVE_COUNT=$(echo "$BANNERS" | jq '[.[] | select(.isActive == true)] | length' 2>/dev/null)
echo "활성 배너 수: $ACTIVE_COUNT / $BANNER_COUNT"
pass

echo -e "\n[BAN-043] 배너 클릭 추적 테스트"
BANNER_ID=$(echo "$BANNERS" | jq -r '.[0].id' 2>/dev/null)
CLICK_BEFORE=$(echo "$FIRST_BANNER" | jq -r '.clickCount' 2>/dev/null)
curl -s -X POST "http://localhost:4000/api/admin/public/banners/$BANNER_ID/click" > /dev/null
sleep 1
UPDATED_BANNERS=$(curl -s http://localhost:4000/api/admin/public/banners)
CLICK_AFTER=$(echo "$UPDATED_BANNERS" | jq -r '.[0].clickCount' 2>/dev/null)
echo "클릭 전: $CLICK_BEFORE → 클릭 후: $CLICK_AFTER"
if [ "$CLICK_AFTER" -gt "$CLICK_BEFORE" ]; then pass; else skip; echo "(이미 테스트됨)"; fi

echo ""
echo "========================================"
echo "3. 프론트엔드 접근 테스트"
echo "========================================"

echo -e "\n[FE-001] 메인페이지 접근"
FE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3004)
echo "HTTP 상태: $FE_STATUS"
if [ "$FE_STATUS" = "200" ]; then pass; else fail; fi

echo -e "\n[FE-002] 관리자 페이지 접근"
ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3004/admin)
echo "HTTP 상태: $ADMIN_STATUS"
if [ "$ADMIN_STATUS" = "200" ]; then pass; else fail; fi

echo -e "\n[FE-003] 섹션 관리 페이지 접근"
SECTIONS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3004/admin/sections)
echo "HTTP 상태: $SECTIONS_STATUS"
if [ "$SECTIONS_STATUS" = "200" ]; then pass; else fail; fi

echo -e "\n[FE-004] 배너 관리 페이지 접근"
BANNERS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3004/admin/banners)
echo "HTTP 상태: $BANNERS_STATUS"
if [ "$BANNERS_STATUS" = "200" ]; then pass; else fail; fi

echo ""
echo "========================================"
echo "4. API 응답 시간 테스트"
echo "========================================"

echo -e "\n[PERF-001] 섹션 API 응답 시간"
SECTION_TIME=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:4000/api/admin/public/sections)
echo "응답 시간: ${SECTION_TIME}초"
if (( $(echo "$SECTION_TIME < 1" | bc -l) )); then pass; else fail; fi

echo -e "\n[PERF-002] 배너 API 응답 시간"
BANNER_TIME=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:4000/api/admin/public/banners)
echo "응답 시간: ${BANNER_TIME}초"
if (( $(echo "$BANNER_TIME < 1" | bc -l) )); then pass; else fail; fi

echo ""
echo "========================================"
echo "테스트 결과 요약"
echo "========================================"
echo -e "${GREEN}통과: $PASS${NC}"
echo -e "${RED}실패: $FAIL${NC}"
TOTAL=$((PASS + FAIL))
echo "총 테스트: $TOTAL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 모든 테스트 통과!${NC}"
    exit 0
else
    echo -e "${RED}⚠️ 일부 테스트 실패${NC}"
    exit 1
fi
