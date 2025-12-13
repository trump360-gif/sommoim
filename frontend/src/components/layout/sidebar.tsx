'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, type PageSection } from '@/lib/api/admin';
import { cn } from '@/lib/utils';

// ================================
// Constants
// ================================

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

// 섹션 타입별 기본 설정
const SECTION_CONFIG: Record<string, { icon: string; defaultLabel: string; getId: (section: PageSection) => string }> = {
  hero: { icon: '🎯', defaultLabel: '히어로', getId: () => 'hero' },
  categories: { icon: '📂', defaultLabel: '카테고리', getId: () => 'categories' },
  meetings: {
    icon: '🔥',
    defaultLabel: '모임',
    getId: (section) => {
      const layout = section.layoutJson as { sort?: string };
      return layout?.sort === 'latest' ? 'latest-meetings' : 'popular-meetings';
    },
  },
  featured: { icon: '⭐', defaultLabel: '추천', getId: () => 'featured' },
};

// 고정 섹션 (API에서 가져오지 않는 섹션)
const FIXED_SECTIONS = [
  { id: 'stats', label: '소모임 현황', icon: '📊' },
  { id: 'trending', label: '지금 뜨는 모임', icon: '🔥' },
  { id: 'recent-activities', label: '최근 활동', icon: '⚡' },
];

// ================================
// Component
// ================================

export function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const isHomePage = pathname === '/';

  // 섹션 데이터 가져오기 (홈페이지에서만)
  const { data: sections } = useQuery<PageSection[]>({
    queryKey: ['public', 'sections'],
    queryFn: () => adminApi.getPublicSections(),
    enabled: isHomePage,
  });

  // 섹션을 사이드바 아이템으로 변환
  const getSidebarItems = () => {
    if (!sections) return [];

    const sortedSections = sections
      .filter((s) => s.isActive && s.type !== 'hero') // hero는 스크롤 대상 아님
      .sort((a, b) => a.order - b.order);

    const dynamicItems = sortedSections.map((section) => {
      const config = SECTION_CONFIG[section.type];
      if (!config) return null;

      return {
        id: config.getId(section),
        label: section.title || config.defaultLabel,
        icon: config.icon,
      };
    }).filter(Boolean) as { id: string; label: string; icon: string }[];

    // 고정 섹션 추가 (통계, 트렌딩, 최근활동)
    return [...dynamicItems, ...FIXED_SECTIONS];
  };

  const sidebarItems = getSidebarItems();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-gray-200 bg-white/50 backdrop-blur-sm transition-all duration-300 supports-[backdrop-filter]:bg-white/50 overflow-y-auto">
      <nav className="flex flex-col gap-1 p-4">
        {/* 메뉴 섹션 */}
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

        {/* 홈 섹션 바로가기 - 홈페이지에서만 표시 */}
        {isHomePage && sidebarItems.length > 0 && (
          <>
            <div className="mb-2 mt-6 px-3 text-xs font-bold uppercase tracking-wider text-gray-400">바로가기</div>
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 text-left"
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </>
        )}

        {/* 내 활동 섹션 - 로그인 사용자만 */}
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
