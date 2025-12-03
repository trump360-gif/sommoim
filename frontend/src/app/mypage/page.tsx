'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usersApi, Participation, BookmarksResponse } from '@/lib/api/users';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MeetingCard } from '@/components/meeting/meeting-card';
import { MyCalendar } from '@/components/calendar/my-calendar';

type Tab = 'profile' | 'calendar' | 'participations' | 'bookmarks';

export default function MyPage() {
  const router = useRouter();
  const { logout, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: usersApi.getMe,
    enabled: isAuthenticated,
  });

  const { data: participations } = useQuery<Participation[]>({
    queryKey: ['my-participations'],
    queryFn: () => usersApi.getMyParticipations(),
    enabled: isAuthenticated && activeTab === 'participations',
  });

  const { data: bookmarks } = useQuery<BookmarksResponse>({
    queryKey: ['my-bookmarks'],
    queryFn: () => usersApi.getMyBookmarks(),
    enabled: isAuthenticated && activeTab === 'bookmarks',
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

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: '프로필' },
    { key: 'calendar', label: '내 일정' },
    { key: 'participations', label: '참여 모임' },
    { key: 'bookmarks', label: '북마크' },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">마이페이지</h1>

      <div className="mb-6 flex gap-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 font-medium ${
              activeTab === tab.key
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && profile && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-xl font-semibold">프로필 정보</h2>
            <Link href="/mypage/edit">
              <Button variant="outline" size="sm">수정</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-full bg-gray-200">
                {profile.profile?.avatarUrl ? (
                  <img src={profile.profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl text-gray-400">
                    {profile.nickname?.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xl font-semibold">{profile.nickname}</p>
                <p className="text-sm text-gray-500">{profile.email}</p>
              </div>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-gray-500">자기소개</p>
              <p>{profile.profile?.bio || '자기소개가 없습니다'}</p>
            </div>
            <div className="flex gap-8 text-sm">
              <div>
                <span className="font-semibold">{profile._count?.followers || 0}</span>
                <span className="ml-1 text-gray-500">팔로워</span>
              </div>
              <div>
                <span className="font-semibold">{profile._count?.following || 0}</span>
                <span className="ml-1 text-gray-500">팔로잉</span>
              </div>
              <div>
                <span className="font-semibold">{profile._count?.hostedMeetings || 0}</span>
                <span className="ml-1 text-gray-500">만든 모임</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'calendar' && <MyCalendar />}

      {activeTab === 'participations' && (
        <div className="space-y-4">
          {participations?.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>참여한 모임이 없습니다</p>
              <Link href="/meetings" className="mt-2 text-primary-600 hover:underline">
                모임 찾아보기
              </Link>
            </div>
          ) : (
            participations?.map((p: Participation) => (
              <Card key={p.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <Link href={`/meetings/${p.meeting.id}`} className="font-medium hover:underline">
                      {p.meeting.title}
                    </Link>
                    <p className="text-sm text-gray-500">
                      상태: {p.status === 'APPROVED' ? '승인됨' : p.status === 'PENDING' ? '대기중' : p.status}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'bookmarks' && (
        <div className="grid gap-6 sm:grid-cols-2">
          {bookmarks?.data?.length === 0 ? (
            <div className="col-span-full py-8 text-center text-gray-500">
              <p>북마크한 모임이 없습니다</p>
            </div>
          ) : (
            bookmarks?.data?.map((meeting: any) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))
          )}
        </div>
      )}

      <div className="mt-8 border-t pt-8">
        <Button variant="outline" onClick={logout}>
          로그아웃
        </Button>
      </div>
    </div>
  );
}
