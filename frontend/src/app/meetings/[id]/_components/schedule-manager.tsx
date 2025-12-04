// ================================
// Types & Interfaces
// ================================

'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingsApi, CreateScheduleDto } from '@/lib/api/meetings';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from './constants';
import {
  ScheduleModal,
  ScheduleFormData,
  initialScheduleFormData,
  toLocalDateTime,
} from './schedule-modal';
import type { MeetingSchedule } from '@/types';

interface ScheduleManagerProps {
  meetingId: string;
  schedules: MeetingSchedule[];
  isHost: boolean;
}

// ================================
// Component
// ================================

export function ScheduleManager({ meetingId, schedules, isHost }: ScheduleManagerProps) {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<MeetingSchedule | null>(null);
  const [formData, setFormData] = useState<ScheduleFormData>(initialScheduleFormData);

  // ================================
  // Mutations
  // ================================

  const addMutation = useMutation({
    mutationFn: (data: CreateScheduleDto) => meetingsApi.addSchedule(meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      setShowAddModal(false);
      setFormData(initialScheduleFormData);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateScheduleDto> }) =>
      meetingsApi.updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      setEditingSchedule(null);
      setFormData(initialScheduleFormData);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => meetingsApi.deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
    },
  });

  // ================================
  // Handlers
  // ================================

  const handleAdd = () => {
    if (!formData.startTime || !formData.endTime) return;
    addMutation.mutate({
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
      location: formData.location || undefined,
      note: formData.note || undefined,
    });
  };

  const handleUpdate = () => {
    if (!editingSchedule || !formData.startTime || !formData.endTime) return;
    updateMutation.mutate({
      id: editingSchedule.id,
      data: {
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        location: formData.location || undefined,
        note: formData.note || undefined,
      },
    });
  };

  const handleDelete = (scheduleId: string) => {
    if (confirm('이 일정을 삭제하시겠습니까?')) {
      deleteMutation.mutate(scheduleId);
    }
  };

  const startEdit = (schedule: MeetingSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      startTime: toLocalDateTime(schedule.startTime),
      endTime: toLocalDateTime(schedule.endTime),
      location: schedule.location || '',
      note: schedule.note || '',
    });
  };

  // ================================
  // Render
  // ================================

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-xl font-semibold">일정</h2>
        {isHost && (
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            일정 추가
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {schedules.length === 0 ? (
          <p className="py-4 text-center text-gray-500">등록된 일정이 없습니다</p>
        ) : (
          schedules.map((schedule) => (
            <ScheduleItem
              key={schedule.id}
              schedule={schedule}
              isHost={isHost}
              onEdit={() => startEdit(schedule)}
              onDelete={() => handleDelete(schedule.id)}
            />
          ))
        )}
      </CardContent>

      {/* Add Modal */}
      <ScheduleModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData(initialScheduleFormData);
        }}
        title="일정 추가"
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleAdd}
        isPending={addMutation.isPending}
        submitLabel="추가"
      />

      {/* Edit Modal */}
      <ScheduleModal
        isOpen={!!editingSchedule}
        onClose={() => {
          setEditingSchedule(null);
          setFormData(initialScheduleFormData);
        }}
        title="일정 수정"
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleUpdate}
        isPending={updateMutation.isPending}
        submitLabel="수정"
      />
    </Card>
  );
}

// ================================
// Schedule Item
// ================================

interface ScheduleItemProps {
  schedule: MeetingSchedule;
  isHost: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function ScheduleItem({ schedule, isHost, onEdit, onDelete }: ScheduleItemProps) {
  return (
    <div className="flex items-start justify-between border-l-4 border-primary-500 pl-4">
      <div>
        <p className="font-medium">{formatDate(schedule.startTime)}</p>
        <p className="text-sm text-gray-500">~ {formatDate(schedule.endTime)}</p>
        {schedule.location && (
          <p className="mt-1 text-sm text-gray-600">장소: {schedule.location}</p>
        )}
        {schedule.note && <p className="mt-1 text-sm text-gray-500">{schedule.note}</p>}
      </div>
      {isHost && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}>
            수정
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:bg-red-50"
            onClick={onDelete}
          >
            삭제
          </Button>
        </div>
      )}
    </div>
  );
}
