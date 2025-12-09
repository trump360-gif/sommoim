'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, CategoryEntity } from '@/lib/api/admin';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ICON_OPTIONS = ['⚽', '🎮', '🍔', '🎨', '✈️', '📚', '🎬', '🎵', '💼', '🏠', '❤️', '🎯'];
const COLOR_OPTIONS = [
  { value: '#ef4444', label: '빨강' },
  { value: '#f97316', label: '주황' },
  { value: '#eab308', label: '노랑' },
  { value: '#22c55e', label: '초록' },
  { value: '#3b82f6', label: '파랑' },
  { value: '#8b5cf6', label: '보라' },
  { value: '#ec4899', label: '분홍' },
  { value: '#6b7280', label: '회색' },
];

export default function AdminCategoriesPage() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '⚽',
    color: 'bg-blue-500',
    order: 0,
    isActive: true,
  });

  const { data: categories, isLoading } = useQuery<CategoryEntity[]>({
    queryKey: ['admin-categories'],
    queryFn: adminApi.getCategories,
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  const invalidateCategoryQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    queryClient.invalidateQueries({ queryKey: ['public', 'categories'] });
  };

  const createMutation = useMutation({
    mutationFn: adminApi.createCategory,
    onSuccess: () => {
      invalidateCategoryQueries();
      setIsCreating(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryEntity> }) => adminApi.updateCategory(id, data),
    onSuccess: () => {
      invalidateCategoryQueries();
      setEditingId(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteCategory,
    onSuccess: () => invalidateCategoryQueries(),
  });

  const resetForm = () => setFormData({ name: '', icon: '⚽', color: '#3b82f6', order: 0, isActive: true });

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = (id: string) => {
    updateMutation.mutate({
      id,
      data: {
        ...formData,
        color: formData.color || undefined,
        icon: formData.icon || undefined,
      },
    });
  };

  const startEdit = (category: CategoryEntity) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      icon: category.icon || '⚽',
      color: category.color || '',
      order: category.order,
      isActive: category.isActive,
    });
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <div className="flex min-h-[50vh] items-center justify-center text-gray-500">관리자 권한이 필요합니다</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">카테고리 관리</h1>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
          새 카테고리 추가
        </Button>
      </div>

      {isCreating && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold">새 카테고리</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">이름 *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="카테고리 이름"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">아이콘</label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, icon }))}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl ${
                      formData.icon === icon ? 'bg-primary-100 ring-2 ring-primary-500' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">색상</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, color: p.color === color.value ? '' : color.value }))}
                    className={`h-10 w-10 rounded-lg ${
                      formData.color === color.value ? 'ring-2 ring-offset-2 ring-gray-900' : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
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
              <Button onClick={handleCreate} disabled={createMutation.isPending || !formData.name}>
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
      ) : !categories?.length ? (
        <div className="py-8 text-center text-gray-500">등록된 카테고리가 없습니다</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className={!category.isActive ? 'opacity-50' : ''}>
              <CardContent className="py-4">
                {editingId === category.id ? (
                  <div className="space-y-3">
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      placeholder="이름"
                    />
                    <div className="flex flex-wrap gap-1">
                      {ICON_OPTIONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, icon }))}
                          className={`flex h-8 w-8 items-center justify-center rounded text-lg ${
                            formData.icon === icon ? 'bg-primary-100 ring-1 ring-primary-500' : 'bg-gray-100'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {COLOR_OPTIONS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, color: p.color === color.value ? '' : color.value }))}
                          className={`h-6 w-6 rounded ${
                            formData.color === color.value ? 'ring-2 ring-offset-1 ring-gray-900' : ''
                          }`}
                          style={{ backgroundColor: color.value }}
                        />
                      ))}
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                      />
                      <span className="text-sm">활성화</span>
                    </label>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdate(category.id)} disabled={updateMutation.isPending}>
                        저장
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
                      style={category.color ? { backgroundColor: category.color } : undefined}
                    >
                      {category.icon || '?'}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="font-medium">{category.name}</p>
                      {!category.isActive && <span className="text-xs text-gray-500">(비활성)</span>}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="outline" onClick={() => startEdit(category)}>
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (confirm('이 카테고리를 삭제하시겠습니까?')) {
                            deleteMutation.mutate(category.id);
                          }
                        }}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
