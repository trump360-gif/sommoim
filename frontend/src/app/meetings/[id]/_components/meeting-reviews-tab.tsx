// ================================
// Types & Interfaces
// ================================

'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi, Review, CreateReviewDto } from '@/lib/api/reviews';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MeetingReviewsTabProps {
  meetingId: string;
  participantStatus: string | null;
  reviewsData:
    | {
        data: Review[];
        meta?: { averageRating?: number };
      }
    | undefined;
}

// ================================
// Component
// ================================

export function MeetingReviewsTab({
  meetingId,
  participantStatus,
  reviewsData,
}: MeetingReviewsTabProps) {
  const queryClient = useQueryClient();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ content: '', rating: 5 });

  const createReviewMutation = useMutation({
    mutationFn: (data: CreateReviewDto) => reviewsApi.create(meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', meetingId] });
      setShowReviewForm(false);
      setReviewForm({ content: '', rating: 5 });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">리뷰</h2>
          {reviewsData?.meta?.averageRating && (
            <p className="text-sm text-gray-500">
              평균 ⭐ {reviewsData.meta.averageRating.toFixed(1)}
            </p>
          )}
        </div>
        {participantStatus === 'APPROVED' && !showReviewForm && (
          <Button size="sm" onClick={() => setShowReviewForm(true)}>
            리뷰 작성
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Review Form */}
        {showReviewForm && (
          <ReviewForm
            reviewForm={reviewForm}
            setReviewForm={setReviewForm}
            onSubmit={() => createReviewMutation.mutate(reviewForm)}
            onCancel={() => setShowReviewForm(false)}
            isPending={createReviewMutation.isPending}
          />
        )}

        {/* Reviews List */}
        {reviewsData?.data?.length === 0 ? (
          <p className="py-4 text-center text-gray-500">아직 리뷰가 없습니다</p>
        ) : (
          reviewsData?.data?.map((review) => <ReviewItem key={review.id} review={review} />)
        )}
      </CardContent>
    </Card>
  );
}

// ================================
// Review Form
// ================================

interface ReviewFormProps {
  reviewForm: { content: string; rating: number };
  setReviewForm: React.Dispatch<React.SetStateAction<{ content: string; rating: number }>>;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function ReviewForm({ reviewForm, setReviewForm, onSubmit, onCancel, isPending }: ReviewFormProps) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div>
        <label className="mb-1 block text-sm font-medium">평점</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setReviewForm((p) => ({ ...p, rating: star }))}
              className={`text-2xl ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">내용</label>
        <textarea
          className="w-full rounded-md border p-2"
          rows={3}
          value={reviewForm.content}
          onChange={(e) => setReviewForm((p) => ({ ...p, content: e.target.value }))}
          placeholder="모임에 대한 후기를 남겨주세요"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onSubmit} disabled={isPending || !reviewForm.content.trim()}>
          {isPending ? '등록 중...' : '등록'}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          취소
        </Button>
      </div>
    </div>
  );
}

// ================================
// Review Item
// ================================

function ReviewItem({ review }: { review: Review }) {
  return (
    <div className="border-b pb-4 last:border-0">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-gray-200" />
        <div>
          <p className="text-sm font-medium">{review.user.nickname}</p>
          <p className="text-xs text-gray-500">
            {'⭐'.repeat(review.rating)} {new Date(review.createdAt).toLocaleDateString('ko-KR')}
          </p>
        </div>
      </div>
      <p className="text-sm text-gray-700">{review.content}</p>
    </div>
  );
}
