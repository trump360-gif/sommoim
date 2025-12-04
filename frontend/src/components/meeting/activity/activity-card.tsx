// ================================
// Types & Interfaces
// ================================

'use client';

import { MeetingActivity } from '@/lib/api/activities';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageGallery } from '../image-gallery';
import { ActivityAttendance } from '../activity-attendance';

interface ActivityCardProps {
  activity: MeetingActivity;
  isExpanded: boolean;
  onToggle: () => void;
  canCreate: boolean;
  isHost: boolean;
  onDeleteImage: (imageId: string) => void;
  onAddImage: () => void;
  onDelete: () => void;
}

// ================================
// Helper Function
// ================================

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ================================
// Component
// ================================

export function ActivityCard({
  activity,
  isExpanded,
  onToggle,
  canCreate,
  isHost,
  onDeleteImage,
  onAddImage,
  onDelete,
}: ActivityCardProps) {
  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={onToggle}>
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
            <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {activity.description && (
            <p className="whitespace-pre-wrap text-gray-600">{activity.description}</p>
          )}

          <ImageGallery
            images={activity.images}
            canDelete={isHost}
            onDelete={(imageId) => {
              if (confirm('이 이미지를 삭제하시겠습니까?')) {
                onDeleteImage(imageId);
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
              <Button variant="outline" size="sm" onClick={onAddImage}>
                사진 추가
              </Button>
              {isHost && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (confirm('이 활동 기록을 삭제하시겠습니까?')) {
                      onDelete();
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
  );
}
