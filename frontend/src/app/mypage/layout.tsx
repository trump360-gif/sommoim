'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { usersApi } from '@/lib/api/users';
import { useAuth } from '@/contexts/AuthContext';
import { MypageSidebar } from '@/components/mypage/sidebar';

// ================================
// Component
// ================================

export default function MypageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: usersApi.getMe,
    enabled: isAuthenticated,
  });

  // Auth loading
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  // Profile loading
  if (isLoading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 pt-20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Sidebar - Hidden on mobile */}
          <div className="hidden lg:block">
            <MypageSidebar user={profile} />
          </div>

          {/* Main Content */}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
