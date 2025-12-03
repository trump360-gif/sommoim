'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { meetingsApi, MeetingQueryParams } from '@/lib/api/meetings';
import { MeetingCard } from '@/components/meeting/meeting-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import type { Category, MeetingStatus } from '@/types';

const CATEGORIES: { value: Category | ''; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'SPORTS', label: '운동' },
  { value: 'GAMES', label: '게임' },
  { value: 'FOOD', label: '음식' },
  { value: 'CULTURE', label: '문화' },
  { value: 'TRAVEL', label: '여행' },
  { value: 'STUDY', label: '학습' },
];

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'deadline', label: '마감임박순' },
];

export default function MeetingsPage() {
  const { isAuthenticated } = useAuth();
  const [filters, setFilters] = useState<MeetingQueryParams>({
    page: 1,
    limit: 12,
    sort: 'latest',
    status: 'RECRUITING',
  });
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['meetings', filters],
    queryFn: () => meetingsApi.getAll(filters),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleCategoryChange = (category: Category | '') => {
    setFilters((prev) => ({
      ...prev,
      category: category || undefined,
      page: 1,
    }));
  };

  const handleSortChange = (sort: string) => {
    setFilters((prev) => ({
      ...prev,
      sort: sort as MeetingQueryParams['sort'],
      page: 1,
    }));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">모임 찾기</h1>
        {isAuthenticated && (
          <Link href="/meetings/create">
            <Button>모임 만들기</Button>
          </Link>
        )}
      </div>

      {/* 검색 */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <Input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="모임 검색..."
          className="max-w-md"
        />
        <Button type="submit" variant="outline">
          검색
        </Button>
      </form>

      {/* 필터 */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                filters.category === cat.value || (!filters.category && cat.value === '')
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSortChange(opt.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filters.sort === opt.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 결과 */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      ) : error ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-red-500">오류가 발생했습니다</div>
        </div>
      ) : data?.data.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="mb-2">검색 결과가 없습니다</p>
            <p className="text-sm">다른 조건으로 검색해보세요</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data?.data.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>

          {/* 페이지네이션 */}
          {data && data.meta.totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={filters.page === 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
              >
                이전
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                {filters.page} / {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={filters.page === data.meta.totalPages}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
