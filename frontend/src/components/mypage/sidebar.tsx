'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  Calendar,
  Users,
  Bookmark,
  Heart,
  Settings,
  Bell,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ================================
// Types & Interfaces
// ================================

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface MypageSidebarProps {
  user: {
    nickname: string;
    email: string;
    profile?: {
      avatarUrl?: string;
    };
    _count?: {
      followers?: number;
      following?: number;
    };
  };
}

// ================================
// Constants
// ================================

const navSections: NavSection[] = [
  {
    title: '나의 활동',
    items: [
      { label: '프로필', href: '/mypage', icon: User },
      { label: '내 일정', href: '/mypage/calendar', icon: Calendar },
      { label: '참여 모임', href: '/mypage/meetings', icon: Users },
      { label: '북마크', href: '/bookmarks', icon: Bookmark },
    ],
  },
  {
    title: '소셜',
    items: [
      { label: '팔로워/팔로잉', href: '/mypage/followers', icon: Heart },
    ],
  },
  {
    title: '설정',
    items: [
      { label: '프로필 수정', href: '/mypage/edit', icon: Settings },
      { label: '알림 설정', href: '/mypage/notifications', icon: Bell },
      { label: '차단 관리', href: '/mypage/blocked', icon: Shield },
    ],
  },
];

// ================================
// Component
// ================================

export function MypageSidebar({ user }: MypageSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0">
      {/* Profile Card */}
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 overflow-hidden rounded-full bg-gray-100">
            {user.profile?.avatarUrl ? (
              <img
                src={user.profile.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-medium text-gray-400">
                {user.nickname?.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{user.nickname}</p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-around border-t border-gray-100 pt-4">
          <Link href="/mypage/followers" className="text-center hover:text-primary-600">
            <p className="text-lg font-bold text-gray-900">{user._count?.followers || 0}</p>
            <p className="text-xs text-gray-500">팔로워</p>
          </Link>
          <Link href="/mypage/following" className="text-center hover:text-primary-600">
            <p className="text-lg font-bold text-gray-900">{user._count?.following || 0}</p>
            <p className="text-xs text-gray-500">팔로잉</p>
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav className="rounded-2xl bg-white p-4 shadow-sm">
        {navSections.map((section, idx) => (
          <div key={section.title} className={cn(idx > 0 && 'mt-6')}>
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="ml-auto rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
