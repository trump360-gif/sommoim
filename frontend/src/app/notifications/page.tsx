'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, Notification } from '@/lib/api/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const typeLabels: Record<string, string> = {
  PARTICIPANT_APPROVED: '참가 승인',
  PARTICIPANT_REJECTED: '참가 거절',
  SCHEDULE_CHANGED: '일정 변경',
  MEETING_CANCELLED: '모임 취소',
  NEW_REVIEW: '새 리뷰',
  REMINDER: '알림',
  NEW_APPLICATION: '새 참가 신청',
  MEMBER_WITHDRAWN: '멤버 탈퇴',
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return '방금 전';
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString('ko-KR');
}

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll(),
    enabled: isAuthenticated,
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: notificationsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-gray-600">로그인이 필요합니다</p>
          <Button onClick={() => router.push('/auth/login')}>로그인</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  const notifications = data?.data || [];
  const unreadCount = data?.meta?.unreadCount || 0;

  const handleClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    if (notification.data?.meetingId) {
      router.push(`/meetings/${notification.data.meetingId}`);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">알림</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500">읽지 않은 알림 {unreadCount}개</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllAsReadMutation.mutate()}>
            모두 읽음
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="py-16 text-center text-gray-500">
          <p>알림이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification: Notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                !notification.isRead ? 'border-l-4 border-l-primary-500 bg-primary-50' : ''
              }`}
              onClick={() => handleClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {typeLabels[notification.type] || notification.type}
                      </span>
                      {notification.priority === 'CRITICAL' && (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                          중요
                        </span>
                      )}
                    </div>
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(notification.id);
                    }}
                    className="ml-4 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
