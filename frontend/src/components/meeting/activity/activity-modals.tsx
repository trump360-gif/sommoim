// ================================
// Types & Interfaces
// ================================

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

interface ActivityFormData {
  title: string;
  description: string;
  date: string;
  location: string;
}

interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: ActivityFormData;
  setFormData: React.Dispatch<React.SetStateAction<ActivityFormData>>;
  imageFiles: File[];
  setImageFiles: React.Dispatch<React.SetStateAction<File[]>>;
  onSubmit: () => void;
  uploading: boolean;
  isPending: boolean;
}

interface AddImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFiles: File[];
  setImageFiles: React.Dispatch<React.SetStateAction<File[]>>;
  onSubmit: () => void;
  uploading: boolean;
  isPending: boolean;
}

// ================================
// Create Activity Modal
// ================================

export function CreateActivityModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  imageFiles,
  setImageFiles,
  onSubmit,
  uploading,
  isPending,
}: CreateActivityModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="활동 기록 추가">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">활동명 *</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
            placeholder="예: 첫 번째 정모"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">날짜 *</label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">장소</label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
            placeholder="활동 장소"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">설명</label>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
            placeholder="활동에 대한 설명"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">사진</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
            className="w-full"
          />
          {imageFiles.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">{imageFiles.length}개 파일 선택됨</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onSubmit}
            disabled={!formData.title || !formData.date || uploading || isPending}
            className="flex-1"
          >
            {uploading ? '업로드 중...' : isPending ? '저장 중...' : '저장'}
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
// Add Image Modal
// ================================

export function AddImageModal({
  isOpen,
  onClose,
  imageFiles,
  setImageFiles,
  onSubmit,
  uploading,
  isPending,
}: AddImageModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="사진 추가">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">사진 선택</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
            className="w-full"
          />
          {imageFiles.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">{imageFiles.length}개 파일 선택됨</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onSubmit}
            disabled={imageFiles.length === 0 || uploading || isPending}
            className="flex-1"
          >
            {uploading ? '업로드 중...' : isPending ? '저장 중...' : '추가'}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            취소
          </Button>
        </div>
      </div>
    </Modal>
  );
}
