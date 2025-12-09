'use client';

// ================================
// Imports
// ================================
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { eventsApi, MeetingEvent, EventType } from '@/lib/api/events';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { SimpleTabs as Tabs } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Zap,
  QrCode,
  CheckCircle2,
  UserCheck,
  ChevronRight,
} from 'lucide-react';

// ================================
// Types
// ================================
interface EventListProps {
  meetingId: string;
  isHost: boolean;
  isParticipant: boolean;
}

// ================================
// Constants
// ================================
const EVENT_TYPE_TABS = [
  { key: 'all', label: '전체' },
  { key: 'REGULAR', label: '정모' },
  { key: 'LIGHTNING', label: '번개' },
];

// ================================
// Helper Functions
// ================================
function formatEventDate(dateStr: string) {
  const date = new Date(dateStr);
  return {
    month: date.toLocaleDateString('ko-KR', { month: 'short' }),
    day: date.getDate(),
    weekday: date.toLocaleDateString('ko-KR', { weekday: 'short' }),
    time: date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
  };
}

function isUpcoming(dateStr: string) {
  return new Date(dateStr) > new Date();
}

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
  // Render
  // ================================
  const canCreateEvent = isHost || isParticipant;
  const upcomingEvents = events.filter((e) => isUpcoming(e.date));
  const pastEvents = events.filter((e) => !isUpcoming(e.date));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Tabs
          tabs={EVENT_TYPE_TABS}
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

// ================================
// Event Card Component
// ================================
interface EventCardProps {
  event: MeetingEvent;
  meetingId: string;
  userId?: string;
  isHost: boolean;
  isPast?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
  onClick: () => void;
  isJoining?: boolean;
  isLeaving?: boolean;
}

function EventCard({
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

// ================================
// Create Event Modal
// ================================
interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
}

function CreateEventModal({ isOpen, onClose, meetingId }: CreateEventModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    type: 'REGULAR' as EventType,
    title: '',
    description: '',
    date: '',
    endTime: '',
    location: '',
    maxParticipants: '',
  });

  const createMutation = useMutation({
    mutationFn: () =>
      eventsApi.create(meetingId, {
        ...formData,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', meetingId] });
      toast.success('일정이 생성되었습니다');
      onClose();
      setFormData({
        type: 'REGULAR',
        title: '',
        description: '',
        date: '',
        endTime: '',
        location: '',
        maxParticipants: '',
      });
    },
    onError: () => {
      toast.error('일정 생성에 실패했습니다');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      toast.error('제목과 날짜는 필수입니다');
      return;
    }
    createMutation.mutate();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="새 일정 만들기">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selection */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFormData((p) => ({ ...p, type: 'REGULAR' }))}
            className={`flex-1 rounded-lg border-2 p-3 text-center transition-colors ${
              formData.type === 'REGULAR'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Calendar className="mx-auto h-6 w-6 text-blue-600 mb-1" />
            <span className="text-sm font-medium">정모</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData((p) => ({ ...p, type: 'LIGHTNING' }))}
            className={`flex-1 rounded-lg border-2 p-3 text-center transition-colors ${
              formData.type === 'LIGHTNING'
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Zap className="mx-auto h-6 w-6 text-amber-600 mb-1" />
            <span className="text-sm font-medium">번개</span>
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="일정 제목"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">설명</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            rows={3}
            placeholder="일정에 대한 설명을 입력하세요"
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              날짜/시간 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">종료 시간</label>
            <input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData((p) => ({ ...p, endTime: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">장소</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="모임 장소"
          />
        </div>

        {/* Max Participants */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">최대 인원</label>
          <input
            type="number"
            value={formData.maxParticipants}
            onChange={(e) => setFormData((p) => ({ ...p, maxParticipants: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="제한 없음"
            min="1"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? '생성 중...' : '일정 만들기'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ================================
// Event Detail Modal
// ================================
interface EventDetailModalProps {
  event: MeetingEvent | null;
  meetingId: string;
  isHost: boolean;
  userId?: string;
  onClose: () => void;
  onJoin: () => void;
  onLeave: () => void;
}

function EventDetailModal({
  event,
  meetingId,
  isHost,
  userId,
  onClose,
  onJoin,
  onLeave,
}: EventDetailModalProps) {
  const queryClient = useQueryClient();
  const [showQr, setShowQr] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const generateQrMutation = useMutation({
    mutationFn: () => eventsApi.generateQrCode(meetingId, event!.id),
    onSuccess: (data) => {
      setQrCode(data.qrCode);
      setShowQr(true);
    },
    onError: () => {
      toast.error('QR 코드 생성에 실패했습니다');
    },
  });

  if (!event) return null;

  const dateInfo = formatEventDate(event.date);
  const myParticipation = event.participants.find((p) => p.userId === userId);
  const confirmedParticipants = event.participants.filter(
    (p) => p.status === 'CONFIRMED' || p.status === 'ATTENDED'
  );
  const isPast = !isUpcoming(event.date);

  return (
    <Modal isOpen={!!event} onClose={onClose} title={event.title}>
      <div className="space-y-4">
        {/* Type & Status */}
        <div className="flex items-center gap-2">
          {event.type === 'LIGHTNING' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
              <Zap className="h-4 w-4" />
              번개
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              <Calendar className="h-4 w-4" />
              정모
            </span>
          )}
          {isPast && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
              종료됨
            </span>
          )}
        </div>

        {/* Date & Time */}
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <div className="text-center">
                <span className="block text-xs text-gray-500">{dateInfo.month}</span>
                <span className="block text-2xl font-bold text-gray-900">{dateInfo.day}</span>
                <span className="block text-xs text-gray-500">{dateInfo.weekday}</span>
              </div>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{dateInfo.time}</p>
              {event.endTime && (
                <p className="text-sm text-gray-500">
                  ~ {formatEventDate(event.endTime).time}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">장소</p>
              <p className="text-gray-600">{event.location}</p>
            </div>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div>
            <p className="font-medium text-gray-900 mb-1">설명</p>
            <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* Participants */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-gray-900">
              참가자 ({confirmedParticipants.length}
              {event.maxParticipants && `/${event.maxParticipants}`}명)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {confirmedParticipants.length === 0 ? (
              <p className="text-sm text-gray-500">아직 참가자가 없습니다</p>
            ) : (
              confirmedParticipants.map((p) => (
                <span
                  key={p.id}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${
                    p.status === 'ATTENDED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {p.status === 'ATTENDED' && <UserCheck className="h-3 w-3" />}
                  참가자 {p.userId.slice(0, 4)}
                </span>
              ))
            )}
          </div>
        </div>

        {/* QR Code Section (Host Only) */}
        {isHost && !isPast && (
          <div className="border-t pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => generateQrMutation.mutate()}
              disabled={generateQrMutation.isPending}
            >
              <QrCode className="mr-2 h-4 w-4" />
              {generateQrMutation.isPending ? 'QR 생성 중...' : '출석 QR 코드 생성'}
            </Button>
            {showQr && qrCode && (
              <div className="mt-4 rounded-lg bg-gray-50 p-4 text-center">
                <p className="text-sm text-gray-500 mb-2">QR 코드 (30분간 유효)</p>
                <div className="inline-block rounded-lg bg-white p-4 shadow-sm">
                  <p className="font-mono text-lg">{qrCode.slice(0, 16)}...</p>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  참가자가 이 코드를 스캔하면 출석 처리됩니다
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {!isPast && (
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
            {myParticipation ? (
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={onLeave}
              >
                참가 취소
              </Button>
            ) : (
              <Button onClick={onJoin}>참가 신청</Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default EventList;
