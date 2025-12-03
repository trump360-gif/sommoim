'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const publicMenuItems = [
  { href: '/', label: '홈', icon: '🏠' },
  { href: '/meetings', label: '모임 둘러보기', icon: '🔍' },
];

const userMenuItems = [
  { href: '/meetings/create', label: '모임 만들기', icon: '➕' },
  { href: '/bookmarks', label: '북마크', icon: '🔖' },
  { href: '/mypage', label: '마이페이지', icon: '👤' },
  { href: '/notifications', label: '알림', icon: '🔔' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-60 border-r border-gray-200 bg-white">
      <nav className="flex flex-col gap-1 p-4">
        <div className="mb-2 px-3 text-xs font-semibold uppercase text-gray-400">메뉴</div>
        {publicMenuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              pathname === item.href
                ? 'bg-primary-50 font-medium text-primary-600'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {isAuthenticated && (
          <>
            <div className="mb-2 mt-4 px-3 text-xs font-semibold uppercase text-gray-400">내 활동</div>
            {userMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'bg-primary-50 font-medium text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
