'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesApi, MeetingActivity, CreateActivityDto } from '@/lib/api/activities';
import { uploadFile } from '@/lib/api/upload';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { ImageGallery } from './image-gallery';
import { ActivityAttendance } from './activity-attendance';

interface ActivityListProps {
  meetingId: string;
  isHost: boolean;
  isParticipant: boolean;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function ActivityList({ meetingId, isHost, isParticipant }: ActivityListProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canCreate = isHost || isParticipant;
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
    mutationFn: ({ activityId, images }: { activityId: string; images: { imageUrl: string; caption?: string }[] }) =>
      activitiesApi.addImages(activityId, { images }),
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

  const handleAddImages = async (activityId: string) => {
    if (imageFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadedImages = await Promise.all(
        imageFiles.map(async (file) => {
          const url = await uploadFile(file, 'activity');
          return { imageUrl: url };
        })
      );

      await addImagesMutation.mutateAsync({ activityId, images: uploadedImages });
    } finally {
      setUploading(false);
    }
  };

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
            <Card key={activity.id}>
              <CardHeader
                className="cursor-pointer"
                onClick={() => setExpandedActivity(expandedActivity === activity.id ? null : activity.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{activity.title}</h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(activity.date)}
                      {activity.location && ` · ${activity.location}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {activity.images.length > 0 && (
                      <span className="rounded-full bg-primary-100 px-2 py-1 text-xs text-primary-700">
                        사진 {activity.images.length}장
                      </span>
                    )}
                    <span className="text-gray-400">{expandedActivity === activity.id ? '▲' : '▼'}</span>
                  </div>
                </div>
              </CardHeader>
              {expandedActivity === activity.id && (
                <CardContent className="space-y-4">
                  {activity.description && (
                    <p className="whitespace-pre-wrap text-gray-600">{activity.description}</p>
                  )}

                  <ImageGallery
                    images={activity.images}
                    canDelete={isHost}
                    onDelete={(imageId) => {
                      if (confirm('이 이미지를 삭제하시겠습니까?')) {
                        deleteImageMutation.mutate(imageId);
                      }
                    }}
                  />

                  {/* 참석 여부 섹션 */}
                  {canCreate && (
                    <div className="rounded-lg bg-gray-50 p-4">
                      <ActivityAttendance activityId={activity.id} activityTitle={activity.title} />
                    </div>
                  )}

                  {canCreate && (
                    <div className="flex gap-2 border-t pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowAddImageModal(activity.id);
                          setImageFiles([]);
                        }}
                      >
                        사진 추가
                      </Button>
                      {isHost && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => {
                            if (confirm('이 활동 기록을 삭제하시겠습니까?')) {
                              deleteMutation.mutate(activity.id);
                            }
                          }}
                        >
                          삭제
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="활동 기록 추가"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">활동명 *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              placeholder="예: 첫 번째 정모"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">날짜 *</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">장소</label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
              placeholder="활동 장소"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">설명</label>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              placeholder="활동에 대한 설명"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">사진</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
              className="w-full"
            />
            {imageFiles.length > 0 && (
              <p className="mt-1 text-sm text-gray-500">{imageFiles.length}개 파일 선택됨</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!formData.title || !formData.date || uploading || createMutation.isPending}
              className="flex-1"
            >
              {uploading ? '업로드 중...' : createMutation.isPending ? '저장 중...' : '저장'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              className="flex-1"
            >
              취소
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!showAddImageModal}
        onClose={() => {
          setShowAddImageModal(null);
          setImageFiles([]);
        }}
        title="사진 추가"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">사진 선택</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
              className="w-full"
            />
            {imageFiles.length > 0 && (
              <p className="mt-1 text-sm text-gray-500">{imageFiles.length}개 파일 선택됨</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => showAddImageModal && handleAddImages(showAddImageModal)}
              disabled={imageFiles.length === 0 || uploading || addImagesMutation.isPending}
              className="flex-1"
            >
              {uploading ? '업로드 중...' : addImagesMutation.isPending ? '저장 중...' : '추가'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddImageModal(null);
                setImageFiles([]);
              }}
              className="flex-1"
            >
              취소
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
