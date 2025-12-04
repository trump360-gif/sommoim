// ================================
// Types & Interfaces
// ================================

'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionFormFields } from './section-form-fields';
import { FormData } from './types';

interface SectionCreateFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
}

// ================================
// Component
// ================================

export function SectionCreateForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isPending,
}: SectionCreateFormProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <h2 className="font-semibold">새 섹션</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <SectionFormFields formData={formData} setFormData={setFormData} />

        {/* Order */}
        <div>
          <label className="mb-1 block text-sm font-medium">순서</label>
          <Input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData((p) => ({ ...p, order: parseInt(e.target.value) || 0 }))}
          />
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
          />
          <label htmlFor="isActive" className="text-sm">활성화</label>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending ? '저장 중...' : '저장'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
