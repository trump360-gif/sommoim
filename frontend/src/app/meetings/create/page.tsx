// ================================
// Types & Interfaces
// ================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { meetingsApi, CreateMeetingDto } from '@/lib/api/meetings';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import type { Category } from '@/types';
import {
  MeetingFormData,
  ScheduleInput,
  initialFormData,
  initialSchedule,
  BasicInfoForm,
  ScheduleForm,
} from './_components';

// ================================
// Component
// ================================

export default function CreateMeetingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // ================================
  // State
  // ================================

  const [formData, setFormData] = useState<MeetingFormData>(initialFormData);
  const [schedules, setSchedules] = useState<ScheduleInput[]>([{ ...initialSchedule }]);
  const [error, setError] = useState('');

  // ================================
  // Mutations
  // ================================

  const createMutation = useMutation({
    mutationFn: (data: CreateMeetingDto) => meetingsApi.create(data),
    onSuccess: (meeting) => {
      router.push(`/meetings/${meeting.id}`);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : '모임 생성에 실패했습니다');
    },
  });

  // ================================
  // Auth Check
  // ================================

  if (!authLoading && !isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  // ================================
  // Handlers
  // ================================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
            ? parseInt(value) || 0
            : value,
    }));
  };

  const handleCategoryChange = (category: Category) => {
    setFormData((prev) => ({ ...prev, category }));
  };

  const handleScheduleChange = (index: number, field: keyof ScheduleInput, value: string) => {
    setSchedules((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addSchedule = () => {
    setSchedules((prev) => [...prev, { ...initialSchedule }]);
  };

  const removeSchedule = (index: number) => {
    if (schedules.length > 1) {
      setSchedules((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.title.length < 2) {
      setError('제목은 2자 이상이어야 합니다');
      return;
    }
    if (formData.description.length < 10) {
      setError('설명은 10자 이상이어야 합니다');
      return;
    }

    const validSchedules = schedules
      .filter((s) => s.startTime && s.endTime)
      .map((s) => ({
        startTime: new Date(s.startTime).toISOString(),
        endTime: new Date(s.endTime).toISOString(),
        location: s.location || undefined,
        note: s.note || undefined,
      }));

    createMutation.mutate({
      ...formData,
      schedules: validSchedules.length > 0 ? validSchedules : undefined,
    });
  };

  // ================================
  // Render
  // ================================

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">새 모임 만들기</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}

        <BasicInfoForm
          formData={formData}
          onChange={handleChange}
          onCategoryChange={handleCategoryChange}
        />

        <ScheduleForm
          schedules={schedules}
          onScheduleChange={handleScheduleChange}
          onAddSchedule={addSchedule}
          onRemoveSchedule={removeSchedule}
        />

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
            취소
          </Button>
          <Button type="submit" disabled={createMutation.isPending} className="flex-1">
            {createMutation.isPending ? '생성 중...' : '모임 만들기'}
          </Button>
        </div>
      </form>
    </div>
  );
}
