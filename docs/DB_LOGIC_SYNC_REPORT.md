# 데이터베이스 & 비즈니스 로직 동기화 문제 분석 리포트

> 작성일: 2024-12-04
> 분석 범위: 참가자 관리, 채팅, 알림, 이벤트/활동 시스템

---

## 요약

sommoim 코드베이스에서 **데이터베이스 상태와 비즈니스 로직 간의 불일치**로 인해 데이터 일관성 문제, 레이스 컨디션, 권한 검증 누락 등이 발생할 수 있습니다. 주요 원인은 트랜잭션 미사용, 불완전한 캐스케이드 삭제, 일부 엔드포인트의 권한 검증 누락입니다.

---

## 심각도별 요약

| 심각도 | 이슈 수 | 주요 문제 |
|--------|---------|-----------|
| CRITICAL | 2 | 채팅 권한 누락, 트랜잭션 미사용 |
| HIGH | 4 | 알림 미발송, 권한 검증 누락, 상태 불일치 |
| MEDIUM | 4 | Staff 권한 미적용, 캐스케이드 삭제 불완전 |
| LOW | 2 | 알림 타입 명명 오류, 코드 품질 |

---

## CRITICAL 이슈

### 1. 참가자 상태 변경이 알림과 원자적으로 처리되지 않음

**문제**
참가자 상태 변경과 알림 생성이 별도의 DB 호출로 처리되어, 알림 생성 실패 시에도 상태는 이미 변경됨.

**영향받는 파일**
- `backend/src/modules/participant/participant.service.ts` (90-98줄)

**현재 코드**
```typescript
async updateStatus(meetingId, participantId, hostId, status) {
    const updated = await this.prisma.participant.update({...});
    await this.notifyStatusChange(...); // 별도 호출 - 실패해도 상태는 변경됨
    return updated;
}
```

**영향**
- 사용자가 승인/거절 알림을 받지 못할 수 있음
- DB 상태 불일치 (참가자는 승인됐지만 알림 없음)
- 동시 요청 시 중복 알림 가능성

**권장 수정**
```typescript
async updateStatus(...) {
    return this.prisma.$transaction(async (tx) => {
        const updated = await tx.participant.update({...});
        await tx.notification.create({...});
        return updated;
    });
}
```

---

### 2. 채팅 메시지 생성 시 접근 권한 검증 누락

**문제**
채팅 메시지 조회 시에만 권한을 검사하고, **생성 시에는 검사하지 않음**. 거절/강퇴된 참가자도 메시지를 보낼 수 있음.

**영향받는 파일**
- `backend/src/modules/chat/chat.service.ts` (22-26줄)

**현재 코드**
```typescript
async createMessage(meetingId: string, userId: string, content: string) {
    // canAccessChat() 검사 없음!
    return this.prisma.chatMessage.create({...});
}

async getMessages(meetingId: string, userId: string, ...) {
    if (!(await this.canAccessChat(meetingId, userId))) { // 여기서만 검사
        throw new ForbiddenException('채팅방에 접근할 수 없습니다');
    }
    // ...
}
```

**영향**
- 거절/강퇴된 참가자가 채팅 메시지 전송 가능
- PENDING 상태(autoApprove=false)인 참가자도 승인 전에 채팅 가능
- 데이터 무결성 문제

**권장 수정**
```typescript
async createMessage(meetingId: string, userId: string, content: string) {
    if (!(await this.canAccessChat(meetingId, userId))) {
        throw new ForbiddenException('채팅방에 접근할 수 없습니다');
    }
    return this.prisma.chatMessage.create({...});
}
```

---

## HIGH 이슈

### 3. 참가자 목록 조회 API 권한 검증 누락

**문제**
모든 인증된 사용자가 어떤 모임이든 참가자 목록을 조회할 수 있음.

**영향받는 파일**
- `backend/src/modules/participant/participant.controller.ts` (35-38줄)

**현재 코드**
```typescript
@Get('meetings/:meetingId/participants')
findByMeeting(@Param('meetingId') meetingId: string, @Query() query) {
    // 권한 검사 없음 - 모든 사용자가 조회 가능
    return this.participantService.findByMeeting(meetingId, query.status);
}
```

**영향**
- 정보 노출: 모든 신청자와 상태가 공개됨
- 개인정보 유출: 신청과 연결된 사용자 프로필 노출
- 타겟 괴롭힘이나 데이터 수집에 악용 가능

**권장 수정**
```typescript
@Get('meetings/:meetingId/participants')
findByMeeting(
    @Param('meetingId') meetingId: string,
    @Query() query,
    @CurrentUser('id') userId: string
) {
    // 호스트 또는 운영진만 조회 가능
    return this.participantService.findByMeeting(meetingId, query.status, userId);
}
```

---

### 4. 자동 승인된 참가자에게 알림 미발송

**문제**
`autoApprove=true`인 모임에서 참가자가 자동 승인되지만, 승인 알림이 발송되지 않음.

**영향받는 파일**
- `backend/src/modules/participant/participant.service.ts` (60-69줄)

**현재 코드**
```typescript
private async createParticipant(meeting, userId) {
    const status = meeting.autoApprove ? 'APPROVED' : 'PENDING';
    const participant = await this.prisma.participant.create({...});

    if (!meeting.autoApprove) {
        await this.notifyHost(meeting, participant.id); // 호스트에게만 알림
    }
    // autoApprove=true일 때 참가자에게 알림 없음!
    return participant;
}
```

**영향**
- 자동 승인된 참가자가 승인 사실을 모름
- 페이지 새로고침 전까지 상태 불일치
- 이벤트 초대/업데이트 누락

**권장 수정**
```typescript
if (meeting.autoApprove) {
    await this.prisma.notification.create({
        data: {
            userId,
            type: 'PARTICIPANT_APPROVED',
            title: '가입 승인',
            message: `'${meeting.title}' 모임 가입이 승인되었습니다.`,
            data: { meetingId: meeting.id },
        },
    });
} else {
    await this.notifyHost(meeting, participant.id);
}
```

---

### 5. 모임 취소 시 참가자 상태 미업데이트

**문제**
모임이 취소되어도 참가자 레코드는 여전히 "APPROVED" 상태로 유지됨.

**영향받는 파일**
- `backend/src/modules/meeting/meeting.service.ts` (230-272줄)

**현재 코드**
```typescript
private async cancelMeetingAndNotify(id, title, userIds) {
    await this.prisma.$transaction([
        this.prisma.meeting.update({
            where: { id },
            data: { status: 'CANCELLED' }
        }),
        this.prisma.notification.createMany({...}),
        // 참가자 상태 업데이트 누락!
    ]);
}
```

**영향**
- 참가자 레코드가 모임 상태와 불일치
- 프론트엔드에서 취소된 모임의 참가자가 활성 상태로 표시
- 리포트/분석 데이터 부정확

**권장 수정**
```typescript
await this.prisma.$transaction([
    this.prisma.meeting.update({...}),
    this.prisma.participant.updateMany({
        where: { meetingId: id },
        data: { status: 'CANCELLED' }
    }),
    this.prisma.notification.createMany({...}),
]);
```

---

### 6. 호스트 알림 타입 오류

**문제**
참가 신청 시 호스트에게 보내는 알림 타입이 `PARTICIPANT_APPROVED`로 잘못 설정됨.

**영향받는 파일**
- `backend/src/modules/participant/participant.service.ts` (72-80줄)

**현재 코드**
```typescript
private async notifyHost(meeting, participantId) {
    await this.prisma.notification.create({
        data: {
            type: 'PARTICIPANT_APPROVED', // 잘못된 타입!
            title: '새 참가 신청',
            // ...
        },
    });
}
```

**영향**
- DB에 잘못된 알림 타입 저장
- 프론트엔드에서 알림 의미 오해석 가능
- 분석/리포팅 부정확

**권장 수정**
```typescript
type: 'PARTICIPANT_APPLIED' // 또는 'NEW_APPLICATION'
```

---

## MEDIUM 이슈

### 7. 이벤트 관리에서 Staff 권한 미검증

**문제**
이벤트 생성/수정/삭제 시 호스트 여부만 확인하고, Staff의 `MANAGE_EVENTS` 권한은 검사하지 않음.

**영향받는 파일**
- `backend/src/modules/event/event.service.ts` (280-288줄)

**현재 코드**
```typescript
private async validateHostOrStaff(meetingId, userId) {
    const meeting = await this.prisma.meeting.findUnique({...});
    if (meeting.hostId === userId) return; // 호스트만 검사
    // Staff 권한 검사 누락!
}
```

**권장 수정**
```typescript
private async validateHostOrStaff(meetingId, userId) {
    const meeting = await this.prisma.meeting.findUnique({...});
    if (meeting?.hostId === userId) return;

    const staff = await this.prisma.meetingStaff.findUnique({
        where: { meetingId_userId: { meetingId, userId } },
    });
    if (!staff?.permissions.includes('MANAGE_EVENTS')) {
        throw new ForbiddenException('권한이 없습니다');
    }
}
```

---

### 8. 강퇴 시 활동 참석 상태 미동기화

**문제**
참가자가 강퇴되어도 해당 사용자의 활동(Activity) 참석 기록은 그대로 유지됨.

**영향받는 파일**
- `backend/src/modules/participant/participant.service.ts` (updateStatus)
- `backend/src/modules/meeting/meeting-calendar.service.ts`

**영향**
- 강퇴된 멤버가 활동 참석자 목록에 표시
- 캘린더/활동 뷰에서 잘못된 정보 표시
- 정원 계산 오류

**권장 수정**
```typescript
await this.prisma.$transaction([
    this.prisma.participant.update({...status: 'KICKED'}),
    this.prisma.activityAttendance.deleteMany({
        where: {
            activity: { meetingId },
            userId,
        }
    }),
]);
```

---

### 9. Cascade Delete 불완전

**문제**
일부 관계에서 cascade delete가 설정되지 않아 orphaned 레코드 발생 가능.

**영향받는 파일**
- `backend/prisma/schema.prisma`

**확인 필요 항목**
- `ActivityAttendance` - Participant 삭제 시 처리
- `Review` - 참가자 강퇴 시 리뷰 유지 여부
- `JoinAnswer` - 참가자 삭제 시 답변 처리

---

### 10. Seed 데이터가 비즈니스 로직 우회

**문제**
Seed 스크립트가 서비스 메서드 대신 직접 Prisma를 호출하여 정상적인 플로우를 테스트하지 못함.

**영향받는 파일**
- `backend/prisma/seed.ts`

**우회되는 로직**
- autoApprove 검증
- 알림 생성
- 참가 신청 추적/로깅

**권장 수정**
Seed에서 서비스 메서드를 호출하거나, 최소한 알림도 함께 생성하도록 수정.

---

## 수정 우선순위

| 순위 | 이슈 | 예상 작업량 |
|------|------|-------------|
| 1 | 채팅 메시지 생성 권한 검증 추가 (#2) | 10분 |
| 2 | 참가자 상태 변경 트랜잭션 적용 (#1, #5, #8) | 30분 |
| 3 | 참가자 목록 API 권한 추가 (#3) | 20분 |
| 4 | 자동 승인 알림 발송 (#4) | 15분 |
| 5 | 호스트 알림 타입 수정 (#6) | 5분 |
| 6 | Staff 권한 검증 구현 (#7) | 30분 |
| 7 | Cascade delete 검토 (#9) | 20분 |
| 8 | Seed 로직 개선 (#10) | 30분 |

---

## 즉시 조치 권장 사항

```bash
# 1. 채팅 권한 검증 추가 (CRITICAL)
# chat.service.ts의 createMessage()에 canAccessChat() 검사 추가

# 2. 트랜잭션 적용 (CRITICAL)
# participant.service.ts의 updateStatus()를 $transaction으로 래핑

# 3. 알림 시스템 보완 (HIGH)
# - 자동 승인 시 참가자 알림
# - 호스트 알림 타입 수정
```

---

## 테스트 체크리스트

- [ ] 거절된 참가자가 채팅 메시지 전송 불가 확인
- [ ] 강퇴된 참가자가 채팅방 접근 불가 확인
- [ ] 자동 승인 모임 가입 시 알림 수신 확인
- [ ] 모임 취소 시 참가자 상태가 CANCELLED로 변경 확인
- [ ] Staff 권한에 따른 이벤트 관리 가능 여부 확인
- [ ] 강퇴 시 활동 참석 기록 삭제 확인

---

*이 리포트는 코드 분석을 통해 자동 생성되었습니다. 실제 수정 전에 각 이슈의 영향도를 추가로 검토하시기 바랍니다.*
