'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    ChevronRight,
    Menu,
    X,
    LayoutDashboard,
    Users,
    Calendar,
    Flag,
    Puzzle,
    Image as ImageIcon,
    Tag,
    Settings,
    FileText,
    HardDrive,
    type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
    const paths = pathname.split('/').filter(Boolean);

    const breadcrumbs: BreadcrumbItem[] = [
        { label: '홈', href: '/admin' }
    ];

    const pathMap: Record<string, string> = {
        'users': '사용자',
        'meetings': '모임',
        'reports': '신고',
        'sections': '섹션',
        'banners': '배너',
        'categories': '카테고리',
        'settings': '시스템 설정',
        'logs': '활동 로그',
        'files': '파일 관리',
    };

    paths.forEach((path, index) => {
        if (path === 'admin') return;

        const label = pathMap[path] || path;
        const href = index === paths.length - 1 ? undefined : `/${paths.slice(0, index + 1).join('/')}`;

        breadcrumbs.push({ label, href });
    });

    return breadcrumbs;
}

export function AdminHeader({ onMenuClick }: { onMenuClick?: () => void }) {
    const pathname = usePathname();
    const breadcrumbs = generateBreadcrumbs(pathname);

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="flex items-center justify-between px-4 lg:px-8 py-4">
                {/* Mobile Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                >
                    <Menu className="h-6 w-6" />
                </button>

                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm">
                    {breadcrumbs.map((crumb, index) => (
                        <div key={index} className="flex items-center gap-2">
                            {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
                            {crumb.href ? (
                                <Link
                                    href={crumb.href}
                                    className="text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className="text-gray-900 font-medium">{crumb.label}</span>
                            )}
                        </div>
                    ))}
                </nav>

                {/* User Menu */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="text-sm text-gray-600 hover:text-gray-900"
                    >
                        사이트로 이동
                    </Link>
                </div>
            </div>
        </header>
    );
}

export function MobileSidebar({
    isOpen,
    onClose
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const pathname = usePathname();

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
                { label: '배너', href: '/admin/banners', icon: ImageIcon },
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

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-300 lg:hidden flex flex-col',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-white hover:bg-gray-800 rounded-lg"
                >
                    <X className="h-6 w-6" />
                </button>

                {/* Logo */}
                <div className="p-6 border-b border-gray-800">
                    <Link href="/admin" className="flex items-center gap-2" onClick={onClose}>
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
                                            onClick={onClose}
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
            </aside>
        </>
    );
}

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
}

interface NavSection {
    title: string;
    items: NavItem[];
}
