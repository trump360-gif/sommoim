'use client';

import { Users, Calendar, Activity, Zap } from 'lucide-react';
import { CountUp } from '@/components/animation';
import { ScrollReveal } from '@/components/animation';
import type { PublicStats } from '@/types/stats';

// ================================
// Types & Interfaces
// ================================

interface StatsSectionProps {
  stats?: PublicStats;
  isLoading?: boolean;
}

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  gradient: string;
  delay: number;
}

// ================================
// Constants
// ================================

const STAT_CARDS = [
  {
    key: 'totalMeetings',
    icon: <Calendar className="h-6 w-6" />,
    label: '진행중인 모임',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    key: 'totalUsers',
    icon: <Users className="h-6 w-6" />,
    label: '활동중인 멤버',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    key: 'totalActivities',
    icon: <Activity className="h-6 w-6" />,
    label: '누적 활동',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    key: 'activeToday',
    icon: <Zap className="h-6 w-6" />,
    label: '오늘 활동',
    gradient: 'from-green-500 to-emerald-500',
  },
];

// ================================
// Sub Components
// ================================

function StatCard({ icon, value, label, gradient, delay }: StatCardProps) {
  return (
    <ScrollReveal animation="scale" delay={delay}>
      <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-soft transition-all duration-300 hover:shadow-medium hover:-translate-y-1">
        {/* Gradient Background */}
        <div
          className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 transition-all duration-300 group-hover:opacity-20 group-hover:scale-150`}
        />

        {/* Icon */}
        <div
          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
        >
          {icon}
        </div>

        {/* Value */}
        <div className="relative">
          <CountUp
            end={value}
            duration={2}
            className="text-3xl font-bold text-gray-900"
            separator=","
          />
        </div>

        {/* Label */}
        <p className="mt-1 text-sm font-medium text-gray-500">{label}</p>
      </div>
    </ScrollReveal>
  );
}

function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-6 shadow-soft">
      <div className="mb-4 h-12 w-12 rounded-xl bg-gray-200" />
      <div className="h-8 w-20 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-24 rounded bg-gray-100" />
    </div>
  );
}

// ================================
// Main Component
// ================================

export function StatsSection({ stats, isLoading }: StatsSectionProps) {
  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-5 w-64 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  // 기본값 설정
  const displayStats: PublicStats = stats || {
    totalMeetings: 0,
    totalUsers: 0,
    totalActivities: 0,
    activeToday: 0,
  };

  return (
    <section id="stats" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 scroll-mt-20">
      <ScrollReveal animation="slideUp">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">소모임 현황</h2>
          <p className="mt-2 text-gray-600">우리 커뮤니티의 활발한 성장을 확인하세요</p>
        </div>
      </ScrollReveal>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((card, index) => (
          <StatCard
            key={card.key}
            icon={card.icon}
            value={displayStats[card.key as keyof PublicStats]}
            label={card.label}
            gradient={card.gradient}
            delay={index * 0.1}
          />
        ))}
      </div>
    </section>
  );
}
