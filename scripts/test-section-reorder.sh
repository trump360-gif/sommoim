#!/bin/bash

echo "=== 섹션 순서 변경 테스트 ==="
echo ""

echo "1. 현재 섹션 순서 확인"
SECTIONS=$(curl -s -b /tmp/cookies.txt http://localhost:4000/api/admin/page-sections)
echo "$SECTIONS" | jq '[.[] | {id: .id[0:12], type, order}]'

echo ""
echo "2. 섹션 ID 추출"
HERO_ID=$(echo "$SECTIONS" | jq -r '.[] | select(.type=="hero") | .id')
CAT_ID=$(echo "$SECTIONS" | jq -r '.[] | select(.type=="categories") | .id')
POPULAR_ID=$(echo "$SECTIONS" | jq -r '.[] | select(.title=="인기 모임") | .id')
LATEST_ID=$(echo "$SECTIONS" | jq -r '.[] | select(.title=="최신 모임") | .id')
FEATURED_ID=$(echo "$SECTIONS" | jq -r '.[] | select(.type=="featured") | .id')

echo "Hero: $HERO_ID"
echo "Categories: $CAT_ID"
echo "Popular: $POPULAR_ID"
echo "Latest: $LATEST_ID"
echo "Featured: $FEATURED_ID"

echo ""
echo "3. 순서 변경 요청 (Hero를 맨 앞으로)"
# Hero(0), Categories(1), Popular(2), Latest(3), Featured(4) 순서로 변경
cat > /tmp/reorder.json << EOF
{"items":[
  {"id":"$HERO_ID","order":0},
  {"id":"$CAT_ID","order":1},
  {"id":"$POPULAR_ID","order":2},
  {"id":"$LATEST_ID","order":3},
  {"id":"$FEATURED_ID","order":4}
]}
EOF

echo "요청 데이터:"
cat /tmp/reorder.json | jq .

echo ""
echo "4. Reorder API 호출"
REORDER_RESULT=$(curl -s -X PUT http://localhost:4000/api/admin/page-sections/reorder \
  -H "Content-Type: application/json" \
  -b /tmp/cookies.txt \
  -d @/tmp/reorder.json)

echo "결과: $REORDER_RESULT"

echo ""
echo "5. 변경 후 관리자 API 확인"
curl -s -b /tmp/cookies.txt http://localhost:4000/api/admin/page-sections | jq '[.[] | {id: .id[0:12], type, order}]'

echo ""
echo "6. 변경 후 공개 API 확인"
curl -s http://localhost:4000/api/admin/public/sections | jq '[.[] | {id: .id[0:12], type, order}]'
