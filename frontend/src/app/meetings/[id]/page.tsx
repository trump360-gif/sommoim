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
import { EventList } from '@/components/meeting/event-list';
import { StaffManagement } from '@/components/meeting/staff-management';
import { JoinQuestionsManager } from '@/components/meeting/join-questions-manager';
import {
  categoryLabels,
  statusLabels,
  MeetingSidebar,
  MeetingInfoTab,
  MeetingReviewsTab,
  ApplicationManager,
} from './_components';
import {
  Info,
  Calendar,
  Image as ImageIcon,
  Users,
  MessageCircle,
  Star,
  Shield,
  Settings,
} from 'lucide-react';
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

  const { data: staffList = [] } = useQuery({
    queryKey: ['meeting-staff', meetingId],
    queryFn: () => meetingsApi.getStaffList(meetingId),
    enabled: !!meeting,
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

  const participantCount = meeting.participants?.filter((p: any) => p.status === 'APPROVED').length || 0;
  const staffMap = new Map(staffList.map((s: any) => [s.userId, s.role]));

  const tabs = [
    { key: 'info', label: '소개', icon: <Info className="h-4 w-4" /> },
    { key: 'events', label: '일정', icon: <Calendar className="h-4 w-4" /> },
    { key: 'activities', label: '활동', icon: <ImageIcon className="h-4 w-4" /> },
    { key: 'members', label: '멤버', icon: <Users className="h-4 w-4" />, badge: participantCount },
    { key: 'chat', label: '채팅', icon: <MessageCircle className="h-4 w-4" /> },
    ...(isHost ? [
      { key: 'staff', label: '운영진', icon: <Shield className="h-4 w-4" /> },
      { key: 'settings', label: '설정', icon: <Settings className="h-4 w-4" /> },
    ] : []),
    ...(meeting.status === 'COMPLETED' ? [{ key: 'reviews', label: '리뷰', icon: <Star className="h-4 w-4" /> }] : []),
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

          {activeTab === 'events' && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <EventList meetingId={meetingId} isHost={isHost} isParticipant={isParticipant} />
            </div>
          )}

          {activeTab === 'activities' && (
            <ActivityList meetingId={meetingId} isHost={isHost} isParticipant={isParticipant} />
          )}

          {activeTab === 'members' && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">멤버 ({participantCount}명)</h3>
                {isHost && (
                  <Button variant="outline" size="sm" onClick={() => router.push(`/meetings/${meetingId}/participants`)}>
                    멤버 관리
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {/* Host */}
                <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-medium">
                    {meeting.host.nickname.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{meeting.host.nickname}</p>
                    <p className="text-xs text-gray-500">모임장</p>
                  </div>
                </div>
                {/* Participants */}
                {meeting.participants?.filter((p: any) => p.status === 'APPROVED').map((p: any) => {
                  const staffRole = staffMap.get(p.user.id);
                  const roleLabel = staffRole === 'CO_HOST' ? '공동운영자' : staffRole === 'MANAGER' ? '매니저' : staffRole === 'STAFF' ? '스태프' : '멤버';
                  const roleColor = staffRole === 'CO_HOST' ? 'text-amber-600 bg-amber-100' : staffRole === 'MANAGER' ? 'text-blue-600 bg-blue-100' : staffRole === 'STAFF' ? 'text-green-600 bg-green-100' : '';
                  return (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 font-medium">
                        {p.user.nickname.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{p.user.nickname}</p>
                          {staffRole && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${roleColor}`}>
                              <Shield className="h-2.5 w-2.5" />
                              {roleLabel}
                            </span>
                          )}
                        </div>
                        {!staffRole && <p className="text-xs text-gray-500">멤버</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">모임 채팅</h3>
              </div>
              {isParticipant || isHost ? (
                <div className="text-center py-8">
                  <MessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-4">채팅을 시작하세요</p>
                  <Button onClick={() => router.push(`/meetings/${meetingId}/chat`)}>
                    채팅방 입장
                  </Button>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">멤버만 채팅에 참여할 수 있습니다</p>
              )}
            </div>
          )}

          {activeTab === 'staff' && isHost && (
            <StaffManagement
              meetingId={meetingId}
              participants={meeting.participants || []}
            />
          )}

          {activeTab === 'settings' && isHost && (
            <div className="space-y-6">
              {/* 가입 신청 관리 */}
              <ApplicationManager meetingId={meetingId} isHost={isHost} />

              {/* 가입 질문 관리 */}
              <JoinQuestionsManager meetingId={meetingId} />
            </div>
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
