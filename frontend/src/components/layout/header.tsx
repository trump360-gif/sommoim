'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { NotificationDropdown } from './notification-dropdown';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-gray-200/80 bg-white/80 backdrop-blur-md transition-all duration-300 supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 px-2 py-1 text-xl font-bold text-white shadow-sm">
              소모임
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/meetings"
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              모임 둘러보기
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              {user.role === 'ADMIN' && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="hidden border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 sm:flex">
                    관리자
                  </Button>
                </Link>
              )}
              <NotificationDropdown />
              <Link
                href="/mypage"
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
              >
                <span>{user.nickname}</span>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout} className="text-gray-500 hover:text-gray-900">
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="font-medium text-gray-600 hover:text-gray-900">
                  로그인
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="bg-primary-600 font-medium text-white shadow-sm hover:bg-primary-700">
                  회원가입
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
