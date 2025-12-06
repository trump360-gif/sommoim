'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { meetingsApi } from '@/lib/api/meetings';
import { adminApi, type Banner, type CategoryEntity, type PageSection } from '@/lib/api/admin';
import { MeetingCard } from '@/components/meeting/meeting-card';
import { Button } from '@/components/ui/button';
import type { Meeting, PaginatedResponse } from '@/types';

const DEFAULT_CATEGORIES = [
  { key: 'SPORTS', label: '운동', icon: '⚽', color: 'bg-green-500' },
  { key: 'GAMES', label: '게임', icon: '🎮', color: 'bg-purple-500' },
  { key: 'FOOD', label: '음식', icon: '🍔', color: 'bg-orange-500' },
  { key: 'CULTURE', label: '문화', icon: '🎨', color: 'bg-pink-500' },
  { key: 'TRAVEL', label: '여행', icon: '✈️', color: 'bg-blue-500' },
  { key: 'STUDY', label: '스터디', icon: '📚', color: 'bg-yellow-500' },
];

interface HeroLayout {
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  secondButtonText?: string;
  secondButtonLink?: string;
  bgColor?: string;
  bgColorEnd?: string;
  bgImage?: string;
}

export default function HomePage() {
  const { data: sections } = useQuery<PageSection[]>({
    queryKey: ['public', 'sections'],
    queryFn: () => adminApi.getPublicSections(),
  });

  const { data: banners } = useQuery<Banner[]>({
    queryKey: ['public', 'banners'],
    queryFn: () => adminApi.getPublicBanners(),
  });

  const { data: adminCategories } = useQuery<CategoryEntity[]>({
    queryKey: ['public', 'categories'],
    queryFn: () => adminApi.getPublicCategories(),
  });

  const { data: latestMeetings } = useQuery<PaginatedResponse<Meeting>>({
    queryKey: ['meetings', 'latest'],
    queryFn: () => meetingsApi.getAll({ limit: 4, sort: 'latest', status: 'RECRUITING' }),
  });

  const { data: popularMeetings } = useQuery<PaginatedResponse<Meeting>>({
    queryKey: ['meetings', 'popular'],
    queryFn: () => meetingsApi.getAll({ limit: 4, sort: 'popular', status: 'RECRUITING' }),
  });

  const heroSection = sections?.find((s) => s.type === 'hero');
  const heroLayout = (heroSection?.layoutJson || {}) as HeroLayout;

  const categories = adminCategories?.length
    ? adminCategories.map((cat) => ({
      key: cat.name.toUpperCase(),
      label: cat.name,
      icon: cat.icon || '📌',
      color: cat.color || null,
    }))
    : DEFAULT_CATEGORIES;

  return (
    <div className="min-h-screen">
      {/* Banner Section */}
      {banners && banners.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {banners.slice(0, 3).map((banner, index) => (
              <Link
                key={banner.id}
                href={banner.linkUrl || '#'}
                className="group relative aspect-[16/9] overflow-hidden rounded-2xl shadow-soft transition-all duration-300 hover:shadow-medium hover:-translate-y-1"
              >
                <Image
                  src={banner.imageUrl}
                  alt="배너"
                  fill
                  priority={index === 0}
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section
        className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl px-4 py-16 sm:px-6 lg:px-8"
        style={{
          background: heroLayout.bgImage
            ? `url(${heroLayout.bgImage}) center/cover`
            : `linear-gradient(135deg, ${heroLayout.bgColor || '#6366f1'} 0%, ${heroLayout.bgColorEnd || '#8b5cf6'} 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative z-10 mx-auto max-w-3xl text-center text-white">
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            {heroSection?.title || '관심사가 같은 사람들과 함께해요'}
          </h1>
          <p className="mb-8 text-lg opacity-95 md:text-xl">
            {heroLayout.subtitle || '운동, 게임, 맛집, 여행... 다양한 모임에서 새로운 친구를 만나보세요'}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={heroLayout.buttonLink || '/meetings'}>
              <Button className="w-full bg-white px-8 py-6 text-base font-semibold text-primary-600 shadow-lg transition-all hover:scale-105 hover:bg-gray-50 hover:shadow-xl sm:w-auto">
                {heroLayout.buttonText || '모임 찾아보기'}
              </Button>
            </Link>
            <Link href={heroLayout.secondButtonLink || '/meetings/create'}>
              <Button className="w-full border-2 border-white bg-transparent px-8 py-6 text-base font-semibold text-white shadow-lg transition-all hover:scale-105 hover:bg-white/20 sm:w-auto">
                {heroLayout.secondButtonText || '모임 만들기'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-3xl font-bold tracking-tight">카테고리</h2>
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

      {/* Popular Meetings */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">인기 모임</h2>
            <p className="mt-2 text-gray-600">지금 가장 핫한 모임을 만나보세요</p>
          </div>
          <Link href="/meetings?sort=popular" className="text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700">
            더보기 →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {popularMeetings?.data?.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
          {!popularMeetings?.data?.length && (
            <p className="col-span-full rounded-2xl bg-gray-50 py-16 text-center text-gray-500">아직 모임이 없습니다</p>
          )}
        </div>
      </section>

      {/* Latest Meetings */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">최신 모임</h2>
            <p className="mt-2 text-gray-600">새롭게 시작된 모임에 참여해보세요</p>
          </div>
          <Link href="/meetings?sort=latest" className="text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700">
            더보기 →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {latestMeetings?.data?.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
          {!latestMeetings?.data?.length && (
            <p className="col-span-full rounded-2xl bg-gray-50 py-16 text-center text-gray-500">아직 모임이 없습니다</p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-primary-700 p-12 text-center shadow-xl">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="relative z-10">
            <h2 className="mb-4 text-3xl font-bold text-white">나만의 모임을 시작해보세요</h2>
            <p className="mb-8 text-lg text-white/90">관심사가 같은 사람들이 모일 수 있는 공간을 만들어보세요</p>
            <Link href="/meetings/create">
              <Button size="lg" className="bg-white px-8 py-6 text-base font-semibold text-primary-600 shadow-lg transition-all hover:scale-105 hover:bg-gray-50">
                모임 만들기
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
