'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, Notification } from '@/lib/api/notifications';

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
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString('ko-KR');
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  // 읽지 않은 알림 조회 (30초마다 폴링)
  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsApi.getUnread(),
    refetchInterval: 30000, // 30초마다 자동 새로고침
    staleTime: 10000,
  });

  const unreadCount = unreadNotifications.length;

  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    setIsOpen(false);
    if (notification.data?.meetingId) {
      router.push(`/meetings/${notification.data.meetingId}`);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 알림 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        aria-label="알림"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {/* 읽지 않은 알림 배지 */}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {/* 헤더 */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="font-semibold text-gray-900">알림</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                모두 읽음
              </button>
            )}
          </div>

          {/* 알림 목록 */}
          <div className="max-h-96 overflow-y-auto">
            {unreadNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                새로운 알림이 없습니다
              </div>
            ) : (
              unreadNotifications.slice(0, 5).map((notification: Notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="cursor-pointer border-b border-gray-50 px-4 py-3 hover:bg-gray-50"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded bg-primary-100 px-1.5 py-0.5 text-xs font-medium text-primary-700">
                      {typeLabels[notification.type] || notification.type}
                    </span>
                    {notification.priority === 'HIGH' && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-600">
                        중요
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                  <p className="line-clamp-2 text-xs text-gray-600">{notification.message}</p>
                  <p className="mt-1 text-xs text-gray-400">{formatDate(notification.createdAt)}</p>
                </div>
              ))
            )}
          </div>

          {/* 푸터 */}
          <Link
            href="/notifications"
            onClick={() => setIsOpen(false)}
            className="block border-t border-gray-100 px-4 py-3 text-center text-sm font-medium text-primary-600 hover:bg-gray-50"
          >
            모든 알림 보기
          </Link>
        </div>
      )}
    </div>
  );
}
