'use client';

// ================================
// Event Card Component
// ================================

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Zap,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import type { EventCardProps } from './types';
import { formatEventDate } from './utils';

export function EventCard({
  event,
  userId,
  isPast,
  onJoin,
  onLeave,
  onClick,
  isJoining,
  isLeaving,
}: EventCardProps) {
  const dateInfo = formatEventDate(event.date);
  const myParticipation = event.participants.find((p) => p.userId === userId);
  const confirmedCount = event.participants.filter(
    (p) => p.status === 'CONFIRMED' || p.status === 'ATTENDED'
  ).length;

  return (
    <Card
      className={`cursor-pointer transition-shadow hover:shadow-md ${isPast ? 'opacity-60' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Date Badge */}
          <div className="flex flex-col items-center justify-center rounded-lg bg-primary-50 px-3 py-2 text-center">
            <span className="text-xs text-primary-600">{dateInfo.month}</span>
            <span className="text-2xl font-bold text-primary-700">{dateInfo.day}</span>
            <span className="text-xs text-primary-600">{dateInfo.weekday}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {event.type === 'LIGHTNING' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <Zap className="h-3 w-3" />
                  번개
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  <Calendar className="h-3 w-3" />
                  정모
                </span>
              )}
              {myParticipation && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  <CheckCircle2 className="h-3 w-3" />
                  {myParticipation.status === 'ATTENDED' ? '출석완료' : '참가예정'}
                </span>
              )}
            </div>

            <h4 className="font-semibold text-gray-900 truncate">{event.title}</h4>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {dateInfo.time}
              </span>
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {confirmedCount}
                {event.maxParticipants && `/${event.maxParticipants}`}명
              </span>
            </div>
          </div>

          {/* Actions */}
          {!isPast && (
            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
              {myParticipation ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onLeave}
                  disabled={isLeaving}
                  className="text-red-600 hover:text-red-700"
                >
                  취소
                </Button>
              ) : (
                <Button size="sm" onClick={onJoin} disabled={isJoining}>
                  참가
                </Button>
              )}
            </div>
          )}

          <ChevronRight className="h-5 w-5 text-gray-400 self-center" />
        </div>
      </CardContent>
    </Card>
  );
}
