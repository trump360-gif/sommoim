'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetHeader, SheetContent } from '@/components/ui/sheet';
import {
  Home,
  Search,
  Users,
  Bookmark,
  Bell,
  Calendar,
  User,
  Settings,
  LogOut,
  Shield,
  Heart,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ================================
// Types & Interfaces
// ================================

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

// ================================
// Constants
// ================================

const NAV_ITEMS: NavItem[] = [
  { label: '홈', href: '/', icon: <Home className="h-5 w-5" /> },
  { label: '모임 찾기', href: '/meetings', icon: <Search className="h-5 w-5" /> },
  { label: '내 모임', href: '/mypage', icon: <Users className="h-5 w-5" />, requiresAuth: true },
  { label: '북마크', href: '/bookmarks', icon: <Bookmark className="h-5 w-5" />, requiresAuth: true },
  { label: '알림', href: '/notifications', icon: <Bell className="h-5 w-5" />, requiresAuth: true },
  { label: '일정', href: '/calendar', icon: <Calendar className="h-5 w-5" />, requiresAuth: true },
];

const USER_MENU_ITEMS: NavItem[] = [
  { label: '프로필 수정', href: '/mypage/edit', icon: <User className="h-5 w-5" /> },
  { label: '팔로워/팔로잉', href: '/mypage/followers', icon: <Heart className="h-5 w-5" /> },
  { label: '계정 설정', href: '/mypage/settings', icon: <Settings className="h-5 w-5" /> },
];

// ================================
// Component
// ================================

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  // ================================
  // Handlers
  // ================================

  const handleNavClick = () => {
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  // ================================
  // Render
  // ================================

  return (
    <Sheet isOpen={isOpen} onClose={onClose} side="right">
      {/* User Profile Section */}
      <SheetHeader className="bg-gradient-to-br from-primary-500 to-primary-700 text-white border-none">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-4 pt-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-xl font-bold">
              {user.nickname?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg truncate">{user.nickname}</p>
              <p className="text-sm text-white/80 truncate">{user.email}</p>
            </div>
          </div>
        ) : (
          <div className="pt-2">
            <p className="text-lg font-semibold">소모임</p>
            <p className="text-sm text-white/80">로그인하고 모임에 참여하세요</p>
          </div>
        )}
      </SheetHeader>

      <SheetContent className="p-0">
        {/* Quick Action */}
        {isAuthenticated && (
          <div className="p-4 border-b border-gray-100">
            <Link
              href="/meetings/create"
              onClick={handleNavClick}
              className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              새 모임 만들기
            </Link>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="p-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2">
            메뉴
          </div>
          {NAV_ITEMS.filter(item => !item.requiresAuth || isAuthenticated).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <span className={isActive ? 'text-primary-600' : 'text-gray-400'}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Menu (Authenticated) */}
        {isAuthenticated && (
          <nav className="p-2 border-t border-gray-100">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2">
              내 계정
            </div>
            {USER_MENU_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <span className={isActive ? 'text-primary-600' : 'text-gray-400'}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            {/* Admin Link */}
            {user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                onClick={handleNavClick}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-primary-700 bg-primary-50 mt-1"
              >
                <Shield className="h-5 w-5 text-primary-600" />
                <span className="font-medium">관리자</span>
              </Link>
            )}
          </nav>
        )}

        {/* Auth Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">로그아웃</span>
            </button>
          ) : (
            <div className="flex gap-3">
              <Link
                href="/auth/login"
                onClick={handleNavClick}
                className="flex-1 py-3 text-center text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/auth/register"
                onClick={handleNavClick}
                className="flex-1 py-3 text-center text-white bg-primary-600 rounded-xl font-medium hover:bg-primary-700 transition-colors"
              >
                회원가입
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
