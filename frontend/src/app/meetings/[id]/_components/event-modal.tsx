// ================================
// Types & Imports
// ================================

'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi, MeetingEvent, CreateEventDto, CreateRecurringEventDto, EventType, RecurringRule } from '@/lib/api/events';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  event?: MeetingEvent;
}

interface FormData {
  type: EventType;
  title: string;
  description: string;
  date: string;
  endTime: string;
  location: string;
  maxParticipants: string;
  isRecurring: boolean;
  recurringRule: RecurringRule;
  count: string;
}

const initialFormData: FormData = {
  type: 'REGULAR',
  title: '',
  description: '',
  date: '',
  endTime: '',
  location: '',
  maxParticipants: '',
  isRecurring: false,
  recurringRule: 'WEEKLY',
  count: '4',
};

// ================================
// Component
// ================================

export function EventModal({ isOpen, onClose, meetingId, event }: EventModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const isEdit = !!event;

  useEffect(() => {
    if (event) {
      setFormData({
        type: event.type,
        title: event.title,
        description: event.description || '',
        date: toLocalDateTime(event.date),
        endTime: event.endTime ? toLocalDateTime(event.endTime) : '',
        location: event.location || '',
        maxParticipants: event.maxParticipants?.toString() || '',
        isRecurring: false,
        recurringRule: event.recurringRule || 'WEEKLY',
        count: '4',
      });
    } else {
      setFormData(initialFormData);
    }
  }, [event, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: CreateEventDto) => eventsApi.create(meetingId, data),
    onSuccess: handleSuccess,
  });

  const createRecurringMutation = useMutation({
    mutationFn: (data: CreateRecurringEventDto) => eventsApi.createRecurring(meetingId, data),
    onSuccess: handleSuccess,
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateEventDto) => eventsApi.update(meetingId, event!.id, data),
    onSuccess: handleSuccess,
  });

  const deleteMutation = useMutation({
    mutationFn: () => eventsApi.delete(meetingId, event!.id),
    onSuccess: handleSuccess,
  });

  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: ['events', meetingId] });
    onClose();
  }

  const handleSubmit = () => {
    const data: CreateEventDto = {
      type: formData.type,
      title: formData.title,
      description: formData.description || undefined,
      date: new Date(formData.date).toISOString(),
      endTime: formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
      location: formData.location || undefined,
      maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
    };

    if (isEdit) {
      updateMutation.mutate(data);
    } else if (formData.isRecurring) {
      createRecurringMutation.mutate({
        ...data,
        recurringRule: formData.recurringRule,
        count: parseInt(formData.count),
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (confirm('이 이벤트를 삭제하시겠습니까?')) {
      deleteMutation.mutate();
    }
  };

  const isPending = createMutation.isPending || createRecurringMutation.isPending || updateMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? '이벤트 수정' : '이벤트 추가'}>
      <div className="space-y-4">
        {/* Type Selection */}
        <div>
          <label className="mb-1 block text-sm font-medium">유형 *</label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={formData.type === 'REGULAR' ? 'primary' : 'outline'}
              onClick={() => setFormData((p) => ({ ...p, type: 'REGULAR' }))}
              className="flex-1"
            >
              정모
            </Button>
            <Button
              type="button"
              variant={formData.type === 'LIGHTNING' ? 'primary' : 'outline'}
              onClick={() => setFormData((p) => ({ ...p, type: 'LIGHTNING' }))}
              className="flex-1"
            >
              번개
            </Button>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="mb-1 block text-sm font-medium">제목 *</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
            placeholder="이벤트 제목"
          />
        </div>

        {/* Date/Time */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">시작 *</label>
            <Input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">종료</label>
            <Input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData((p) => ({ ...p, endTime: e.target.value }))}
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="mb-1 block text-sm font-medium">장소</label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
            placeholder="모임 장소"
          />
        </div>

        {/* Max Participants */}
        <div>
          <label className="mb-1 block text-sm font-medium">최대 인원</label>
          <Input
            type="number"
            value={formData.maxParticipants}
            onChange={(e) => setFormData((p) => ({ ...p, maxParticipants: e.target.value }))}
            placeholder="제한 없음"
            min={1}
          />
        </div>

        {/* Recurring (only for create) */}
        {!isEdit && (
          <RecurringOptions formData={formData} setFormData={setFormData} />
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!formData.title || !formData.date || isPending}
            className="flex-1"
          >
            {isPending ? '저장 중...' : isEdit ? '수정' : '추가'}
          </Button>
          {isEdit && (
            <Button variant="outline" className="text-red-600" onClick={handleDelete}>
              삭제
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ================================
// Recurring Options
// ================================

interface RecurringOptionsProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

function RecurringOptions({ formData, setFormData }: RecurringOptionsProps) {
  return (
    <div className="space-y-3 rounded-lg bg-gray-50 p-3">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.isRecurring}
          onChange={(e) => setFormData((p) => ({ ...p, isRecurring: e.target.checked }))}
          className="rounded"
        />
        <span className="text-sm font-medium">반복 일정으로 생성</span>
      </label>

      {formData.isRecurring && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">반복 주기</label>
            <select
              value={formData.recurringRule}
              onChange={(e) => setFormData((p) => ({ ...p, recurringRule: e.target.value as RecurringRule }))}
              className="w-full rounded border px-3 py-2"
            >
              <option value="WEEKLY">매주</option>
              <option value="BIWEEKLY">격주</option>
              <option value="MONTHLY">매월</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">생성 개수</label>
            <Input
              type="number"
              value={formData.count}
              onChange={(e) => setFormData((p) => ({ ...p, count: e.target.value }))}
              min={1}
              max={6}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ================================
// Helpers
// ================================

function toLocalDateTime(isoString: string): string {
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
}
