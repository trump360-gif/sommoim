// ================================
// Types & Interfaces
// ================================

'use client';

import { Input } from '@/components/ui/input';
import { ImageUploader } from '@/components/ui/image-uploader';
import { FormData, SECTION_TYPES } from './types';

interface SectionFormFieldsProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  isCompact?: boolean;
}

// ================================
// Component
// ================================

export function SectionFormFields({ formData, setFormData, isCompact }: SectionFormFieldsProps) {
  const labelClass = isCompact ? 'text-xs text-gray-500' : 'text-sm font-medium';

  return (
    <>
      {/* Type & Title */}
      <div className={isCompact ? 'flex gap-3' : 'space-y-4'}>
        <div className={isCompact ? '' : ''}>
          {!isCompact && <label className="mb-1 block text-sm font-medium">타입</label>}
          <select
            value={formData.type}
            onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
            className={`rounded-md border px-3 py-2 ${isCompact ? '' : 'w-full'}`}
          >
            {SECTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className={isCompact ? 'flex-1' : ''}>
          {!isCompact && <label className="mb-1 block text-sm font-medium">제목</label>}
          <Input
            value={formData.title}
            onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
            placeholder={isCompact ? '제목' : '섹션 제목'}
          />
        </div>
      </div>

      {/* Hero Type Fields */}
      {formData.type === 'hero' && (
        <HeroFields formData={formData} setFormData={setFormData} isCompact={isCompact} />
      )}

      {/* Meetings Type Fields */}
      {formData.type === 'meetings' && (
        <MeetingsFields formData={formData} setFormData={setFormData} />
      )}
    </>
  );
}

// ================================
// Hero Fields
// ================================

function HeroFields({ formData, setFormData, isCompact }: SectionFormFieldsProps) {
  return (
    <>
      <Input
        value={formData.layoutJson.subtitle || ''}
        onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, subtitle: e.target.value } }))}
        placeholder="부제목"
      />

      {/* Colors */}
      <div className="grid grid-cols-2 gap-2">
        <ColorInput
          label="시작 색상"
          value={formData.layoutJson.bgColor || '#4f46e5'}
          onChange={(v) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, bgColor: v } }))}
          isCompact={isCompact}
        />
        <ColorInput
          label="끝 색상"
          value={formData.layoutJson.bgColorEnd || '#7c3aed'}
          onChange={(v) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, bgColorEnd: v } }))}
          isCompact={isCompact}
        />
      </div>

      {/* Background Image */}
      <div>
        <label className={`mb-2 block ${isCompact ? 'text-xs text-gray-500' : 'text-sm font-medium'}`}>
          배경 이미지 (선택)
        </label>
        <ImageUploader
          value={formData.layoutJson.bgImage}
          onChange={(url) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, bgImage: url } }))}
          aspectRatio="21/9"
          placeholder={isCompact ? '배경 이미지 업로드' : '히어로 배경 이미지를 드래그하거나 클릭해서 업로드'}
          entityType="hero"
        />
        {!isCompact && (
          <p className="mt-1 text-xs text-gray-500">
            이미지가 있으면 그라데이션 대신 이미지가 배경으로 사용됩니다
          </p>
        )}
      </div>
    </>
  );
}

// ================================
// Meetings Fields
// ================================

function MeetingsFields({ formData, setFormData }: Omit<SectionFormFieldsProps, 'isCompact'>) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <select
        value={formData.layoutJson.sort || 'latest'}
        onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, sort: e.target.value } }))}
        className="rounded-md border px-3 py-2"
      >
        <option value="latest">최신순</option>
        <option value="popular">인기순</option>
      </select>
      <Input
        type="number"
        value={formData.layoutJson.limit || 4}
        onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, limit: parseInt(e.target.value) || 4 } }))}
        placeholder="표시 개수"
      />
    </div>
  );
}

// ================================
// Color Input
// ================================

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isCompact?: boolean;
}

function ColorInput({ label, value, onChange, isCompact }: ColorInputProps) {
  return (
    <div>
      <label className={`mb-1 block ${isCompact ? 'text-xs text-gray-500' : 'text-sm font-medium'}`}>
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`cursor-pointer rounded border ${isCompact ? 'h-9 w-12' : 'h-10 w-14'}`}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={value}
          className="flex-1"
        />
      </div>
    </div>
  );
}
