'use client';

// ================================
// Imports & Dependencies
// ================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { usersApi } from '@/lib/api/users';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Ban, UserX, Shield } from 'lucide-react';

// ================================
// Types
// ================================

interface BlockedUser {
  id: string;
  blocked: {
    id: string;
    nickname: string;
    profile?: {
      avatarUrl?: string;
    };
  };
  createdAt: string;
}

// ================================
// Component
// ================================

export default function BlockedUsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const { data: blockedUsers = [], isLoading } = useQuery<BlockedUser[]>({
    queryKey: ['blocked-users'],
    queryFn: usersApi.getBlockedUsers,
    enabled: isAuthenticated,
  });

  const unblockMutation = useMutation({
    mutationFn: (userId: string) => usersApi.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      toast.success('차단을 해제했습니다');
    },
    onError: () => toast.error('차단 해제에 실패했습니다'),
  });

  const handleUnblock = (userId: string, nickname: string) => {
    if (confirm(`${nickname}님의 차단을 해제하시겠습니까?`)) {
      unblockMutation.mutate(userId);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">차단 관리</h1>
          <p className="text-sm text-gray-500 mt-1">차단한 사용자 목록을 관리합니다</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
        <div className="flex gap-3">
          <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">차단 기능 안내</p>
            <ul className="space-y-1 text-amber-700">
              <li>• 차단한 사용자의 모임과 게시물이 보이지 않습니다</li>
              <li>• 차단한 사용자는 회원님의 프로필을 볼 수 없습니다</li>
              <li>• 차단을 해제하면 다시 서로를 볼 수 있습니다</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Blocked Users List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">차단한 사용자</h2>
            <span className="text-sm text-gray-500">{blockedUsers.length}명</span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : blockedUsers.length === 0 ? (
            <div className="text-center py-12">
              <Ban className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">차단한 사용자가 없습니다</p>
              <p className="text-sm text-gray-400 mt-1">
                불쾌한 사용자는 프로필에서 차단할 수 있습니다
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
                >
                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                    {item.blocked.profile?.avatarUrl ? (
                      <img
                        src={item.blocked.profile.avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-lg font-medium text-gray-400">
                        {item.blocked.nickname?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {item.blocked.nickname}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(item.createdAt)} 차단
                    </p>
                  </div>

                  {/* Action */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(item.blocked.id, item.blocked.nickname)}
                    disabled={unblockMutation.isPending}
                    className="rounded-xl"
                  >
                    <UserX className="h-4 w-4 mr-1.5" />
                    차단 해제
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
