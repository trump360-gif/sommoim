'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usersApi } from '@/lib/api/users';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Calendar, Users, Bookmark, Edit } from 'lucide-react';

// ================================
// Component
// ================================

export default function MyPage() {
  const { isAuthenticated, logout } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: usersApi.getMe,
    enabled: isAuthenticated,
  });

  const { data: myMeetingsData } = useQuery({
    queryKey: ['my-meetings'],
    queryFn: () => usersApi.getMyMeetings(),
    enabled: isAuthenticated,
  });

  const hostedCount = myMeetingsData?.hosted?.length || 0;
  const participatedCount = myMeetingsData?.participated?.length || 0;

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">프로필</h1>
        <Link href="/mypage/edit">
          <Button variant="outline" size="sm">
            <Edit className="mr-1.5 h-4 w-4" />
            수정
          </Button>
        </Link>
      </div>

      {/* Profile Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gray-100">
              {profile.profile?.avatarUrl ? (
                <img src={profile.profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-medium text-gray-400">
                  {profile.nickname?.charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{profile.nickname}</h2>
              <p className="text-sm text-gray-500">{profile.email}</p>

              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700">자기소개</p>
                <p className="mt-1 text-gray-600">{profile.profile?.bio || '자기소개가 없습니다'}</p>
              </div>

              {(profile.profile as any)?.location && (
                <p className="mt-3 text-sm text-gray-500">📍 {(profile.profile as any).location}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/mypage/meetings">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-lg bg-primary-100 p-3">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{hostedCount}</p>
                <p className="text-sm text-gray-500">만든 모임</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/mypage/meetings">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-lg bg-blue-100 p-3">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{participatedCount}</p>
                <p className="text-sm text-gray-500">참여 모임</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/bookmarks">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-lg bg-amber-100 p-3">
                <Bookmark className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">-</p>
                <p className="text-sm text-gray-500">북마크</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">빠른 작업</h3>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Link href="/meetings/create">
            <Button variant="outline" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              새 모임 만들기
            </Button>
          </Link>
          <Link href="/meetings">
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              모임 둘러보기
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Logout */}
      <div className="pt-4">
        <Button variant="ghost" onClick={logout} className="text-gray-500">
          로그아웃
        </Button>
      </div>
    </div>
  );
}
