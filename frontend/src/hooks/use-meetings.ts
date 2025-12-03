import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, PaginatedResponse, ApiResponse } from '@/lib/api';
import type { Meeting, Category, MeetingStatus } from '@/types/meeting';

interface GetMeetingsParams {
  page?: number;
  limit?: number;
  category?: Category;
  status?: MeetingStatus;
  search?: string;
}

export function useMeetings(params: GetMeetingsParams = {}) {
  return useQuery({
    queryKey: ['meetings', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Meeting>>('/meetings', {
        params,
      });
      return data;
    },
  });
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: ['meeting', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Meeting>>(`/meetings/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

interface CreateMeetingDto {
  title: string;
  description: string;
  category: Category;
  location: string;
  maxParticipants: number;
  autoApprove?: boolean;
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateMeetingDto) => {
      const { data } = await api.post<ApiResponse<Meeting>>('/meetings', dto);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
}

export function useJoinMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meetingId: string) => {
      const { data } = await api.post(`/meetings/${meetingId}/join`);
      return data;
    },
    onSuccess: (_, meetingId) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
    },
  });
}

export function useBookmarkMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meetingId: string) => {
      const { data } = await api.post(`/meetings/${meetingId}/bookmark`);
      return data;
    },
    onSuccess: (_, meetingId) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}
