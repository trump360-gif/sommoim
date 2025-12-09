#!/bin/bash

echo "=== 배너 수정 테스트 ==="
echo ""

echo "1. 현재 배너 상태 확인"
BANNERS=$(curl -s -b /tmp/cookies.txt http://localhost:4000/api/admin/banners)
echo "$BANNERS" | jq '[.[] | {id: .id[0:12], title, order, isActive, clickCount}]'

echo ""
echo "2. 첫 번째 배너 정보"
FIRST_BANNER=$(echo "$BANNERS" | jq '.[0]')
BANNER_ID=$(echo "$FIRST_BANNER" | jq -r '.id')
OLD_TITLE=$(echo "$FIRST_BANNER" | jq -r '.title')

echo "ID: $BANNER_ID"
echo "현재 제목: $OLD_TITLE"

echo ""
echo "3. 배너 제목 수정 요청"
NEW_TITLE="테스트 배너 제목 $(date +%H%M%S)"

cat > /tmp/banner_update.json << EOF
{"title":"$NEW_TITLE"}
EOF

echo "요청 데이터:"
cat /tmp/banner_update.json

echo ""
echo "4. 배너 수정 API 호출"
UPDATE_RESULT=$(curl -s -X PUT "http://localhost:4000/api/admin/banners/$BANNER_ID" \
  -H "Content-Type: application/json" \
  -b /tmp/cookies.txt \
  -d @/tmp/banner_update.json)

echo "결과: $UPDATE_RESULT"

echo ""
echo "5. 수정 후 관리자 API 확인"
curl -s -b /tmp/cookies.txt http://localhost:4000/api/admin/banners | jq '.[0] | {id: .id[0:12], title, order}'

echo ""
echo "6. 수정 후 공개 API 확인"
curl -s http://localhost:4000/api/admin/public/banners | jq '.[0] | {id: .id[0:12], title, order}'

echo ""
echo "7. 제목 원복"
cat > /tmp/banner_update.json << EOF
{"title":"$OLD_TITLE"}
EOF

curl -s -X PUT "http://localhost:4000/api/admin/banners/$BANNER_ID" \
  -H "Content-Type: application/json" \
  -b /tmp/cookies.txt \
  -d @/tmp/banner_update.json > /dev/null

echo "원복 완료"
