'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { useLogout } from '@/hooks/use-auth';

export function Header() {
  const { user, isAuthenticated } = useAuthStore();
  const { mutate: logout } = useLogout();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-primary-600">
            소모임
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/meetings"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              모임 둘러보기
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <>
              <Link
                href="/profile"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                {user.nickname}
              </Link>
              <Button variant="ghost" size="sm" onClick={() => logout()}>
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  로그인
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">회원가입</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
