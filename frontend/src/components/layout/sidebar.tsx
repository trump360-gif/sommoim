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
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-gray-200 bg-white/50 backdrop-blur-sm transition-all duration-300 supports-[backdrop-filter]:bg-white/50">
      <nav className="flex flex-col gap-1 p-4">
        <div className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-gray-400">메뉴</div>
        {publicMenuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
              pathname === item.href
                ? 'bg-primary-50 text-primary-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {isAuthenticated && (
          <>
            <div className="mb-2 mt-6 px-3 text-xs font-bold uppercase tracking-wider text-gray-400">내 활동</div>
            {userMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
