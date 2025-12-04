// ================================
// Types & Imports
// ================================

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi, MeetingEvent, EventType } from '@/lib/api/events';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, MapPin, Clock, Zap, QrCode } from 'lucide-react';
import { EventModal } from './event-modal';
import { QrModal } from './qr-modal';

interface EventListProps {
  meetingId: string;
  isHost: boolean;
  isMember: boolean;
}

// ================================
// Component
// ================================

export function EventList({ meetingId, isHost, isMember }: EventListProps) {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MeetingEvent | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrEventId, setQrEventId] = useState<string | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', meetingId],
    queryFn: () => eventsApi.getAll(meetingId),
  });

  const joinMutation = useMutation({
    mutationFn: (eventId: string) => eventsApi.join(meetingId, eventId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events', meetingId] }),
  });

  const leaveMutation = useMutation({
    mutationFn: (eventId: string) => eventsApi.leave(meetingId, eventId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events', meetingId] }),
  });

  const regularEvents = events.filter((e) => e.type === 'REGULAR');
  const lightningEvents = events.filter((e) => e.type === 'LIGHTNING');

  const handleQrGenerate = (eventId: string) => {
    setQrEventId(eventId);
    setShowQrModal(true);
  };

  if (isLoading) return <div className="py-4 text-center">로딩 중...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-xl font-semibold">정모/번개</h2>
        {isHost && (
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            이벤트 추가
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="regular">
          <TabsList className="mb-4">
            <TabsTrigger value="regular">
              <Calendar className="mr-1 h-4 w-4" />
              정모 ({regularEvents.length})
            </TabsTrigger>
            <TabsTrigger value="lightning">
              <Zap className="mr-1 h-4 w-4" />
              번개 ({lightningEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="regular">
            <EventCards
              events={regularEvents}
              isMember={isMember}
              isHost={isHost}
              onJoin={(id) => joinMutation.mutate(id)}
              onLeave={(id) => leaveMutation.mutate(id)}
              onEdit={setSelectedEvent}
              onQr={handleQrGenerate}
            />
          </TabsContent>

          <TabsContent value="lightning">
            <EventCards
              events={lightningEvents}
              isMember={isMember}
              isHost={isHost}
              onJoin={(id) => joinMutation.mutate(id)}
              onLeave={(id) => leaveMutation.mutate(id)}
              onEdit={setSelectedEvent}
              onQr={handleQrGenerate}
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      <EventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        meetingId={meetingId}
      />

      {selectedEvent && (
        <EventModal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          meetingId={meetingId}
          event={selectedEvent}
        />
      )}

      <QrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        meetingId={meetingId}
        eventId={qrEventId}
      />
    </Card>
  );
}

// ================================
// Event Cards
// ================================

interface EventCardsProps {
  events: MeetingEvent[];
  isMember: boolean;
  isHost: boolean;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onEdit: (event: MeetingEvent) => void;
  onQr: (id: string) => void;
}

function EventCards({ events, isMember, isHost, onJoin, onLeave, onEdit, onQr }: EventCardsProps) {
  if (events.length === 0) {
    return <p className="py-4 text-center text-gray-500">등록된 이벤트가 없습니다</p>;
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          isMember={isMember}
          isHost={isHost}
          onJoin={() => onJoin(event.id)}
          onLeave={() => onLeave(event.id)}
          onEdit={() => onEdit(event)}
          onQr={() => onQr(event.id)}
        />
      ))}
    </div>
  );
}

// ================================
// Event Card
// ================================

interface EventCardProps {
  event: MeetingEvent;
  isMember: boolean;
  isHost: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onEdit: () => void;
  onQr: () => void;
}

function EventCard({ event, isMember, isHost, onJoin, onLeave, onEdit, onQr }: EventCardProps) {
  const isParticipating = event.participants?.some((p) => p.status === 'CONFIRMED' || p.status === 'ATTENDED');
  const participantCount = event._count?.participants || event.participants?.length || 0;
  const isPast = new Date(event.date) < new Date();

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{event.title}</h3>
            {event.recurringId && (
              <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                반복
              </span>
            )}
          </div>

          <div className="mt-2 space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDate(event.date)}
              {event.endTime && ` ~ ${formatTime(event.endTime)}`}
            </div>
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {event.location}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {participantCount}명 참여
              {event.maxParticipants && ` / ${event.maxParticipants}명`}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {isHost && (
            <>
              <Button size="sm" variant="outline" onClick={onEdit}>
                수정
              </Button>
              {!isPast && (
                <Button size="sm" variant="outline" onClick={onQr}>
                  <QrCode className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
          {isMember && !isPast && (
            isParticipating ? (
              <Button size="sm" variant="outline" onClick={onLeave}>
                취소
              </Button>
            ) : (
              <Button size="sm" onClick={onJoin}>
                참여
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ================================
// Helpers
// ================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
