import { api } from './client';

export interface Review {
  id: string;
  content: string;
  rating: number;
  user: {
    id: string;
    nickname: string;
    profile?: { avatarUrl?: string };
  };
  createdAt: string;
}

export interface ReviewsResponse {
  data: Review[];
  meta: { total: number; page: number; averageRating: number };
}

export interface CreateReviewDto {
  content: string;
  rating: number;
}

export const reviewsApi = {
  getByMeeting: (meetingId: string, page = 1) =>
    api.get<ReviewsResponse>(`/meetings/${meetingId}/reviews`, { params: { page } }),

  create: (meetingId: string, data: CreateReviewDto) =>
    api.post<Review>(`/meetings/${meetingId}/reviews`, data),

  update: (meetingId: string, reviewId: string, data: CreateReviewDto) =>
    api.put<Review>(`/meetings/${meetingId}/reviews/${reviewId}`, data),

  delete: (meetingId: string, reviewId: string) =>
    api.delete(`/meetings/${meetingId}/reviews/${reviewId}`),
};
