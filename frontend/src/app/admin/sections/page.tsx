// ================================
// Types & Interfaces
// ================================

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, PageSection } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import {
  FormData,
  initialFormData,
  SectionCreateForm,
  SectionListItem,
} from './_components';

// ================================
// Component
// ================================

export default function AdminSectionsPage() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // ================================
  // State
  // ================================

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // ================================
  // Queries & Mutations
  // ================================

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
    mutationFn: ({ id, data }: { id: string; data: Partial<PageSection> }) =>
      adminApi.updateSection(id, data),
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

  // ================================
  // Handlers
  // ================================

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

  // ================================
  // Auth Check
  // ================================

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
        관리자 권한이 필요합니다
      </div>
    );
  }

  // ================================
  // Render
  // ================================

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">섹션 관리</h1>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
          새 섹션 추가
        </Button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <SectionCreateForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreate}
          onCancel={() => {
            setIsCreating(false);
            resetForm();
          }}
          isPending={createMutation.isPending}
        />
      )}

      {/* Section List */}
      {isLoading ? (
        <div className="py-8 text-center text-gray-500">로딩 중...</div>
      ) : !sections?.length ? (
        <div className="py-8 text-center text-gray-500">등록된 섹션이 없습니다</div>
      ) : (
        <div className="space-y-3">
          {sections.map((section, index) => (
            <SectionListItem
              key={section.id}
              section={section}
              index={index}
              totalCount={sections.length}
              isEditing={editingId === section.id}
              formData={formData}
              setFormData={setFormData}
              onEdit={() => startEdit(section)}
              onCancelEdit={() => setEditingId(null)}
              onSave={() => handleUpdate(section.id)}
              onDelete={() => deleteMutation.mutate(section.id)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              isSaving={updateMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
