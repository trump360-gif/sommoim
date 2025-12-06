'use client';

// ================================
// Imports
// ================================
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Flag,
  Puzzle,
  Image,
  Tag,
  Home,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ================================
// Types & Interfaces
// ================================
interface MenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// ================================
// Constants
// ================================
const adminMenuItems: MenuItem[] = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/users', label: '사용자 관리', icon: Users },
  { href: '/admin/meetings', label: '모임 관리', icon: Calendar },
  { href: '/admin/reports', label: '신고 관리', icon: Flag },
  { href: '/admin/sections', label: '섹션 관리', icon: Puzzle },
  { href: '/admin/banners', label: '배너 관리', icon: Image },
  { href: '/admin/categories', label: '카테고리 관리', icon: Tag },
];

// ================================
// Component
// ================================
export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-gray-200 bg-slate-900 shadow-xl transition-all duration-300">
      <nav className="flex flex-col gap-1 p-4">
        <div className="mb-6 px-3">
          <span className="text-lg font-bold tracking-tight text-white">관리자 패널</span>
          <p className="text-xs text-slate-400">시스템 관리 및 모니터링</p>
        </div>

        <div className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">
          관리 메뉴
        </div>

        {adminMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
              {item.label}
            </Link>
          );
        })}

        <div className="mb-2 mt-8 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">
          바로가기
        </div>

        <Link
          href="/"
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-slate-800 hover:text-white"
        >
          <Home className="h-4 w-4 transition-transform group-hover:scale-110" />
          사용자 홈으로
        </Link>
      </nav>
    </aside>
  );
}
