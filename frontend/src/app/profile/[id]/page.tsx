'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi, Profile } from '@/lib/api/users';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSampleAvatar } from '@/lib/sample-images';
import { toast } from 'sonner';
import { UserPlus, UserMinus, Ban, Flag } from 'lucide-react';

const REPORT_REASONS = [
  { value: 'HARASSMENT', label: '괴롭힘' },
  { value: 'SPAM', label: '스팸' },
  { value: 'FRAUD', label: '사기' },
  { value: 'INAPPROPRIATE', label: '부적절한 콘텐츠' },
  { value: 'OTHER', label: '기타' },
];

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', id] });
      toast.success('팔로우했습니다');
    },
    onError: () => toast.error('팔로우에 실패했습니다'),
  });

  const unfollowMutation = useMutation({
    mutationFn: () => usersApi.unfollow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', id] });
      toast.success('언팔로우했습니다');
    },
    onError: () => toast.error('언팔로우에 실패했습니다'),
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
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Card className="overflow-hidden rounded-2xl border-0 shadow-medium">
        <div className="relative h-32 bg-gradient-to-br from-primary-500 to-primary-700">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        </div>
        <CardHeader className="relative -mt-16 pb-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end">
            <div className="relative h-32 w-32 overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-br from-gray-100 to-gray-200 shadow-xl">
              {profile.profile?.avatarUrl ? (
                <img src={profile.profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <img src={getSampleAvatar()} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">{profile.nickname}</h1>
              {profile.profile?.bio && <p className="mt-2 text-gray-600">{profile.profile.bio}</p>}
            </div>
            {!isOwnProfile && user && (
              <div className="flex gap-2">
                {(profile as any).isFollowing ? (
                  <Button
                    variant="outline"
                    onClick={() => unfollowMutation.mutate()}
                    disabled={unfollowMutation.isPending}
                    className="rounded-xl font-semibold shadow-sm transition-all hover:shadow-md"
                  >
                    <UserMinus className="mr-1.5 h-4 w-4" />
                    팔로잉
                  </Button>
                ) : (
                  <Button
                    onClick={() => followMutation.mutate()}
                    disabled={followMutation.isPending}
                    className="rounded-xl font-semibold shadow-sm transition-all hover:shadow-md"
                  >
                    <UserPlus className="mr-1.5 h-4 w-4" />
                    팔로우
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="flex justify-center gap-8 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-6 sm:justify-start">
            <button
              onClick={() => isOwnProfile && router.push('/mypage/followers')}
              className={`text-center ${isOwnProfile ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
              disabled={!isOwnProfile}
            >
              <p className="text-2xl font-bold text-gray-900">{profile._count?.followers || 0}</p>
              <p className="text-sm font-medium text-gray-500">팔로워</p>
            </button>
            <button
              onClick={() => isOwnProfile && router.push('/mypage/followers?tab=following')}
              className={`text-center ${isOwnProfile ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
              disabled={!isOwnProfile}
            >
              <p className="text-2xl font-bold text-gray-900">{profile._count?.following || 0}</p>
              <p className="text-sm font-medium text-gray-500">팔로잉</p>
            </button>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{profile._count?.hostedMeetings || 0}</p>
              <p className="text-sm font-medium text-gray-500">모임</p>
            </div>
          </div>

          {!isOwnProfile && user && (
            <div className="mt-6 flex flex-wrap gap-2 border-t border-gray-200 pt-6">
              {(profile as any).isBlocked ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => unblockMutation.mutate()}
                  disabled={unblockMutation.isPending}
                  className="rounded-xl font-medium shadow-sm transition-all hover:shadow-md"
                >
                  차단 해제
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl font-medium text-red-600 shadow-sm transition-all hover:bg-red-50 hover:shadow-md"
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
                className="rounded-xl font-medium text-red-600 shadow-sm transition-all hover:bg-red-50 hover:shadow-md"
                onClick={() => setShowReportModal(true)}
              >
                신고
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-scale-in rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-6 text-2xl font-bold tracking-tight">사용자 신고</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-3 block text-sm font-semibold text-gray-700">신고 사유 *</label>
                <div className="flex flex-wrap gap-2">
                  {REPORT_REASONS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setReportReason(r.value)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${reportReason === r.value
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">상세 설명</label>
                <textarea
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  rows={3}
                  placeholder="신고 사유를 자세히 설명해주세요"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => reportMutation.mutate()}
                  disabled={!reportReason || reportMutation.isPending}
                  className="flex-1 rounded-xl bg-red-600 font-semibold shadow-sm hover:bg-red-700"
                >
                  {reportMutation.isPending ? '제출 중...' : '신고하기'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 rounded-xl font-semibold shadow-sm"
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
