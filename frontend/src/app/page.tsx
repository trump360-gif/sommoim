'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { meetingsApi, RecommendedMeeting } from '@/lib/api/meetings';
import { adminApi, type Banner, type CategoryEntity, type PageSection } from '@/lib/api/admin';
import { MeetingCard } from '@/components/meeting/meeting-card';
import {
    BannerCarousel,
    BannerCarouselSkeleton,
    HeroSection,
    StatsSection,
    TrendingSection,
    RecentActivitySection,
} from '@/components/home';
import { statsApi } from '@/lib/api/stats';
import type { PublicStats, RecentActivity } from '@/types/stats';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles } from 'lucide-react';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/animation';
import type { Meeting, PaginatedResponse } from '@/types';

// ================================
// Types & Interfaces
// ================================

const DEFAULT_CATEGORIES = [
    { key: 'SPORTS', label: '운동', icon: '⚽', color: 'bg-green-500' },
    { key: 'GAMES', label: '게임', icon: '🎮', color: 'bg-purple-500' },
    { key: 'FOOD', label: '음식', icon: '🍔', color: 'bg-orange-500' },
    { key: 'CULTURE', label: '문화', icon: '🎨', color: 'bg-pink-500' },
    { key: 'TRAVEL', label: '여행', icon: '✈️', color: 'bg-blue-500' },
    { key: 'STUDY', label: '스터디', icon: '📚', color: 'bg-yellow-500' },
];

interface MeetingsLayout {
    sort?: 'popular' | 'latest';
    limit?: number;
}

function CategoriesSection({
    section,
    categories,
}: {
    section: PageSection;
    categories: Array<{ key: string; label: string; icon: string; color: string | null }>;
}) {
    return (
        <section id="categories" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 scroll-mt-20">
            <h2 className="mb-8 text-3xl font-bold tracking-tight">{section.title || '카테고리'}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
                {categories.map((cat) => {
                    const isHexColor = cat.color?.startsWith('#');
                    return (
                        <Link
                            key={cat.key}
                            href={`/meetings?category=${cat.key}`}
                            className="group flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-soft transition-all duration-300 hover:shadow-medium hover:-translate-y-1"
                        >
                            <div
                                className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl transition-transform duration-300 group-hover:scale-110 ${!isHexColor && cat.color ? cat.color : 'bg-gradient-to-br from-primary-400 to-primary-600'}`}
                                style={isHexColor && cat.color ? { backgroundColor: cat.color } : undefined}
                            >
                                {cat.icon}
                            </div>
                            <span className="text-sm font-semibold text-gray-700">{cat.label}</span>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}

function MeetingsSection({
    section,
    meetings,
}: {
    section: PageSection;
    meetings?: Meeting[];
}) {
    const layout = (section.layoutJson || {}) as MeetingsLayout;
    const sortType = layout.sort || 'popular';
    const sortLink = sortType === 'popular' ? '/meetings?sort=popular' : '/meetings?sort=latest';
    const subtitle = sortType === 'popular'
        ? '지금 가장 핫한 모임을 만나보세요'
        : '새롭게 시작된 모임에 참여해보세요';
    const sectionId = sortType === 'popular' ? 'popular-meetings' : 'latest-meetings';

    return (
        <section id={sectionId} className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 scroll-mt-20">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{section.title || '모임'}</h2>
                    <p className="mt-2 text-gray-600">{subtitle}</p>
                </div>
                <Link href={sortLink} className="text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700">
                    더보기 →
                </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {meetings?.map((meeting) => (
                    <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
                {!meetings?.length && (
                    <p className="col-span-full rounded-2xl bg-gray-50 py-16 text-center text-gray-500">아직 모임이 없습니다</p>
                )}
            </div>
        </section>
    );
}

function RecommendedSection({ meetings }: { meetings: RecommendedMeeting[] }) {
    return (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
                        <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">맞춤 추천</h2>
                        <p className="mt-1 text-gray-600">관심사에 맞는 모임을 찾아봤어요</p>
                    </div>
                </div>
                <Link href="/mypage/edit" className="text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700">
                    관심사 설정 →
                </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {meetings.map((meeting) => (
                    <div key={meeting.id} className="relative">
                        <MeetingCard meeting={meeting} />
                        {meeting.reason && meeting.reason.length > 0 && (
                            <div className="absolute -top-2 left-3 flex flex-wrap gap-1">
                                {meeting.reason.slice(0, 2).map((r, i) => (
                                    <span
                                        key={i}
                                        className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-0.5 text-xs font-medium text-white shadow-sm"
                                    >
                                        {r}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

function FeaturedSection({ section }: { section: PageSection }) {
    return (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-primary-700 p-12 text-center shadow-xl">
                <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                <div className="relative z-10">
                    <h2 className="mb-4 text-3xl font-bold text-white">{section.title || '나만의 모임을 시작해보세요'}</h2>
                    <p className="mb-8 text-lg text-white/90">관심사가 같은 사람들이 모일 수 있는 공간을 만들어보세요</p>
                    <Link href="/meetings/create">
                        <Button size="lg" className="bg-white px-8 py-6 text-base font-semibold text-primary-600 shadow-lg transition-all hover:scale-105 hover:bg-gray-50">
                            모임 만들기
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}

// ================================
// Main Component
// ================================

export default function HomePage() {
    const { isAuthenticated } = useAuth();

    const { data: sections } = useQuery<PageSection[]>({
        queryKey: ['public', 'sections'],
        queryFn: () => adminApi.getPublicSections(),
    });

    const { data: banners, isLoading: bannersLoading } = useQuery<Banner[]>({
        queryKey: ['public', 'banners'],
        queryFn: () => adminApi.getPublicBanners(),
    });

    const handleBannerClick = (bannerId: string) => {
        adminApi.trackBannerClick(bannerId).catch(() => { });
    };

    const { data: adminCategories } = useQuery<CategoryEntity[]>({
        queryKey: ['public', 'categories'],
        queryFn: () => adminApi.getPublicCategories(),
    });

    const { data: recommendedMeetings } = useQuery<RecommendedMeeting[]>({
        queryKey: ['meetings', 'recommended'],
        queryFn: () => meetingsApi.getRecommended(4),
        enabled: isAuthenticated,
    });

    const { data: latestMeetings } = useQuery<PaginatedResponse<Meeting>>({
        queryKey: ['meetings', 'latest'],
        queryFn: () => meetingsApi.getAll({ limit: 4, sort: 'latest', status: 'RECRUITING' }),
    });

    const { data: popularMeetings } = useQuery<PaginatedResponse<Meeting>>({
        queryKey: ['meetings', 'popular'],
        queryFn: () => meetingsApi.getAll({ limit: 4, sort: 'popular', status: 'RECRUITING' }),
    });

    // 새로운 데이터 쿼리들
    const { data: publicStats, isLoading: statsLoading } = useQuery<PublicStats>({
        queryKey: ['public', 'stats'],
        queryFn: () => statsApi.getPublicStats(),
    });

    const { data: trendingMeetings, isLoading: trendingLoading } = useQuery<PaginatedResponse<Meeting>>({
        queryKey: ['meetings', 'trending'],
        queryFn: () => meetingsApi.getAll({ limit: 8, sort: 'popular', status: 'RECRUITING' }),
    });

    const { data: recentActivities, isLoading: activitiesLoading } = useQuery<RecentActivity[]>({
        queryKey: ['public', 'recent-activities'],
        queryFn: () => statsApi.getRecentActivities(8),
    });

    const categories = adminCategories?.length
        ? adminCategories.map((cat) => ({
            key: cat.name.toUpperCase(),
            label: cat.name,
            icon: cat.icon || '📌',
            color: cat.color || null,
        }))
        : DEFAULT_CATEGORIES;

    // 섹션을 order 순서대로 정렬 (이미 API에서 정렬되어 오지만 안전을 위해)
    const sortedSections = sections?.slice().sort((a, b) => a.order - b.order) || [];

    // 섹션 타입별 렌더링
    const renderSection = (section: PageSection) => {
        if (!section.isActive) return null;

        const layout = section.layoutJson as MeetingsLayout;

        switch (section.type) {
            case 'hero':
                return <HeroSection key={section.id} section={section} />;

            case 'categories':
                return <CategoriesSection key={section.id} section={section} categories={categories} />;

            case 'meetings':
                const sortType = layout?.sort || 'popular';
                const meetings = sortType === 'popular' ? popularMeetings?.data : latestMeetings?.data;
                return <MeetingsSection key={section.id} section={section} meetings={meetings} />;

            case 'featured':
                return <FeaturedSection key={section.id} section={section} />;

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen">
            {/* Banner Section - 항상 최상단 */}
            {bannersLoading && <BannerCarouselSkeleton />}
            {!bannersLoading && banners && banners.length > 0 && (
                <BannerCarousel banners={banners} onBannerClick={handleBannerClick} />
            )}

            {/* 섹션 순서대로 렌더링 */}
            {sortedSections.map(renderSection)}

            {/* 추천 모임 - 로그인 사용자만 (섹션과 별개로 표시) */}
            {isAuthenticated && recommendedMeetings && recommendedMeetings.length > 0 && (
                <RecommendedSection meetings={recommendedMeetings} />
            )}

            {/* 통계 섹션 */}
            <StatsSection stats={publicStats} isLoading={statsLoading} />

            {/* 트렌딩 모임 섹션 */}
            <TrendingSection meetings={trendingMeetings?.data} isLoading={trendingLoading} />

            {/* 최근 활동 섹션 */}
            <RecentActivitySection activities={recentActivities} isLoading={activitiesLoading} />
        </div>
    );
}
