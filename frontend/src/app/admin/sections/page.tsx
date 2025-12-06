'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, PageSection } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import {
  FormData,
  initialFormData,
  SectionCreateForm,
  SectionListItem,
} from './_components';

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const resetForm = () => setFormData(initialFormData);

  const handleCreate = () => {
    createMutation.mutate({ ...formData });
  };

  const handleUpdate = (id: string) => {
    updateMutation.mutate({ id, data: { ...formData } });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !sections) return;

    if (active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const newSections = arrayMove(sections, oldIndex, newIndex);
      const items = newSections.map((s, i) => ({
        id: s.id,
        order: i,
      }));
      reorderMutation.mutate(items);
    }
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
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
        관리자 권한이 필요합니다
      </div>
    );
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

      {isLoading ? (
        <div className="py-8 text-center text-gray-500">로딩 중...</div>
      ) : !sections?.length ? (
        <div className="py-8 text-center text-gray-500">등록된 섹션이 없습니다</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {sections.map((section) => (
                <SectionListItem
                  key={section.id}
                  section={section}
                  isEditing={editingId === section.id}
                  formData={formData}
                  setFormData={setFormData}
                  onEdit={() => startEdit(section)}
                  onCancelEdit={() => setEditingId(null)}
                  onSave={() => handleUpdate(section.id)}
                  onDelete={() => deleteMutation.mutate(section.id)}
                  isSaving={updateMutation.isPending}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
