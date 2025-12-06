'use client';

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
    ChevronRight,
    type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const navSections: NavSection[] = [
    {
        title: '콘텐츠 관리',
        items: [
            { label: '대시보드', href: '/admin', icon: LayoutDashboard },
            { label: '사용자', href: '/admin/users', icon: Users },
            { label: '모임', href: '/admin/meetings', icon: Calendar },
            { label: '신고', href: '/admin/reports', icon: Flag },
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
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-gray-900 text-white">
            {/* Logo */}
            <div className="p-6 border-b border-gray-800">
                <Link href="/admin" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
                        <span className="text-white font-bold">S</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">소모임</h1>
                        <p className="text-xs text-gray-400">Admin</p>
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
                                        {isActive && (
                                            <ChevronRight className="ml-auto h-4 w-4" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="text-sm font-medium">A</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">Admin</p>
                        <p className="text-xs text-gray-400 truncate">관리자</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
