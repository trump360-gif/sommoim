'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi, Profile } from '@/lib/api/users';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const REPORT_REASONS = [
  { value: 'HARASSMENT', label: '괴롭힘' },
  { value: 'SPAM', label: '스팸' },
  { value: 'FRAUD', label: '사기' },
  { value: 'INAPPROPRIATE', label: '부적절한 콘텐츠' },
  { value: 'OTHER', label: '기타' },
];

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ['user-profile', id],
    queryFn: () => usersApi.getUser(id),
  });

  const followMutation = useMutation({
    mutationFn: () => usersApi.follow(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-profile', id] }),
  });

  const unfollowMutation = useMutation({
    mutationFn: () => usersApi.unfollow(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-profile', id] }),
  });

  const blockMutation = useMutation({
    mutationFn: () => usersApi.blockUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', id] });
      alert('사용자를 차단했습니다');
    },
  });

  const unblockMutation = useMutation({
    mutationFn: () => usersApi.unblockUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', id] });
      alert('차단을 해제했습니다');
    },
  });

  const reportMutation = useMutation({
    mutationFn: () => usersApi.reportUser(id, reportReason, reportDesc),
    onSuccess: () => {
      setShowReportModal(false);
      setReportReason('');
      setReportDesc('');
      alert('신고가 접수되었습니다');
    },
  });

  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-gray-500">로딩 중...</div>;
  }

  if (!profile) {
    return <div className="flex min-h-[50vh] items-center justify-center text-gray-500">사용자를 찾을 수 없습니다</div>;
  }

  const isOwnProfile = user?.id === id;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl">
              {profile.profile?.avatarUrl ? (
                <img src={profile.profile.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                profile.nickname.charAt(0)
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profile.nickname}</h1>
              {profile.profile?.bio && <p className="mt-1 text-gray-600">{profile.profile.bio}</p>}
            </div>
            {!isOwnProfile && user && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => (profile as any).isFollowing ? unfollowMutation.mutate() : followMutation.mutate()}>
                  {(profile as any).isFollowing ? '언팔로우' : '팔로우'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-8 border-t pt-4">
            <div className="text-center">
              <p className="text-xl font-bold">{profile._count?.followers || 0}</p>
              <p className="text-sm text-gray-500">팔로워</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{profile._count?.following || 0}</p>
              <p className="text-sm text-gray-500">팔로잉</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{profile._count?.hostedMeetings || 0}</p>
              <p className="text-sm text-gray-500">모임</p>
            </div>
          </div>

          {!isOwnProfile && user && (
            <div className="mt-6 flex gap-2 border-t pt-4">
              {(profile as any).isBlocked ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => unblockMutation.mutate()}
                  disabled={unblockMutation.isPending}
                >
                  차단 해제
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (confirm('이 사용자를 차단하시겠습니까?\n차단하면 서로의 모임과 채팅을 볼 수 없습니다.')) {
                      blockMutation.mutate();
                    }
                  }}
                  disabled={blockMutation.isPending}
                >
                  차단
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                onClick={() => setShowReportModal(true)}
              >
                신고
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">사용자 신고</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">신고 사유 *</label>
                <div className="flex flex-wrap gap-2">
                  {REPORT_REASONS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setReportReason(r.value)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        reportReason === r.value
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">상세 설명</label>
                <textarea
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  className="w-full rounded-md border px-3 py-2"
                  rows={3}
                  placeholder="신고 사유를 자세히 설명해주세요"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => reportMutation.mutate()}
                  disabled={!reportReason || reportMutation.isPending}
                  className="flex-1"
                >
                  {reportMutation.isPending ? '제출 중...' : '신고하기'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1"
                >
                  취소
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
