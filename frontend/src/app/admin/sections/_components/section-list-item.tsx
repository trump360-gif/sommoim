'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageSection } from '@/lib/api/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SectionFormFields } from './section-form-fields';
import { FormData, SECTION_TYPES } from './types';

interface SectionListItemProps {
  section: PageSection;
  isEditing: boolean;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  isSaving: boolean;
}

export function SectionListItem({
  section,
  isEditing,
  formData,
  setFormData,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  isSaving,
}: SectionListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
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
              onEdit={onEdit}
              onDelete={onDelete}
              dragHandleProps={{ ...attributes, ...listeners }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

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

interface DisplayViewProps {
  section: PageSection;
  onEdit: () => void;
  onDelete: () => void;
  dragHandleProps: any;
}

function DisplayView({
  section,
  onEdit,
  onDelete,
  dragHandleProps,
}: DisplayViewProps) {
  return (
    <>
      <div className="flex items-center gap-4">
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing touch-none p-2 text-gray-400 hover:text-gray-600"
          title="드래그하여 순서 변경"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </div>
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
