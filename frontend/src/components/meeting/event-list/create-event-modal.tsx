'use client';

// ================================
// Create Event Modal Component
// ================================

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi, EventType } from '@/lib/api/events';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { toast } from 'sonner';
import { Calendar, Zap } from 'lucide-react';
import type { CreateEventModalProps, EventFormData } from './types';
import { DEFAULT_FORM_DATA } from './constants';

export function CreateEventModal({ isOpen, onClose, meetingId }: CreateEventModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<EventFormData>({ ...DEFAULT_FORM_DATA });

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
      setFormData({ ...DEFAULT_FORM_DATA });
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
