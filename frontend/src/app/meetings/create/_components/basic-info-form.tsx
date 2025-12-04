// ================================
// Types & Interfaces
// ================================

'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CATEGORIES, MeetingFormData } from './types';
import type { Category } from '@/types';

interface BasicInfoFormProps {
  formData: MeetingFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onCategoryChange: (category: Category) => void;
}

// ================================
// Component
// ================================

export function BasicInfoForm({ formData, onChange, onCategoryChange }: BasicInfoFormProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">기본 정보</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            모임 이름 *
          </label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={onChange}
            placeholder="모임 이름을 입력하세요"
            required
            minLength={2}
            maxLength={100}
            className="mt-1"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            모임 설명 *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={onChange}
            placeholder="모임에 대해 자세히 설명해주세요 (최소 10자)"
            required
            minLength={10}
            maxLength={2000}
            rows={5}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">카테고리 *</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => onCategoryChange(cat.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  formData.category === cat.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            지역 *
          </label>
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={onChange}
            placeholder="예: 서울 강남구"
            required
            maxLength={200}
            className="mt-1"
          />
        </div>

        {/* Max Participants & Auto Approve */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700">
              최대 인원 *
            </label>
            <Input
              id="maxParticipants"
              name="maxParticipants"
              type="number"
              value={formData.maxParticipants}
              onChange={onChange}
              min={2}
              max={100}
              required
              className="mt-1"
            />
          </div>

          <div className="flex items-center pt-6">
            <input
              id="autoApprove"
              name="autoApprove"
              type="checkbox"
              checked={formData.autoApprove}
              onChange={onChange}
              className="h-4 w-4 rounded border-gray-300 text-primary-600"
            />
            <label htmlFor="autoApprove" className="ml-2 text-sm text-gray-700">
              자동 승인 (신청 시 바로 참가)
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
