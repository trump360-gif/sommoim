'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const adminMenuItems = [
  { href: '/admin', label: '대시보드', icon: '📊' },
  { href: '/admin/users', label: '사용자 관리', icon: '👥' },
  { href: '/admin/meetings', label: '모임 관리', icon: '📅' },
  { href: '/admin/reports', label: '신고 관리', icon: '🚨' },
  { href: '/admin/sections', label: '섹션 관리', icon: '🧩' },
  { href: '/admin/banners', label: '배너 관리', icon: '🖼️' },
  { href: '/admin/categories', label: '카테고리 관리', icon: '🏷️' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-60 border-r border-gray-200 bg-slate-900">
      <nav className="flex flex-col gap-1 p-4">
        <div className="mb-4 px-3">
          <span className="text-lg font-bold text-white">관리자 패널</span>
        </div>
        <div className="mb-2 px-3 text-xs font-semibold uppercase text-slate-400">관리 메뉴</div>
        {adminMenuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                ? 'bg-primary-600 font-medium text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <div className="mb-2 mt-6 px-3 text-xs font-semibold uppercase text-slate-400">바로가기</div>
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <span>🏠</span>
          사용자 홈으로
        </Link>
      </nav>
    </aside>
  );
}
