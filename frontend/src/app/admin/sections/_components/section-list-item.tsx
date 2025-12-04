// ================================
// Types & Interfaces
// ================================

'use client';

import { PageSection } from '@/lib/api/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SectionFormFields } from './section-form-fields';
import { FormData, SECTION_TYPES } from './types';

interface SectionListItemProps {
  section: PageSection;
  index: number;
  totalCount: number;
  isEditing: boolean;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isSaving: boolean;
}

// ================================
// Component
// ================================

export function SectionListItem({
  section,
  index,
  totalCount,
  isEditing,
  formData,
  setFormData,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
  isSaving,
}: SectionListItemProps) {
  return (
    <Card className={!section.isActive ? 'opacity-50' : ''}>
      <CardContent className="flex items-center justify-between py-4">
        {isEditing ? (
          <EditingView
            formData={formData}
            setFormData={setFormData}
            onSave={onSave}
            onCancel={onCancelEdit}
            isSaving={isSaving}
          />
        ) : (
          <DisplayView
            section={section}
            index={index}
            totalCount={totalCount}
            onEdit={onEdit}
            onDelete={onDelete}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ================================
// Editing View
// ================================

interface EditingViewProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

function EditingView({ formData, setFormData, onSave, onCancel, isSaving }: EditingViewProps) {
  return (
    <div className="flex-1 space-y-3">
      <SectionFormFields formData={formData} setFormData={setFormData} isCompact />

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
          />
          <span className="text-sm">활성화</span>
        </label>
        <Button size="sm" onClick={onSave} disabled={isSaving}>
          저장
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          취소
        </Button>
      </div>
    </div>
  );
}

// ================================
// Display View
// ================================

interface DisplayViewProps {
  section: PageSection;
  index: number;
  totalCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function DisplayView({
  section,
  index,
  totalCount,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: DisplayViewProps) {
  return (
    <>
      <div className="flex items-center gap-4">
        <ReorderButtons
          index={index}
          totalCount={totalCount}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
        <div>
          <span className="mr-2 rounded bg-gray-100 px-2 py-1 text-sm">
            {SECTION_TYPES.find((t) => t.value === section.type)?.label || section.type}
          </span>
          <span className="font-medium">{section.title || '(제목 없음)'}</span>
          {!section.isActive && <span className="ml-2 text-sm text-gray-500">(비활성)</span>}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onEdit}>
          수정
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 hover:bg-red-50"
          onClick={() => {
            if (confirm('이 섹션을 삭제하시겠습니까?')) {
              onDelete();
            }
          }}
        >
          삭제
        </Button>
      </div>
    </>
  );
}

// ================================
// Reorder Buttons
// ================================

interface ReorderButtonsProps {
  index: number;
  totalCount: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function ReorderButtons({ index, totalCount, onMoveUp, onMoveDown }: ReorderButtonsProps) {
  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={onMoveUp}
        disabled={index === 0}
        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
      >
        ▲
      </button>
      <button
        onClick={onMoveDown}
        disabled={index === totalCount - 1}
        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
      >
        ▼
      </button>
    </div>
  );
}
