'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { meetingsApi } from '@/lib/api/meetings';
import { reviewsApi, Review, CreateReviewDto } from '@/lib/api/reviews';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { ActivityList } from '@/components/meeting/activity-list';
import type { Meeting, MeetingSchedule } from '@/types';

const categoryLabels: Record<string, string> = {
  SPORTS: '운동',
  GAMES: '게임',
  FOOD: '음식',
  CULTURE: '문화',
  TRAVEL: '여행',
  STUDY: '학습',
};

const statusLabels: Record<string, string> = {
  RECRUITING: '모집중',
  ONGOING: '진행중',
  COMPLETED: '완료',
  CANCELLED: '취소됨',
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const meetingId = params.id as string;

  const [activeTab, setActiveTab] = useState('info');

  const { data: meeting, isLoading, error } = useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: () => meetingsApi.getOne(meetingId),
  });

  const applyMutation = useMutation({
    mutationFn: () => meetingsApi.apply(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => meetingsApi.cancelParticipation(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
    },
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', meetingId],
    queryFn: () => reviewsApi.getByMeeting(meetingId),
    enabled: !!meeting && meeting.status === 'COMPLETED',
  });

  const [reviewForm, setReviewForm] = useState({ content: '', rating: 5 });
  const [showReviewForm, setShowReviewForm] = useState(false);

  const createReviewMutation = useMutation({
    mutationFn: (data: CreateReviewDto) => reviewsApi.create(meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', meetingId] });
      setShowReviewForm(false);
      setReviewForm({ content: '', rating: 5 });
    },
  });

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

  const isHost = user?.id === meeting.host.id;
  const participantStatus = (meeting as any).participantStatus;
  const isParticipant = participantStatus === 'APPROVED';
  const canApply =
    isAuthenticated &&
    !isHost &&
    meeting.status === 'RECRUITING' &&
    !participantStatus;
  const canCancel =
    isAuthenticated &&
    participantStatus &&
    ['PENDING', 'APPROVED'].includes(participantStatus);

  const handleApply = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    applyMutation.mutate();
  };

  const tabs = [
    { key: 'info', label: '모임 정보' },
    { key: 'activities', label: '활동 기록' },
    ...(meeting.status === 'COMPLETED' ? [{ key: 'reviews', label: '리뷰' }] : []),
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* 헤더 이미지 */}
      <div className="relative mb-6 aspect-video overflow-hidden rounded-xl bg-gray-100">
        {meeting.imageUrl ? (
          <Image src={meeting.imageUrl} alt={meeting.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            이미지 없음
          </div>
        )}
        <div className="absolute left-4 top-4 flex gap-2">
          <span className="rounded-full bg-primary-600 px-3 py-1 text-sm text-white">
            {categoryLabels[meeting.category]}
          </span>
          <span className={`rounded-full px-3 py-1 text-sm text-white ${
            meeting.status === 'RECRUITING' ? 'bg-green-500' :
            meeting.status === 'ONGOING' ? 'bg-blue-500' :
            meeting.status === 'COMPLETED' ? 'bg-gray-500' : 'bg-red-500'
          }`}>
            {statusLabels[meeting.status]}
          </span>
        </div>
      </div>

      {/* 모임 제목 */}
      <h1 className="mb-6 text-3xl font-bold">{meeting.title}</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 메인 콘텐츠 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 탭 네비게이션 */}
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {/* 탭 콘텐츠 */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div>
                <p className="whitespace-pre-wrap text-gray-700">{meeting.description}</p>
              </div>

              {/* 일정 */}
              {meeting.schedules && meeting.schedules.length > 0 && (
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-semibold">일정</h2>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {meeting.schedules.map((schedule: MeetingSchedule) => (
                      <div key={schedule.id} className="border-l-4 border-primary-500 pl-4">
                        <p className="font-medium">{formatDate(schedule.startTime)}</p>
                        <p className="text-sm text-gray-500">~ {formatDate(schedule.endTime)}</p>
                        {schedule.location && (
                          <p className="mt-1 text-sm text-gray-600">장소: {schedule.location}</p>
                        )}
                        {schedule.note && (
                          <p className="mt-1 text-sm text-gray-500">{schedule.note}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* 참가자 */}
              {meeting.participants && meeting.participants.length > 0 && (
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-semibold">
                      참가자 ({meeting._count?.participants || 0}/{meeting.maxParticipants})
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {meeting.participants.map((p: any) => (
                        <div key={p.id} className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                          <div className="h-6 w-6 overflow-hidden rounded-full bg-gray-300">
                            {p.user.profile?.avatarUrl && (
                              <Image
                                src={p.user.profile.avatarUrl}
                                alt={p.user.nickname}
                                width={24}
                                height={24}
                              />
                            )}
                          </div>
                          <span className="text-sm">{p.user.nickname}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'activities' && (
            <ActivityList
              meetingId={meetingId}
              isHost={isHost}
              isParticipant={isParticipant}
            />
          )}

          {activeTab === 'reviews' && meeting.status === 'COMPLETED' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">리뷰</h2>
                  {reviewsData?.meta?.averageRating && (
                    <p className="text-sm text-gray-500">
                      평균 ⭐ {reviewsData.meta.averageRating.toFixed(1)}
                    </p>
                  )}
                </div>
                {participantStatus === 'APPROVED' && !showReviewForm && (
                  <Button size="sm" onClick={() => setShowReviewForm(true)}>
                    리뷰 작성
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {showReviewForm && (
                  <div className="space-y-3 rounded-lg border p-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">평점</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm((p) => ({ ...p, rating: star }))}
                            className={`text-2xl ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">내용</label>
                      <textarea
                        className="w-full rounded-md border p-2"
                        rows={3}
                        value={reviewForm.content}
                        onChange={(e) => setReviewForm((p) => ({ ...p, content: e.target.value }))}
                        placeholder="모임에 대한 후기를 남겨주세요"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => createReviewMutation.mutate(reviewForm)}
                        disabled={createReviewMutation.isPending || !reviewForm.content.trim()}
                      >
                        {createReviewMutation.isPending ? '등록 중...' : '등록'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowReviewForm(false)}>
                        취소
                      </Button>
                    </div>
                  </div>
                )}

                {reviewsData?.data?.length === 0 ? (
                  <p className="py-4 text-center text-gray-500">아직 리뷰가 없습니다</p>
                ) : (
                  reviewsData?.data?.map((review: Review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gray-200" />
                        <div>
                          <p className="text-sm font-medium">{review.user.nickname}</p>
                          <p className="text-xs text-gray-500">
                            {'⭐'.repeat(review.rating)} {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{review.content}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 모임주 */}
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

          {/* 모임 정보 */}
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

          {/* 채팅 버튼 - 승인된 참가자 또는 호스트 */}
          {(isHost || participantStatus === 'APPROVED') && (
            <Button className="w-full" onClick={() => router.push(`/meetings/${meetingId}/chat`)}>
              채팅방 입장
            </Button>
          )}

          {/* 액션 버튼 */}
          <div className="space-y-3">
            {isHost ? (
              <>
                <Button className="w-full" onClick={() => router.push(`/meetings/${meetingId}/edit`)}>
                  모임 수정
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push(`/meetings/${meetingId}/participants`)}>
                  참가자 관리
                </Button>
              </>
            ) : canApply ? (
              <Button
                className="w-full"
                onClick={handleApply}
                disabled={applyMutation.isPending}
              >
                {applyMutation.isPending ? '신청 중...' : '참가 신청'}
              </Button>
            ) : canCancel ? (
              <div className="space-y-2">
                <p className="text-center text-sm text-gray-600">
                  참가 상태: {participantStatus === 'APPROVED' ? '승인됨' : '대기중'}
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? '취소 중...' : '참가 취소'}
                </Button>
              </div>
            ) : participantStatus === 'REJECTED' ? (
              <p className="text-center text-sm text-red-500">참가가 거절되었습니다</p>
            ) : participantStatus === 'KICKED' ? (
              <p className="text-center text-sm text-red-500">강퇴되었습니다</p>
            ) : !isAuthenticated ? (
              <Button className="w-full" onClick={() => router.push('/auth/login')}>
                로그인하고 참가하기
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
