// ================================
// Types & Interfaces
// ================================

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesApi, CreateActivityDto } from '@/lib/api/activities';
import { uploadFile } from '@/lib/api/upload';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ActivityCard, CreateActivityModal, AddImageModal } from './activity';

interface ActivityListProps {
  meetingId: string;
  isHost: boolean;
  isParticipant: boolean;
}

// ================================
// Component
// ================================

export function ActivityList({ meetingId, isHost, isParticipant }: ActivityListProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canCreate = isHost || isParticipant;

  // ================================
  // State
  // ================================

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddImageModal, setShowAddImageModal] = useState<string | null>(null);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // ================================
  // Queries & Mutations
  // ================================

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities', meetingId],
    queryFn: () => activitiesApi.getByMeeting(meetingId),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateActivityDto) => activitiesApi.create(meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', meetingId] });
      setShowCreateModal(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (activityId: string) => activitiesApi.delete(activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', meetingId] });
    },
  });

  const addImagesMutation = useMutation({
    mutationFn: ({
      activityId,
      images,
    }: {
      activityId: string;
      images: { imageUrl: string; caption?: string }[];
    }) => activitiesApi.addImages(activityId, { images }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', meetingId] });
      setShowAddImageModal(null);
      setImageFiles([]);
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => activitiesApi.deleteImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', meetingId] });
    },
  });

  // ================================
  // Handlers
  // ================================

  const resetForm = () => {
    setFormData({ title: '', description: '', date: '', location: '' });
    setImageFiles([]);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.date) return;

    setUploading(true);
    try {
      const uploadedImages = await Promise.all(
        imageFiles.map(async (file) => {
          const url = await uploadFile(file, 'activity');
          return { imageUrl: url };
        })
      );

      await createMutation.mutateAsync({
        ...formData,
        date: new Date(formData.date).toISOString(),
        images: uploadedImages.length > 0 ? uploadedImages : undefined,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAddImages = async () => {
    if (!showAddImageModal || imageFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadedImages = await Promise.all(
        imageFiles.map(async (file) => {
          const url = await uploadFile(file, 'activity');
          return { imageUrl: url };
        })
      );

      await addImagesMutation.mutateAsync({ activityId: showAddImageModal, images: uploadedImages });
    } finally {
      setUploading(false);
    }
  };

  // ================================
  // Render
  // ================================

  if (isLoading) {
    return <div className="py-8 text-center text-gray-500">로딩 중...</div>;
  }

  return (
    <div className="space-y-4">
      {canCreate && (
        <div className="flex justify-end">
          <Button onClick={() => setShowCreateModal(true)}>활동 기록 추가</Button>
        </div>
      )}

      {!activities?.length ? (
        <div className="flex h-48 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
          아직 활동 기록이 없습니다
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              isExpanded={expandedActivity === activity.id}
              onToggle={() =>
                setExpandedActivity(expandedActivity === activity.id ? null : activity.id)
              }
              canCreate={canCreate}
              isHost={isHost}
              onDeleteImage={(imageId) => deleteImageMutation.mutate(imageId)}
              onAddImage={() => {
                setShowAddImageModal(activity.id);
                setImageFiles([]);
              }}
              onDelete={() => deleteMutation.mutate(activity.id)}
            />
          ))}
        </div>
      )}

      <CreateActivityModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        formData={formData}
        setFormData={setFormData}
        imageFiles={imageFiles}
        setImageFiles={setImageFiles}
        onSubmit={handleSubmit}
        uploading={uploading}
        isPending={createMutation.isPending}
      />

      <AddImageModal
        isOpen={!!showAddImageModal}
        onClose={() => {
          setShowAddImageModal(null);
          setImageFiles([]);
        }}
        imageFiles={imageFiles}
        setImageFiles={setImageFiles}
        onSubmit={handleAddImages}
        uploading={uploading}
        isPending={addImagesMutation.isPending}
      />
    </div>
  );
}
