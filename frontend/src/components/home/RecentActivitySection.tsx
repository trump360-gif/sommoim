'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Activity, UserPlus, CalendarPlus, MessageSquare, Star } from 'lucide-react';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/animation';
import type { RecentActivity, ActivityType } from '@/types/stats';

// ================================
// Types & Interfaces
// ================================

interface RecentActivitySectionProps {
  activities?: RecentActivity[];
  isLoading?: boolean;
}

// ================================
// Constants
// ================================

const ACTIVITY_CONFIG: Record<ActivityType, { icon: React.ReactNode; color: string; bgColor: string }> = {
  NEW_MEETING: {
    icon: <CalendarPlus className="h-4 w-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  JOIN: {
    icon: <UserPlus className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  ACTIVITY: {
    icon: <Activity className="h-4 w-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  REVIEW: {
    icon: <Star className="h-4 w-4" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
};

// ================================
// Helper Functions
// ================================

function getRelativeTime(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ko,
    });
  } catch {
    return '';
  }
}

// ================================
// Sub Components
// ================================

function ActivityItem({ activity }: { activity: RecentActivity }) {
  const config = ACTIVITY_CONFIG[activity.type];

  return (
    <div className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50">
      {/* Icon */}
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bgColor} ${config.color}`}>
        {config.icon}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-700">
          {activity.userName && (
            <span className="font-medium text-gray-900">{activity.userName}</span>
          )}
          {activity.userName ? ' ' : ''}
          {activity.message}
          {activity.meetingTitle && activity.meetingId && (
            <>
              {' '}
              <Link
                href={`/meetings/${activity.meetingId}`}
                className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
              >
                {activity.meetingTitle}
              </Link>
            </>
          )}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">{getRelativeTime(activity.createdAt)}</p>
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex animate-pulse items-start gap-3 p-3">
      <div className="h-9 w-9 shrink-0 rounded-lg bg-gray-200" />
      <div className="flex-1">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="mt-2 h-3 w-1/4 rounded bg-gray-100" />
      </div>
    </div>
  );
}

// ================================
// Main Component
// ================================

export function RecentActivitySection({ activities, isLoading }: RecentActivitySectionProps) {
  const displayActivities = activities?.slice(0, 8) || [];

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
        <div className="overflow-hidden rounded-2xl bg-white shadow-soft">
          <div className="divide-y divide-gray-100">
            {[...Array(5)].map((_, i) => (
              <ActivitySkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!displayActivities.length) {
    return null;
  }

  return (
    <section id="recent-activities" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 scroll-mt-20">
      <ScrollReveal animation="slideUp">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">최근 활동</h2>
            <p className="mt-1 text-gray-600">커뮤니티에서 일어나는 일들</p>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal animation="fadeIn" delay={0.2}>
        <div className="overflow-hidden rounded-2xl bg-white shadow-soft">
          <StaggerContainer staggerDelay={0.05} className="divide-y divide-gray-100">
            {displayActivities.map((activity) => (
              <StaggerItem key={activity.id}>
                <ActivityItem activity={activity} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </ScrollReveal>
    </section>
  );
}
