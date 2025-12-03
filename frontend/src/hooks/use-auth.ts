import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiResponse } from '@/lib/api';
import { useAuthStore, type User } from '@/stores/auth.store';

interface LoginDto {
  email: string;
  password: string;
}

interface RegisterDto {
  email: string;
  password: string;
  nickname: string;
}

export function useLogin() {
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: LoginDto) => {
      const { data } = await api.post<ApiResponse<User>>('/auth/login', dto);
      return data.data;
    },
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (dto: RegisterDto) => {
      const { data } = await api.post<ApiResponse<User>>('/auth/register', dto);
      return data.data;
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
  });
}

export function useMe() {
  const setUser = useAuthStore((state) => state.setUser);

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<User>>('/auth/me');
      setUser(data.data);
      return data.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
