'use client';

// ================================
// Imports
// ================================
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Users,
  Calendar,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Puzzle,
  Image,
  Tag,
  Flag,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, DashboardStats } from '@/lib/api/admin';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ================================
// Types & Interfaces
// ================================
interface StatCard {
  label: string;
  value: number;
  href: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

// ================================
// Constants
// ================================
const contentActions: QuickAction[] = [
  { label: '사용자 관리', description: '회원 목록 및 권한 관리', href: '/admin/users', icon: Users },
  { label: '모임 관리', description: '모임 목록 및 상태 관리', href: '/admin/meetings', icon: Calendar },
  { label: '신고 처리', description: '신고 내역 확인 및 처리', href: '/admin/reports', icon: Flag },
];

const homepageActions: QuickAction[] = [
  { label: '섹션 관리', description: '홈페이지 레이아웃 구성', href: '/admin/sections', icon: Puzzle },
  { label: '배너 관리', description: '프로모션 배너 설정', href: '/admin/banners', icon: Image },
  { label: '카테고리 관리', description: '모임 카테고리 설정', href: '/admin/categories', icon: Tag },
];

// ================================
// Helper Functions
// ================================
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

// ================================
// Sub Components
// ================================
function StatCardItem({ stat, onClick }: { stat: StatCard; onClick: () => void }) {
  const Icon = stat.icon;
  const TrendIcon = stat.trend === 'up' ? TrendingUp : stat.trend === 'down' ? TrendingDown : null;

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className={`rounded-lg p-3 ${stat.bgColor}`}>
            <Icon className={`h-6 w-6 ${stat.color}`} />
          </div>
          {TrendIcon && stat.trendValue && (
            <div className={`flex items-center gap-1 text-sm ${
              stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendIcon className="h-4 w-4" />
              <span>{stat.trendValue}</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">{stat.label}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({ action, onClick }: { action: QuickAction; onClick: () => void }) {
  const Icon = action.icon;

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-lg bg-gray-50 p-4 text-left transition-colors hover:bg-gray-100"
    >
      <div className="rounded-lg bg-white p-2 shadow-sm">
        <Icon className="h-5 w-5 text-gray-600" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{action.label}</p>
        <p className="text-sm text-gray-500">{action.description}</p>
      </div>
      <ArrowRight className="h-5 w-5 text-gray-400" />
    </button>
  );
}

function RecentReportItem({ report }: { report: any }) {
  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    RESOLVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-gray-100 text-gray-700',
  };
  const statusLabels: Record<string, string> = {
    PENDING: '대기',
    PROCESSING: '처리중',
    RESOLVED: '해결',
    REJECTED: '반려',
  };

  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <div>
          <p className="text-sm font-medium text-gray-900">
            {report.type === 'USER' ? '사용자 신고' : '모임 신고'}
          </p>
          <p className="text-xs text-gray-500">{formatDate(report.createdAt)}</p>
        </div>
      </div>
      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[report.status]}`}>
        {statusLabels[report.status]}
      </span>
    </div>
  );
}

// ================================
// Main Component
// ================================
export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['admin-dashboard'],
    queryFn: adminApi.getDashboard,
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  const { data: recentReports } = useQuery({
    queryKey: ['admin-recent-reports'],
    queryFn: () => adminApi.getReports(1, 5),
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  // ================================
  // Auth Check
  // ================================
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-500">관리자 권한이 필요합니다</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent mx-auto" />
          <p className="mt-2 text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  // ================================
  // Stat Cards Data
  // ================================
  const statCards: StatCard[] = [
    {
      label: '전체 사용자',
      value: stats?.userCount || 0,
      href: '/admin/users',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: 'up',
      trendValue: '+12%',
    },
    {
      label: '전체 모임',
      value: stats?.meetingCount || 0,
      href: '/admin/meetings',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: 'up',
      trendValue: '+8%',
    },
    {
      label: '활성 사용자 (7일)',
      value: stats?.activeUsers || 0,
      href: '/admin/users',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      trend: 'neutral',
    },
    {
      label: '대기 중 신고',
      value: stats?.pendingReports || 0,
      href: '/admin/reports',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      trend: stats?.pendingReports && stats.pendingReports > 0 ? 'up' : 'neutral',
      trendValue: stats?.pendingReports && stats.pendingReports > 0 ? '처리 필요' : undefined,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="mt-1 text-gray-500">플랫폼 현황을 한눈에 확인하세요</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <StatCardItem
            key={stat.label}
            stat={stat}
            onClick={() => router.push(stat.href)}
          />
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Content Management */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">콘텐츠 관리</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {contentActions.map((action) => (
              <QuickActionCard
                key={action.href}
                action={action}
                onClick={() => router.push(action.href)}
              />
            ))}
          </CardContent>
        </Card>

        {/* Homepage Management */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">홈페이지 관리</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {homepageActions.map((action) => (
              <QuickActionCard
                key={action.href}
                action={action}
                onClick={() => router.push(action.href)}
              />
            ))}
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">최근 신고</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/reports')}
              className="text-primary-600"
            >
              전체보기
            </Button>
          </CardHeader>
          <CardContent>
            {recentReports?.data && recentReports.data.length > 0 ? (
              <div>
                {recentReports.data.slice(0, 5).map((report: any) => (
                  <RecentReportItem key={report.id} report={report} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <AlertTriangle className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2">처리할 신고가 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
