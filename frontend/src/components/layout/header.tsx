'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { NotificationDropdown } from './notification-dropdown';
import {
  Calendar,
  Bookmark,
  User,
  Settings,
  LogOut,
  Users,
  Heart,
  Bell,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ================================
// Types & Interfaces
// ================================

interface MegaMenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
}

interface MegaMenuSection {
  title: string;
  items: MegaMenuItem[];
}

// ================================
// Constants
// ================================

const myMenuSections: MegaMenuSection[] = [
  {
    title: '나의 활동',
    items: [
      { label: '내 모임', href: '/mypage', icon: <Users className="h-4 w-4" />, description: '참여 중인 모임' },
      { label: '북마크', href: '/bookmarks', icon: <Bookmark className="h-4 w-4" />, description: '저장한 모임' },
      { label: '알림', href: '/notifications', icon: <Bell className="h-4 w-4" />, description: '새로운 소식' },
    ],
  },
  {
    title: '소셜',
    items: [
      { label: '팔로워', href: '/mypage/followers', icon: <Heart className="h-4 w-4" />, description: '나를 팔로우' },
      { label: '팔로잉', href: '/mypage/following', icon: <Users className="h-4 w-4" />, description: '내가 팔로우' },
    ],
  },
  {
    title: '설정',
    items: [
      { label: '프로필 수정', href: '/mypage/edit', icon: <User className="h-4 w-4" />, description: '내 정보 변경' },
      { label: '계정 설정', href: '/mypage/settings', icon: <Settings className="h-4 w-4" />, description: '알림, 개인정보' },
    ],
  },
];

// ================================
// Component
// ================================

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-gray-200/80 bg-white/80 backdrop-blur-md transition-all duration-300 supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo & Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-violet-600 shadow-lg shadow-primary-500/30 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary-500/40" />
              <div className="absolute inset-[2px] rounded-[10px] bg-gradient-to-br from-primary-400 to-primary-600" />
              <span className="relative text-lg font-black text-white drop-shadow-sm">S</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-gray-900">소모임</span>
              <span className="hidden text-[10px] font-medium tracking-widest text-gray-400 sm:block">SOMMOIM</span>
            </div>
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

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              {user.role === 'ADMIN' && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="hidden border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 sm:flex">
                    <Shield className="mr-1.5 h-3.5 w-3.5" />
                    관리자
                  </Button>
                </Link>
              )}

              <NotificationDropdown />

              {/* My Menu Trigger */}
              <button
                onMouseEnter={() => setIsMegaMenuOpen(true)}
                onMouseLeave={() => setIsMegaMenuOpen(false)}
                className={cn(
                  'flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-sm font-medium shadow-sm transition-all',
                  isMegaMenuOpen
                    ? 'border-primary-300 text-primary-700 shadow-md'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-md'
                )}
              >
                <span>{user.nickname}</span>
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isMegaMenuOpen && 'rotate-180')} />
              </button>

              <Button variant="ghost" size="sm" onClick={logout} className="text-gray-500 hover:text-gray-900">
                <LogOut className="h-4 w-4" />
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

      {/* Mega Menu Panel */}
      {isAuthenticated && (
        <div
          onMouseEnter={() => setIsMegaMenuOpen(true)}
          onMouseLeave={() => setIsMegaMenuOpen(false)}
          className={cn(
            'absolute left-0 right-0 top-full border-b border-gray-200 bg-white shadow-lg transition-all duration-200',
            isMegaMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'
          )}
        >
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 gap-8">
              {myMenuSections.map((section) => (
                <div key={section.title}>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {section.title}
                  </h3>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50"
                          onClick={() => setIsMegaMenuOpen(false)}
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors group-hover:bg-primary-100 group-hover:text-primary-600">
                            {item.icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.label}</p>
                            {item.description && (
                              <p className="text-xs text-gray-500">{item.description}</p>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex gap-6">
                <Link href="/mypage" className="group flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
                  <Calendar className="h-4 w-4" />
                  <span>참여 모임 <strong className="text-gray-900">3</strong>개</span>
                </Link>
                <Link href="/bookmarks" className="group flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
                  <Bookmark className="h-4 w-4" />
                  <span>북마크 <strong className="text-gray-900">5</strong>개</span>
                </Link>
              </div>
              <Link
                href="/meetings/create"
                className="rounded-full bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                새 모임 만들기
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
