'use client';

// ================================
// Event List - Main Component
// ================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { eventsApi, EventType } from '@/lib/api/events';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SimpleTabs as Tabs } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Calendar, Plus } from 'lucide-react';

import type { EventListProps, MeetingEvent } from './types';
import { EVENT_TYPE_TABS } from './constants';
import { isUpcoming } from './utils';
import { EventCard } from './event-card';
import { CreateEventModal } from './create-event-modal';
import { EventDetailModal } from './event-detail-modal';

// ================================
// Component
// ================================

export function EventList({ meetingId, isHost, isParticipant }: EventListProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MeetingEvent | null>(null);

  // ================================
  // Queries
  // ================================

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', meetingId, typeFilter],
    queryFn: () => eventsApi.getAll(meetingId, typeFilter === 'all' ? undefined : typeFilter as EventType),
  });

  // ================================
  // Mutations
  // ================================

  const joinMutation = useMutation({
    mutationFn: (eventId: string) => eventsApi.join(meetingId, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', meetingId] });
      toast.success('참가 신청이 완료되었습니다');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '참가 신청에 실패했습니다');
    },
  });

  const leaveMutation = useMutation({
    mutationFn: (eventId: string) => eventsApi.leave(meetingId, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', meetingId] });
      toast.success('참가가 취소되었습니다');
    },
    onError: () => {
      toast.error('참가 취소에 실패했습니다');
    },
  });

  // ================================
  // Derived State
  // ================================

  const canCreateEvent = isHost || isParticipant;
  const upcomingEvents = events.filter((e) => isUpcoming(e.date));
  const pastEvents = events.filter((e) => !isUpcoming(e.date));

  // ================================
  // Render
  // ================================

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Tabs
          tabs={[...EVENT_TYPE_TABS]}
          activeTab={typeFilter}
          onChange={setTypeFilter}
          variant="pills"
        />
        {canCreateEvent && (
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            일정 추가
          </Button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="py-12 text-center text-gray-500">로딩 중...</div>
      )}

      {/* Empty State */}
      {!isLoading && events.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 mb-4">등록된 일정이 없습니다</p>
            {canCreateEvent && (
              <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                첫 일정 만들기
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-3">다가오는 일정</h4>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                meetingId={meetingId}
                userId={user?.id}
                isHost={isHost}
                onJoin={() => joinMutation.mutate(event.id)}
                onLeave={() => leaveMutation.mutate(event.id)}
                onClick={() => setSelectedEvent(event)}
                isJoining={joinMutation.isPending}
                isLeaving={leaveMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-3">지난 일정</h4>
          <div className="space-y-3">
            {pastEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                meetingId={meetingId}
                userId={user?.id}
                isHost={isHost}
                isPast
                onClick={() => setSelectedEvent(event)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        meetingId={meetingId}
      />

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        meetingId={meetingId}
        isHost={isHost}
        userId={user?.id}
        onClose={() => setSelectedEvent(null)}
        onJoin={() => selectedEvent && joinMutation.mutate(selectedEvent.id)}
        onLeave={() => selectedEvent && leaveMutation.mutate(selectedEvent.id)}
      />
    </div>
  );
}

export default EventList;
