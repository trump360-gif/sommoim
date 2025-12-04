// ================================
// Types & Interfaces
// ================================

'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScheduleInput } from './types';

interface ScheduleFormProps {
  schedules: ScheduleInput[];
  onScheduleChange: (index: number, field: keyof ScheduleInput, value: string) => void;
  onAddSchedule: () => void;
  onRemoveSchedule: (index: number) => void;
}

// ================================
// Component
// ================================

export function ScheduleForm({
  schedules,
  onScheduleChange,
  onAddSchedule,
  onRemoveSchedule,
}: ScheduleFormProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-xl font-semibold">일정</h2>
        <Button type="button" variant="outline" size="sm" onClick={onAddSchedule}>
          일정 추가
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {schedules.map((schedule, index) => (
          <ScheduleItem
            key={index}
            schedule={schedule}
            index={index}
            canRemove={schedules.length > 1}
            onChange={onScheduleChange}
            onRemove={onRemoveSchedule}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// ================================
// Schedule Item
// ================================

interface ScheduleItemProps {
  schedule: ScheduleInput;
  index: number;
  canRemove: boolean;
  onChange: (index: number, field: keyof ScheduleInput, value: string) => void;
  onRemove: (index: number) => void;
}

function ScheduleItem({ schedule, index, canRemove, onChange, onRemove }: ScheduleItemProps) {
  return (
    <div className="relative rounded-lg border border-gray-200 p-4">
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="absolute right-2 top-2 text-gray-400 hover:text-red-500"
        >
          ✕
        </button>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">시작 시간</label>
          <Input
            type="datetime-local"
            value={schedule.startTime}
            onChange={(e) => onChange(index, 'startTime', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">종료 시간</label>
          <Input
            type="datetime-local"
            value={schedule.endTime}
            onChange={(e) => onChange(index, 'endTime', e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">장소</label>
          <Input
            value={schedule.location}
            onChange={(e) => onChange(index, 'location', e.target.value)}
            placeholder="상세 장소"
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">메모</label>
          <Input
            value={schedule.note}
            onChange={(e) => onChange(index, 'note', e.target.value)}
            placeholder="추가 안내사항"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}
