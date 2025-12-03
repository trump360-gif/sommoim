import { api } from './client';
import type { PaginatedResponse, User, Meeting } from '@/types';

export interface DashboardStats {
  userCount: number;
  meetingCount: number;
  activeUsers: number;
  pendingReports: number;
}

export interface Report {
  id: string;
  type: 'USER' | 'MEETING';
  reason: string;
  description?: string;
  status: 'PENDING' | 'PROCESSING' | 'RESOLVED' | 'REJECTED';
  sender: { nickname: string };
  targetUser?: { nickname: string };
  targetMeeting?: { title: string };
  createdAt: string;
}

export interface PageSection {
  id: string;
  type: string;
  title?: string;
  layoutJson: Record<string, unknown>;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Banner {
  id: string;
  imageUrl: string;
  linkUrl?: string;
  order: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryEntity {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReorderItem {
  id: string;
  order: number;
}

export const adminApi = {
  getDashboard: () => api.get<DashboardStats>('/admin/dashboard'),

  // 사용자 관리
  getUsers: (page = 1, limit = 20, search?: string) =>
    api.get<PaginatedResponse<User>>('/admin/users', { params: { page, limit, search } }),
  updateUserRole: (id: string, role: string) => api.put<User>(`/admin/users/${id}/role`, { role }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  // 모임 관리
  getMeetings: (page = 1, limit = 20, status?: string) =>
    api.get<PaginatedResponse<Meeting>>('/admin/meetings', { params: { page, limit, status } }),
  deleteMeeting: (id: string) => api.delete(`/admin/meetings/${id}`),

  // 신고 관리
  getReports: (page = 1, limit = 20, status?: string) =>
    api.get<PaginatedResponse<Report>>('/admin/reports', { params: { page, limit, status } }),
  updateReport: (id: string, status: string) => api.put<Report>(`/admin/reports/${id}`, { status }),

  // 섹션 관리
  getSections: () => api.get<PageSection[]>('/admin/page-sections'),
  createSection: (data: Omit<PageSection, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<PageSection>('/admin/page-sections', data),
  updateSection: (id: string, data: Partial<PageSection>) =>
    api.put<PageSection>(`/admin/page-sections/${id}`, data),
  deleteSection: (id: string) => api.delete(`/admin/page-sections/${id}`),
  reorderSections: (items: ReorderItem[]) =>
    api.put('/admin/page-sections/reorder', { items }),

  // 배너 관리
  getBanners: () => api.get<Banner[]>('/admin/banners'),
  createBanner: (data: Omit<Banner, 'id' | 'clickCount' | 'createdAt' | 'updatedAt'>) =>
    api.post<Banner>('/admin/banners', data),
  updateBanner: (id: string, data: Partial<Banner>) =>
    api.put<Banner>(`/admin/banners/${id}`, data),
  deleteBanner: (id: string) => api.delete(`/admin/banners/${id}`),

  // 카테고리 관리
  getCategories: () => api.get<CategoryEntity[]>('/admin/categories'),
  createCategory: (data: Omit<CategoryEntity, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<CategoryEntity>('/admin/categories', data),
  updateCategory: (id: string, data: Partial<CategoryEntity>) =>
    api.put<CategoryEntity>(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/admin/categories/${id}`),

  // 공개 API - 사용자 페이지용
  getPublicSections: () => api.get<PageSection[]>('/admin/public/sections'),
  getPublicBanners: () => api.get<Banner[]>('/admin/public/banners'),
  getPublicCategories: () => api.get<CategoryEntity[]>('/admin/public/categories'),
};
