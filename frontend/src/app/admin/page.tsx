'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, DashboardStats } from '@/lib/api/admin';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['admin-dashboard'],
    queryFn: adminApi.getDashboard,
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-500">관리자 권한이 필요합니다</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center">로딩 중...</div>;
  }

  const statCards = [
    { label: '전체 사용자', value: stats?.userCount || 0, href: '/admin/users', color: 'bg-blue-500' },
    { label: '전체 모임', value: stats?.meetingCount || 0, href: '/admin/meetings', color: 'bg-green-500' },
    { label: '활성 사용자 (7일)', value: stats?.activeUsers || 0, href: '/admin/users', color: 'bg-purple-500' },
    { label: '대기 중 신고', value: stats?.pendingReports || 0, href: '/admin/reports', color: 'bg-red-500' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">관리자 대시보드</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="cursor-pointer hover:shadow-lg" onClick={() => router.push(stat.href)}>
            <CardHeader className="pb-2">
              <span className="text-sm text-gray-500">{stat.label}</span>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-lg ${stat.color} flex items-center justify-center text-white`}>
                  <span className="text-xl font-bold">{stat.value}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">콘텐츠 관리</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            <button onClick={() => router.push('/admin/users')} className="w-full rounded-lg bg-gray-100 p-3 text-left hover:bg-gray-200">
              👥 사용자 관리
            </button>
            <button onClick={() => router.push('/admin/meetings')} className="w-full rounded-lg bg-gray-100 p-3 text-left hover:bg-gray-200">
              📅 모임 관리
            </button>
            <button onClick={() => router.push('/admin/reports')} className="w-full rounded-lg bg-gray-100 p-3 text-left hover:bg-gray-200">
              🚨 신고 처리
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">홈페이지 관리</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            <button onClick={() => router.push('/admin/sections')} className="w-full rounded-lg bg-gray-100 p-3 text-left hover:bg-gray-200">
              🧩 섹션 관리 - 홈페이지 레이아웃 구성
            </button>
            <button onClick={() => router.push('/admin/banners')} className="w-full rounded-lg bg-gray-100 p-3 text-left hover:bg-gray-200">
              🖼️ 배너 관리 - 프로모션 배너 설정
            </button>
            <button onClick={() => router.push('/admin/categories')} className="w-full rounded-lg bg-gray-100 p-3 text-left hover:bg-gray-200">
              🏷️ 카테고리 관리 - 모임 카테고리 설정
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
