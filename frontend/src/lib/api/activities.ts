import { api } from './client';

export interface ActivityImage {
  id: string;
  imageUrl: string;
  caption?: string;
  order: number;
  uploadedById: string;
  createdAt: string;
}

export interface MeetingActivity {
  id: string;
  meetingId: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  images: ActivityImage[];
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityDto {
  title: string;
  description?: string;
  date: string;
  location?: string;
  images?: {
    imageUrl: string;
    caption?: string;
    order?: number;
  }[];
}

export interface UpdateActivityDto {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
}

export interface AddImagesDto {
  images: {
    imageUrl: string;
    caption?: string;
    order?: number;
  }[];
}

export const activitiesApi = {
  getByMeeting: (meetingId: string) =>
    api.get<MeetingActivity[]>(`/meetings/${meetingId}/activities`),

  create: (meetingId: string, data: CreateActivityDto) =>
    api.post<MeetingActivity>(`/meetings/${meetingId}/activities`, data),

  update: (activityId: string, data: UpdateActivityDto) =>
    api.put<MeetingActivity>(`/meetings/activities/${activityId}`, data),

  delete: (activityId: string) =>
    api.delete<void>(`/meetings/activities/${activityId}`),

  addImages: (activityId: string, data: AddImagesDto) =>
    api.post<MeetingActivity>(`/meetings/activities/${activityId}/images`, data),

  deleteImage: (imageId: string) =>
    api.delete<void>(`/meetings/activities/images/${imageId}`),
};
