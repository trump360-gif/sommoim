// ================================
// Types & Interfaces
// ================================

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

export interface ScheduleFormData {
  startTime: string;
  endTime: string;
  location: string;
  note: string;
}

export const initialScheduleFormData: ScheduleFormData = {
  startTime: '',
  endTime: '',
  location: '',
  note: '',
};

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formData: ScheduleFormData;
  setFormData: React.Dispatch<React.SetStateAction<ScheduleFormData>>;
  onSubmit: () => void;
  isPending: boolean;
  submitLabel: string;
}

// ================================
// Component
// ================================

export function ScheduleModal({
  isOpen,
  onClose,
  title,
  formData,
  setFormData,
  onSubmit,
  isPending,
  submitLabel,
}: ScheduleModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">시작 시간 *</label>
            <Input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData((p) => ({ ...p, startTime: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">종료 시간 *</label>
            <Input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData((p) => ({ ...p, endTime: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">장소</label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
            placeholder="상세 장소"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">메모</label>
          <Input
            value={formData.note}
            onChange={(e) => setFormData((p) => ({ ...p, note: e.target.value }))}
            placeholder="추가 안내사항"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onSubmit}
            disabled={!formData.startTime || !formData.endTime || isPending}
            className="flex-1"
          >
            {isPending ? '저장 중...' : submitLabel}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            취소
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ================================
// Helper Functions
// ================================

export function toLocalDateTime(isoString: string): string {
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
}
