// ================================
// Types & Interfaces
// ================================

'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Meeting } from '@/types';

interface MeetingSidebarProps {
  meeting: Meeting;
  meetingId: string;
  isHost: boolean;
  isAuthenticated: boolean;
  participantStatus: string | null;
  canApply: boolean;
  canCancel: boolean;
  onApply: () => void;
  onCancelOrWithdraw: () => void;
  isApplying: boolean;
  isCancelling: boolean;
}

// ================================
// Component
// ================================

export function MeetingSidebar({
  meeting,
  meetingId,
  isHost,
  isAuthenticated,
  participantStatus,
  canApply,
  canCancel,
  onApply,
  onCancelOrWithdraw,
  isApplying,
  isCancelling,
}: MeetingSidebarProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <HostCard meeting={meeting} />
      <MeetingInfoCard meeting={meeting} />

      {/* Chat Button */}
      {(isHost || participantStatus === 'APPROVED') && (
        <Button className="w-full" onClick={() => router.push(`/meetings/${meetingId}/chat`)}>
          채팅방 입장
        </Button>
      )}

      {/* Action Buttons */}
      <ActionButtons
        meetingId={meetingId}
        isHost={isHost}
        isAuthenticated={isAuthenticated}
        participantStatus={participantStatus}
        canApply={canApply}
        canCancel={canCancel}
        onApply={onApply}
        onCancelOrWithdraw={onCancelOrWithdraw}
        isApplying={isApplying}
        isCancelling={isCancelling}
      />
    </div>
  );
}

// ================================
// Host Card
// ================================

function HostCard({ meeting }: { meeting: Meeting }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">모임주</h2>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-200">
            {meeting.host.profile?.avatarUrl && (
              <Image
                src={meeting.host.profile.avatarUrl}
                alt={meeting.host.nickname}
                width={48}
                height={48}
              />
            )}
          </div>
          <div>
            <p className="font-medium">{meeting.host.nickname}</p>
            {(meeting.host.profile as any)?.bio && (
              <p className="text-sm text-gray-500">{(meeting.host.profile as any).bio}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ================================
// Meeting Info Card
// ================================

function MeetingInfoCard({ meeting }: { meeting: Meeting }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">모임 정보</h2>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">위치</span>
          <span>{meeting.location}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">최대 인원</span>
          <span>{meeting.maxParticipants}명</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">승인 방식</span>
          <span>{meeting.autoApprove ? '자동 승인' : '수동 승인'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">조회수</span>
          <span>{meeting.viewCount}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ================================
// Action Buttons
// ================================

interface ActionButtonsProps {
  meetingId: string;
  isHost: boolean;
  isAuthenticated: boolean;
  participantStatus: string | null;
  canApply: boolean;
  canCancel: boolean;
  onApply: () => void;
  onCancelOrWithdraw: () => void;
  isApplying: boolean;
  isCancelling: boolean;
}

function ActionButtons({
  meetingId,
  isHost,
  isAuthenticated,
  participantStatus,
  canApply,
  canCancel,
  onApply,
  onCancelOrWithdraw,
  isApplying,
  isCancelling,
}: ActionButtonsProps) {
  const router = useRouter();

  if (isHost) {
    return (
      <div className="space-y-3">
        <Button className="w-full" onClick={() => router.push(`/meetings/${meetingId}/edit`)}>
          모임 수정
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push(`/meetings/${meetingId}/participants`)}
        >
          참가자 관리
        </Button>
      </div>
    );
  }

  if (canApply) {
    return (
      <div className="space-y-3">
        <Button className="w-full" onClick={onApply} disabled={isApplying}>
          {isApplying ? '신청 중...' : '참가 신청'}
        </Button>
      </div>
    );
  }

  if (canCancel) {
    const statusLabel = participantStatus === 'APPROVED' ? '승인됨' : participantStatus === 'PENDING' ? '대기중' : participantStatus;
    const statusColor = participantStatus === 'APPROVED' ? 'text-green-600' : 'text-yellow-600';
    const isApproved = participantStatus === 'APPROVED';
    const buttonText = isApproved ? '탈퇴하기' : '신청 취소';
    const loadingText = isApproved ? '탈퇴 중...' : '취소 중...';

    return (
      <div className="space-y-3">
        <p className={`text-center text-sm ${statusColor}`}>
          참가 상태: {statusLabel}
        </p>
        <Button
          variant="outline"
          className={`w-full ${isApproved ? 'border-red-300 text-red-600 hover:bg-red-50' : ''}`}
          onClick={onCancelOrWithdraw}
          disabled={isCancelling}
        >
          {isCancelling ? loadingText : buttonText}
        </Button>
      </div>
    );
  }

  if (participantStatus === 'REJECTED') {
    return <p className="text-center text-sm text-red-500">참가가 거절되었습니다</p>;
  }

  if (participantStatus === 'KICKED') {
    return <p className="text-center text-sm text-red-500">강퇴되었습니다</p>;
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-3">
        <Button className="w-full" onClick={() => router.push('/auth/login')}>
          로그인하고 참가하기
        </Button>
      </div>
    );
  }

  return null;
}
