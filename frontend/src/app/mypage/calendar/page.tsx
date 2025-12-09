'use client';

// ================================
// Imports
// ================================
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/lib/api/users';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimpleTabs as Tabs } from '@/components/ui/tabs';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Zap,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

// ================================
// Types
// ================================
interface MyEvent {
  id: string;
  meetingId: string;
  meetingTitle: string;
  type: 'REGULAR' | 'LIGHTNING';
  title: string;
  date: string;
  endTime?: string;
  location?: string;
  status: 'PENDING' | 'CONFIRMED' | 'ATTENDED' | 'DECLINED' | 'NO_SHOW';
}

// ================================
// Constants
// ================================
const STATUS_TABS = [
  { key: 'upcoming', label: '다가오는 일정' },
  { key: 'past', label: '지난 일정' },
];

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

// ================================
// Helper Functions
// ================================
function formatEventDate(dateStr: string) {
  const date = new Date(dateStr);
  return {
    month: date.getMonth() + 1,
    day: date.getDate(),
    weekday: WEEKDAYS[date.getDay()],
    time: date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    full: date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }),
  };
}

function isUpcoming(dateStr: string) {
  return new Date(dateStr) > new Date();
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// ================================
// Component
// ================================
export default function MyCalendarPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch my events (using myMeetings as proxy - would need dedicated API)
  const { data: myMeetingsData, isLoading } = useQuery({
    queryKey: ['my-meetings'],
    queryFn: () => usersApi.getMyMeetings(),
    enabled: isAuthenticated,
  });

  // Mock events for demo (in real app, fetch from dedicated API)
  const mockEvents: MyEvent[] = [
    {
      id: '1',
      meetingId: 'meeting1',
      meetingTitle: '주말 등산 모임',
      type: 'REGULAR',
      title: '12월 정기 등산',
      date: new Date(Date.now() + 86400000 * 3).toISOString(),
      location: '북한산 입구',
      status: 'CONFIRMED',
    },
    {
      id: '2',
      meetingId: 'meeting2',
      meetingTitle: '보드게임 동호회',
      type: 'LIGHTNING',
      title: '번개 보드게임',
      date: new Date(Date.now() + 86400000 * 7).toISOString(),
      location: '홍대 보드게임카페',
      status: 'CONFIRMED',
    },
    {
      id: '3',
      meetingId: 'meeting1',
      meetingTitle: '주말 등산 모임',
      type: 'REGULAR',
      title: '11월 정기 등산',
      date: new Date(Date.now() - 86400000 * 10).toISOString(),
      location: '관악산',
      status: 'ATTENDED',
    },
  ];

  const upcomingEvents = mockEvents.filter((e) => isUpcoming(e.date));
  const pastEvents = mockEvents.filter((e) => !isUpcoming(e.date));
  const displayEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  // Calendar navigation
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // Events on calendar
  const eventsInMonth = mockEvents.filter((e) => {
    const eventDate = new Date(e.date);
    return eventDate.getFullYear() === year && eventDate.getMonth() === month;
  });

  const getEventsForDay = (day: number) => {
    return eventsInMonth.filter((e) => new Date(e.date).getDate() === day);
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">로그인이 필요합니다</p>
        <Button onClick={() => router.push('/auth/login')} className="mt-4">
          로그인
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">내 일정</h1>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">
                {year}년 {MONTHS[month]}
              </h2>
              <Button variant="outline" size="sm" onClick={goToToday}>
                오늘
              </Button>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={goToPrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((day, i) => (
              <div
                key={day}
                className={`text-center text-sm font-medium py-2 ${
                  i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before first day of month */}
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="aspect-square p-1" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday = isCurrentMonth && today.getDate() === day;
              const dayOfWeek = (firstDay + i) % 7;

              return (
                <div
                  key={day}
                  className={`aspect-square p-1 rounded-lg border transition-colors ${
                    isToday ? 'border-primary-500 bg-primary-50' : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`text-sm font-medium ${
                      dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-gray-700'
                    }`}
                  >
                    {day}
                  </div>
                  {dayEvents.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs truncate rounded px-1 py-0.5 ${
                            event.type === 'LIGHTNING'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 px-1">
                          +{dayEvents.length - 2}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event List */}
      <div>
        <Tabs tabs={STATUS_TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

        {isLoading ? (
          <div className="py-8 text-center text-gray-500">로딩 중...</div>
        ) : displayEvents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">
                {activeTab === 'upcoming' ? '다가오는 일정이 없습니다' : '지난 일정이 없습니다'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {displayEvents.map((event) => {
              const dateInfo = formatEventDate(event.date);
              return (
                <Card
                  key={event.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => router.push(`/meetings/${event.meetingId}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Date Badge */}
                      <div className="flex flex-col items-center justify-center rounded-lg bg-primary-50 px-3 py-2 text-center">
                        <span className="text-xs text-primary-600">{dateInfo.month}월</span>
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
                              <CalendarIcon className="h-3 w-3" />
                              정모
                            </span>
                          )}
                          {event.status === 'ATTENDED' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              <CheckCircle2 className="h-3 w-3" />
                              출석완료
                            </span>
                          )}
                        </div>

                        <h3 className="font-semibold text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-500">{event.meetingTitle}</p>

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
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
