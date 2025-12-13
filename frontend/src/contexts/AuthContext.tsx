'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.me();
      setUser(userData);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    await authApi.login({ email, password });
    // 로그인 시 이전 캐시 초기화 (다른 사용자 데이터가 남아있을 수 있음)
    queryClient.clear();
    await refreshUser();
    router.push('/');
  };

  const register = async (email: string, password: string, nickname: string) => {
    await authApi.register({ email, password, nickname });
    queryClient.clear();
    await refreshUser();
    router.push('/');
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    // 로그아웃 시 모든 캐시 초기화 (이전 사용자 데이터 제거)
    queryClient.clear();
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
