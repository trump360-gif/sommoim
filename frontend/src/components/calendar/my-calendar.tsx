'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { meetingsApi, type CalendarEvent } from '@/lib/api/meetings';
import { Button } from '@/components/ui/button';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const CATEGORY_COLORS: Record<string, string> = {
  SPORTS: 'bg-green-500',
  GAMES: 'bg-purple-500',
  FOOD: 'bg-orange-500',
  CULTURE: 'bg-pink-500',
  TRAVEL: 'bg-blue-500',
  STUDY: 'bg-yellow-500',
};

export function MyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const startDate = new Date(year, month, 1).toISOString();
  const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar', year, month],
    queryFn: () => meetingsApi.getMyCalendar(startDate, endDate),
  });

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    // 이전 달의 빈 칸
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // 이번 달의 날짜들
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [year, month]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const dateKey = new Date(event.date).toDateString();
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, event]);
    });
    return map;
  }, [events]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsByDate.get(selectedDate.toDateString()) || [];
  }, [selectedDate, eventsByDate]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const getDateKey = (day: number) => new Date(year, month, day).toDateString();
  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };
  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">
          {year}년 {month + 1}월
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            이전
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            오늘
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            다음
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="mb-6">
        {/* Days Header */}
        <div className="mb-2 grid grid-cols-7 text-center text-sm font-medium text-gray-500">
          {DAYS.map((day, i) => (
            <div key={day} className={i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : ''}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="h-20" />;
            }

            const dateKey = getDateKey(day);
            const dayEvents = eventsByDate.get(dateKey) || [];
            const dayOfWeek = (index % 7);

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(new Date(year, month, day))}
                className={`h-20 rounded-lg border p-1 text-left transition hover:bg-gray-50 ${
                  isSelected(day) ? 'border-primary-500 bg-primary-50' : 'border-gray-100'
                } ${isToday(day) ? 'bg-blue-50' : ''}`}
              >
                <span
                  className={`text-sm font-medium ${
                    dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-gray-700'
                  } ${isToday(day) ? 'rounded-full bg-blue-500 px-1.5 py-0.5 text-white' : ''}`}
                >
                  {day}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={`truncate rounded px-1 text-xs text-white ${
                        CATEGORY_COLORS[event.meeting.category] || 'bg-gray-500'
                      }`}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500">+{dayEvents.length - 2}개</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="border-t pt-4">
          <h3 className="mb-3 font-semibold">
            {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 일정
          </h3>
          {selectedDateEvents.length === 0 ? (
            <p className="text-sm text-gray-500">예정된 일정이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {selectedDateEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/meetings/${event.meeting.id}`}
                  className="block rounded-lg border p-3 transition hover:bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-2 w-2 mt-1.5 rounded-full ${
                        CATEGORY_COLORS[event.meeting.category] || 'bg-gray-500'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-gray-600">{event.meeting.title}</p>
                      <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {new Date(event.date).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {event.endTime && (
                            <>
                              {' ~ '}
                              {new Date(event.endTime).toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </>
                          )}
                        </span>
                        {event.location && <span>{event.location}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
