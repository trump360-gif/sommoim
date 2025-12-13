'use client';

import Link from 'next/link';
import { TrendingUp, Flame, Award } from 'lucide-react';
import { MeetingCard } from '@/components/meeting/meeting-card';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/animation';
import type { Meeting } from '@/types';

// ================================
// Types & Interfaces
// ================================

interface TrendingSectionProps {
  meetings?: Meeting[];
  isLoading?: boolean;
}

// ================================
// Constants
// ================================

const RANK_STYLES = {
  1: {
    bg: 'bg-gradient-to-br from-yellow-400 to-amber-500',
    icon: <Award className="h-4 w-4" />,
    shadow: 'shadow-amber-500/30',
  },
  2: {
    bg: 'bg-gradient-to-br from-gray-300 to-gray-400',
    icon: null,
    shadow: 'shadow-gray-400/30',
  },
  3: {
    bg: 'bg-gradient-to-br from-amber-600 to-amber-700',
    icon: null,
    shadow: 'shadow-amber-700/30',
  },
};

// ================================
// Sub Components
// ================================

function RankBadge({ rank }: { rank: number }) {
  const style = RANK_STYLES[rank as keyof typeof RANK_STYLES];

  if (!style) {
    return (
      <div className="absolute -left-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-600 text-sm font-bold text-white shadow-lg">
        {rank}
      </div>
    );
  }

  return (
    <div
      className={`absolute -left-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full ${style.bg} text-sm font-bold text-white shadow-lg ${style.shadow}`}
    >
      {style.icon || rank}
    </div>
  );
}

function TrendingCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/3] rounded-t-2xl bg-gray-200" />
      <div className="rounded-b-2xl bg-white p-4">
        <div className="h-5 w-3/4 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-1/2 rounded bg-gray-100" />
        <div className="mt-3 flex gap-2">
          <div className="h-6 w-16 rounded bg-gray-100" />
          <div className="h-6 w-16 rounded bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

// ================================
// Main Component
// ================================

export function TrendingSection({ meetings, isLoading }: TrendingSectionProps) {
  const displayMeetings = meetings?.slice(0, 8) || [];

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-200" />
          <div>
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
            <div className="mt-1 h-5 w-64 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <TrendingCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (!displayMeetings.length) {
    return null;
  }

  return (
    <section id="trending" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 scroll-mt-20">
      <ScrollReveal animation="slideUp">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">지금 뜨는 모임</h2>
              <p className="mt-1 text-gray-600">가장 인기있는 모임을 확인하세요</p>
            </div>
          </div>
          <Link
            href="/meetings?sort=popular"
            className="flex items-center gap-1 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700"
          >
            <TrendingUp className="h-4 w-4" />
            전체보기
          </Link>
        </div>
      </ScrollReveal>

      <StaggerContainer staggerDelay={0.1} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {displayMeetings.map((meeting, index) => (
          <StaggerItem key={meeting.id} className="relative">
            <RankBadge rank={index + 1} />
            <MeetingCard meeting={meeting} />
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
