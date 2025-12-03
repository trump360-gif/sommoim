'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, PageSection } from '@/lib/api/admin';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageUploader } from '@/components/ui/image-uploader';

const SECTION_TYPES = [
  { value: 'hero', label: '히어로 배너' },
  { value: 'featured', label: '추천 모임' },
  { value: 'categories', label: '카테고리' },
  { value: 'banner', label: '배너 슬라이드' },
  { value: 'meetings', label: '모임 목록' },
];

interface FormData {
  type: string;
  title: string;
  order: number;
  isActive: boolean;
  layoutJson: {
    subtitle?: string;
    buttonText?: string;
    buttonLink?: string;
    secondButtonText?: string;
    secondButtonLink?: string;
    bgColor?: string;
    bgColorEnd?: string;
    bgImage?: string;
    sort?: string;
    limit?: number;
  };
}

const initialFormData: FormData = {
  type: 'hero',
  title: '',
  order: 0,
  isActive: true,
  layoutJson: {},
};

export default function AdminSectionsPage() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const { data: sections, isLoading } = useQuery<PageSection[]>({
    queryKey: ['admin-sections'],
    queryFn: adminApi.getSections,
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sections'] });
      setIsCreating(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PageSection> }) => adminApi.updateSection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sections'] });
      setEditingId(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteSection,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-sections'] }),
  });

  const reorderMutation = useMutation({
    mutationFn: adminApi.reorderSections,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-sections'] }),
  });

  const resetForm = () => setFormData(initialFormData);

  const handleCreate = () => {
    createMutation.mutate({ ...formData });
  };

  const handleUpdate = (id: string) => {
    updateMutation.mutate({ id, data: { ...formData } });
  };

  const handleMoveUp = (index: number) => {
    if (!sections || index === 0) return;
    const items = sections.map((s, i) => ({
      id: s.id,
      order: i === index ? index - 1 : i === index - 1 ? index : i,
    }));
    reorderMutation.mutate(items);
  };

  const handleMoveDown = (index: number) => {
    if (!sections || index === sections.length - 1) return;
    const items = sections.map((s, i) => ({
      id: s.id,
      order: i === index ? index + 1 : i === index + 1 ? index : i,
    }));
    reorderMutation.mutate(items);
  };

  const startEdit = (section: PageSection) => {
    setEditingId(section.id);
    const layout = (section.layoutJson as FormData['layoutJson']) || {};
    setFormData({
      type: section.type,
      title: section.title || '',
      order: section.order,
      isActive: section.isActive,
      layoutJson: layout,
    });
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <div className="flex min-h-[50vh] items-center justify-center text-gray-500">관리자 권한이 필요합니다</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">섹션 관리</h1>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
          새 섹션 추가
        </Button>
      </div>

      {isCreating && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold">새 섹션</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">타입</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                className="w-full rounded-md border px-3 py-2"
              >
                {SECTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">제목</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="섹션 제목"
              />
            </div>
            {formData.type === 'hero' && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium">부제목</label>
                  <Input
                    value={formData.layoutJson.subtitle || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, subtitle: e.target.value } }))}
                    placeholder="부제목 텍스트"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">버튼1 텍스트</label>
                    <Input
                      value={formData.layoutJson.buttonText || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, buttonText: e.target.value } }))}
                      placeholder="모임 찾아보기"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">버튼1 링크</label>
                    <Input
                      value={formData.layoutJson.buttonLink || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, buttonLink: e.target.value } }))}
                      placeholder="/meetings"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">버튼2 텍스트</label>
                    <Input
                      value={formData.layoutJson.secondButtonText || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, secondButtonText: e.target.value } }))}
                      placeholder="모임 만들기"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">버튼2 링크</label>
                    <Input
                      value={formData.layoutJson.secondButtonLink || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, secondButtonLink: e.target.value } }))}
                      placeholder="/meetings/create"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">시작 색상</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.layoutJson.bgColor || '#4f46e5'}
                        onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, bgColor: e.target.value } }))}
                        className="h-10 w-14 cursor-pointer rounded border"
                      />
                      <Input
                        value={formData.layoutJson.bgColor || '#4f46e5'}
                        onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, bgColor: e.target.value } }))}
                        placeholder="#4f46e5"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">끝 색상</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.layoutJson.bgColorEnd || '#7c3aed'}
                        onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, bgColorEnd: e.target.value } }))}
                        className="h-10 w-14 cursor-pointer rounded border"
                      />
                      <Input
                        value={formData.layoutJson.bgColorEnd || '#7c3aed'}
                        onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, bgColorEnd: e.target.value } }))}
                        placeholder="#7c3aed"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">배경 이미지 (선택)</label>
                  <ImageUploader
                    value={formData.layoutJson.bgImage}
                    onChange={(url) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, bgImage: url } }))}
                    aspectRatio="21/9"
                    placeholder="히어로 배경 이미지를 드래그하거나 클릭해서 업로드"
                    entityType="hero"
                  />
                  <p className="mt-1 text-xs text-gray-500">이미지가 있으면 그라데이션 대신 이미지가 배경으로 사용됩니다</p>
                </div>
              </>
            )}
            {formData.type === 'meetings' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">정렬</label>
                  <select
                    value={formData.layoutJson.sort || 'latest'}
                    onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, sort: e.target.value } }))}
                    className="w-full rounded-md border px-3 py-2"
                  >
                    <option value="latest">최신순</option>
                    <option value="popular">인기순</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">표시 개수</label>
                  <Input
                    type="number"
                    value={formData.layoutJson.limit || 4}
                    onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, limit: parseInt(e.target.value) || 4 } }))}
                  />
                </div>
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">순서</label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData((p) => ({ ...p, order: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
              />
              <label htmlFor="isActive" className="text-sm">활성화</label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? '저장 중...' : '저장'}
              </Button>
              <Button variant="outline" onClick={() => { setIsCreating(false); resetForm(); }}>
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="py-8 text-center text-gray-500">로딩 중...</div>
      ) : !sections?.length ? (
        <div className="py-8 text-center text-gray-500">등록된 섹션이 없습니다</div>
      ) : (
        <div className="space-y-3">
          {sections.map((section, index) => (
            <Card key={section.id} className={!section.isActive ? 'opacity-50' : ''}>
              <CardContent className="flex items-center justify-between py-4">
                {editingId === section.id ? (
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-3">
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                        className="rounded-md border px-3 py-2"
                      >
                        {SECTION_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                        placeholder="제목"
                        className="flex-1"
                      />
                    </div>
                    {formData.type === 'hero' && (
                      <>
                        <Input
                          value={formData.layoutJson.subtitle || ''}
                          onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, subtitle: e.target.value } }))}
                          placeholder="부제목"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={formData.layoutJson.buttonText || ''}
                            onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, buttonText: e.target.value } }))}
                            placeholder="버튼1 텍스트"
                          />
                          <Input
                            value={formData.layoutJson.buttonLink || ''}
                            onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, buttonLink: e.target.value } }))}
                            placeholder="버튼1 링크"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={formData.layoutJson.secondButtonText || ''}
                            onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, secondButtonText: e.target.value } }))}
                            placeholder="버튼2 텍스트"
                          />
                          <Input
                            value={formData.layoutJson.secondButtonLink || ''}
                            onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, secondButtonLink: e.target.value } }))}
                            placeholder="버튼2 링크"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">시작 색상</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={formData.layoutJson.bgColor || '#4f46e5'}
                                onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, bgColor: e.target.value } }))}
                                className="h-9 w-12 cursor-pointer rounded border"
                              />
                              <Input
                                value={formData.layoutJson.bgColor || '#4f46e5'}
                                onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, bgColor: e.target.value } }))}
                                placeholder="#4f46e5"
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">끝 색상</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={formData.layoutJson.bgColorEnd || '#7c3aed'}
                                onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, bgColorEnd: e.target.value } }))}
                                className="h-9 w-12 cursor-pointer rounded border"
                              />
                              <Input
                                value={formData.layoutJson.bgColorEnd || '#7c3aed'}
                                onChange={(e) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, bgColorEnd: e.target.value } }))}
                                placeholder="#7c3aed"
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="mb-2 block text-xs text-gray-500">배경 이미지 (선택)</label>
                          <ImageUploader
                            value={formData.layoutJson.bgImage}
                            onChange={(url) => setFormData((p) => ({ ...p, layoutJson: { ...p.layoutJson, bgImage: url } }))}
                            aspectRatio="21/9"
                            placeholder="배경 이미지 업로드"
                            entityType="hero"
                          />
                        </div>
                      </>
                    )}
                    {formData.type === 'meetings' && (
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
                    )}
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                        />
                        <span className="text-sm">활성화</span>
                      </label>
                      <Button size="sm" onClick={() => handleUpdate(section.id)} disabled={updateMutation.isPending}>
                        저장
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === sections.length - 1}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          ▼
                        </button>
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
                      <Button size="sm" variant="outline" onClick={() => startEdit(section)}>
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (confirm('이 섹션을 삭제하시겠습니까?')) {
                            deleteMutation.mutate(section.id);
                          }
                        }}
                      >
                        삭제
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
