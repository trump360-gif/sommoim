'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
    LayoutDashboard,
    Users,
    Calendar,
    Flag,
    Puzzle,
    Image,
    Tag,
    ChevronRight,
    Settings,
    FileText,
    HardDrive,
    Home,
    type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api/admin';

// ================================
// Types & Interfaces
// ================================

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    badgeKey?: string;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

// ================================
// Constants
// ================================

const navSections: NavSection[] = [
    {
        title: '콘텐츠 관리',
        items: [
            { label: '대시보드', href: '/admin', icon: LayoutDashboard },
            { label: '사용자', href: '/admin/users', icon: Users },
            { label: '모임', href: '/admin/meetings', icon: Calendar },
            { label: '신고', href: '/admin/reports', icon: Flag, badgeKey: 'pendingReports' },
        ],
    },
    {
        title: '홈페이지 관리',
        items: [
            { label: '섹션', href: '/admin/sections', icon: Puzzle },
            { label: '배너', href: '/admin/banners', icon: Image },
            { label: '카테고리', href: '/admin/categories', icon: Tag },
        ],
    },
    {
        title: '시스템 관리',
        items: [
            { label: '시스템 설정', href: '/admin/settings', icon: Settings },
            { label: '활동 로그', href: '/admin/logs', icon: FileText },
            { label: '파일 관리', href: '/admin/files', icon: HardDrive },
        ],
    },
];

// ================================
// Component
// ================================

export function AdminSidebar() {
    const pathname = usePathname();
    const { user } = useAuth();

    // 대시보드 통계 가져오기 (배지용)
    const { data: dashboardStats } = useQuery({
        queryKey: ['admin', 'dashboard'],
        queryFn: () => adminApi.getDashboard(),
        refetchInterval: 60000, // 1분마다 새로고침
    });

    // 배지 값 가져오기 헬퍼
    const getBadgeValue = (key?: string): number | undefined => {
        if (!key || !dashboardStats) return undefined;
        return (dashboardStats as unknown as Record<string, number>)[key];
    };

    return (
        <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-gray-900 text-white">
            {/* Logo */}
            <div className="p-6 border-b border-gray-800">
                <Link href="/admin" className="group flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-400 via-primary-500 to-violet-500 opacity-90 transition-all duration-300 group-hover:opacity-100" />
                        <div className="absolute inset-[2px] rounded-[10px] bg-gradient-to-br from-primary-500 to-primary-600" />
                        <span className="relative text-xl font-black text-white drop-shadow-sm">S</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">소모임</h1>
                        <p className="text-[10px] font-medium tracking-widest text-gray-500">관리자</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                {navSections.map((section) => (
                    <div key={section.title}>
                        <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {section.title}
                        </h3>
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                const badgeValue = getBadgeValue(item.badgeKey);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                            isActive
                                                ? 'bg-gray-800 text-white'
                                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{item.label}</span>
                                        {/* 배지 표시 */}
                                        {badgeValue !== undefined && badgeValue > 0 && (
                                            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                                                {badgeValue > 99 ? '99+' : badgeValue}
                                            </span>
                                        )}
                                        {isActive && !badgeValue && (
                                            <ChevronRight className="ml-auto h-4 w-4" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer - 실제 사용자 정보 */}
            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center gap-3 px-3 py-2">
                    {user?.profile?.avatarUrl ? (
                        <img
                            src={user.profile.avatarUrl}
                            alt={user.nickname || 'Admin'}
                            className="h-8 w-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                                {user?.nickname?.charAt(0).toUpperCase() || 'A'}
                            </span>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user?.nickname || 'Admin'}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email || '관리자'}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
