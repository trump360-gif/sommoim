'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { meetingsApi } from '@/lib/api/meetings';
import { adminApi, type Banner, type CategoryEntity } from '@/lib/api/admin';
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

export default function HomePage() {
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

  const categories = adminCategories?.length
    ? adminCategories.map((cat) => ({
        key: cat.name.toUpperCase(),
        label: cat.name,
        icon: cat.icon || '📌',
        color: cat.color || 'bg-gray-500',
      }))
    : DEFAULT_CATEGORIES;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Banner Section */}
      {banners && banners.length > 0 && (
        <section className="mb-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {banners.slice(0, 3).map((banner) => (
              <Link
                key={banner.id}
                href={banner.linkUrl || '#'}
                className="relative aspect-[16/9] overflow-hidden rounded-xl shadow-sm transition hover:shadow-md"
              >
                <Image
                  src={banner.imageUrl}
                  alt="배너"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="mb-12 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-800 p-8 text-white md:p-12">
        <h1 className="mb-4 text-3xl font-bold md:text-4xl">관심사가 같은 사람들과 함께해요</h1>
        <p className="mb-6 text-lg opacity-90">운동, 게임, 맛집, 여행... 다양한 모임에서 새로운 친구를 만나보세요</p>
        <div className="flex gap-3">
          <Link href="/meetings">
            <Button className="bg-white text-primary-600 hover:bg-gray-100">모임 찾아보기</Button>
          </Link>
          <Link href="/meetings/create">
            <Button className="border-2 border-white bg-transparent text-white hover:bg-white/20">모임 만들기</Button>
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold">카테고리</h2>
        <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
          {categories.map((cat) => (
            <Link
              key={cat.key}
              href={`/meetings?category=${cat.key}`}
              className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${cat.color} text-2xl`}>
                {cat.icon}
              </div>
              <span className="text-sm font-medium">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Meetings */}
      <section className="mb-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">인기 모임</h2>
          <Link href="/meetings?sort=popular" className="text-sm text-primary-600 hover:underline">더보기</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {popularMeetings?.data?.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
          {!popularMeetings?.data?.length && (
            <p className="col-span-full py-8 text-center text-gray-500">아직 모임이 없습니다</p>
          )}
        </div>
      </section>

      {/* Latest Meetings */}
      <section className="mb-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">최신 모임</h2>
          <Link href="/meetings?sort=latest" className="text-sm text-primary-600 hover:underline">더보기</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {latestMeetings?.data?.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
          {!latestMeetings?.data?.length && (
            <p className="col-span-full py-8 text-center text-gray-500">아직 모임이 없습니다</p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-gray-100 p-8 text-center">
        <h2 className="mb-3 text-2xl font-bold">나만의 모임을 시작해보세요</h2>
        <p className="mb-6 text-gray-600">관심사가 같은 사람들이 모일 수 있는 공간을 만들어보세요</p>
        <Link href="/meetings/create">
          <Button size="lg">모임 만들기</Button>
        </Link>
      </section>
    </div>
  );
}
