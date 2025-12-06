// ================================
// Types & Interfaces
// ================================

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { meetingsApi } from '@/lib/api/meetings';
import { reviewsApi } from '@/lib/api/reviews';
import { getSampleMeetingImage } from '@/lib/sample-images';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { SimpleTabs as Tabs } from '@/components/ui/tabs';
import { ActivityList } from '@/components/meeting/activity-list';
import {
  categoryLabels,
  statusLabels,
  MeetingSidebar,
  MeetingInfoTab,
  MeetingReviewsTab,
} from './_components';
import { WithdrawModal } from './_components/withdraw-modal';

// ================================
// Component
// ================================

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const meetingId = params.id as string;

  const [activeTab, setActiveTab] = useState('info');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // ================================
  // Queries
  // ================================

  const {
    data: meeting,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: () => meetingsApi.getOne(meetingId),
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', meetingId],
    queryFn: () => reviewsApi.getByMeeting(meetingId),
    enabled: !!meeting && meeting.status === 'COMPLETED',
  });

  // ================================
  // Mutations
  // ================================

  const applyMutation = useMutation({
    mutationFn: () => meetingsApi.apply(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
    },
  });

  const cancelApplicationMutation = useMutation({
    mutationFn: () => meetingsApi.cancelApplication(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (reason?: string) => meetingsApi.withdraw(meetingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      setShowWithdrawModal(false);
    },
  });

  // ================================
  // Loading & Error States
  // ================================

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">모임을 찾을 수 없습니다</p>
          <Button onClick={() => router.back()} className="mt-4">
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  // ================================
  // Derived State
  // ================================

  const isHost = user?.id === meeting.host.id;
  const participantStatus = (meeting as any).participantStatus;
  const isParticipant = participantStatus === 'APPROVED';
  const canApply =
    isAuthenticated && !isHost && meeting.status === 'RECRUITING' && !participantStatus;
  const canCancel =
    isAuthenticated && participantStatus && ['PENDING', 'APPROVED'].includes(participantStatus);

  // ================================
  // Handlers
  // ================================

  const handleApply = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    applyMutation.mutate();
  };

  const handleCancelOrWithdraw = () => {
    if (participantStatus === 'APPROVED') {
      setShowWithdrawModal(true);
    } else {
      cancelApplicationMutation.mutate();
    }
  };

  const handleWithdraw = (reason?: string) => {
    withdrawMutation.mutate(reason);
  };

  // ================================
  // Tabs Configuration
  // ================================

  const tabs = [
    { key: 'info', label: '모임 정보' },
    { key: 'activities', label: '활동 기록' },
    ...(meeting.status === 'COMPLETED' ? [{ key: 'reviews', label: '리뷰' }] : []),
  ];

  // ================================
  // Render
  // ================================

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header Image */}
      <MeetingHeader meeting={meeting} />

      {/* Meeting Title */}
      <h1 className="mb-6 text-3xl font-bold">{meeting.title}</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'info' && (
            <MeetingInfoTab meeting={meeting} meetingId={meetingId} isHost={isHost} isMember={isParticipant || isHost} />
          )}

          {activeTab === 'activities' && (
            <ActivityList meetingId={meetingId} isHost={isHost} isParticipant={isParticipant} />
          )}

          {activeTab === 'reviews' && meeting.status === 'COMPLETED' && (
            <MeetingReviewsTab
              meetingId={meetingId}
              participantStatus={participantStatus}
              reviewsData={reviewsData}
            />
          )}
        </div>

        {/* Sidebar */}
        <MeetingSidebar
          meeting={meeting}
          meetingId={meetingId}
          isHost={isHost}
          isAuthenticated={isAuthenticated}
          participantStatus={participantStatus}
          canApply={canApply}
          canCancel={canCancel}
          onApply={handleApply}
          onCancelOrWithdraw={handleCancelOrWithdraw}
          isApplying={applyMutation.isPending}
          isCancelling={cancelApplicationMutation.isPending || withdrawMutation.isPending}
        />
      </div>

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onWithdraw={handleWithdraw}
        isLoading={withdrawMutation.isPending}
        meetingTitle={meeting.title}
      />
    </div>
  );
}

// ================================
// Meeting Header
// ================================

function MeetingHeader({ meeting }: { meeting: any }) {
  const statusColorMap: Record<string, string> = {
    RECRUITING: 'bg-green-500',
    ONGOING: 'bg-blue-500',
    COMPLETED: 'bg-gray-500',
    CANCELLED: 'bg-red-500',
  };

  return (
    <div className="relative mb-6 aspect-video overflow-hidden rounded-xl bg-gray-100">
      {meeting.imageUrl ? (
        <Image src={meeting.imageUrl} alt={meeting.title} fill className="object-cover" />
      ) : (
        <Image src={getSampleMeetingImage(meeting.category)} alt={meeting.title} fill className="object-cover" />
      )}
      <div className="absolute left-4 top-4 flex gap-2">
        <span className="rounded-full bg-primary-600 px-3 py-1 text-sm text-white">
          {categoryLabels[meeting.category]}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-sm text-white ${statusColorMap[meeting.status] || 'bg-gray-500'}`}
        >
          {statusLabels[meeting.status]}
        </span>
      </div>
    </div>
  );
}
