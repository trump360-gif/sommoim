'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usersApi, BookmarksResponse } from '@/lib/api/users';
import { useAuth } from '@/contexts/AuthContext';
import { MeetingCard } from '@/components/meeting/meeting-card';
import { Button } from '@/components/ui/button';

export default function BookmarksPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: bookmarks, isLoading } = useQuery<BookmarksResponse>({
    queryKey: ['my-bookmarks'],
    queryFn: () => usersApi.getMyBookmarks(),
    enabled: isAuthenticated,
  });

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-gray-600">로그인이 필요합니다</p>
          <Button onClick={() => router.push('/auth/login')}>로그인</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">북마크</h1>

      {isLoading ? (
        <div className="py-8 text-center text-gray-500">로딩 중...</div>
      ) : !bookmarks?.data?.length ? (
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl">🔖</div>
          <p className="mb-2 text-xl font-medium text-gray-700">북마크한 모임이 없습니다</p>
          <p className="mb-6 text-gray-500">관심 있는 모임을 북마크해보세요</p>
          <Link href="/meetings">
            <Button>모임 찾아보기</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {bookmarks.data.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}
