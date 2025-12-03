import { api } from './client';
import type { User } from '@/types';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  nickname: string;
}

export interface AuthResponse {
  user: User;
  message: string;
}

export const authApi = {
  login: (data: LoginDto) => api.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterDto) => api.post<AuthResponse>('/auth/register', data),
  logout: () => api.post<{ message: string }>('/auth/logout'),
  me: () => api.get<User>('/auth/me'),
  refresh: () => api.post<{ message: string }>('/auth/refresh'),
};
