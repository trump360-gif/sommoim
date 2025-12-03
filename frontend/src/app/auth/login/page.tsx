'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const QUICK_LOGIN_USERS = [
  { label: '관리자', email: 'admin@sommoim.com', password: 'admin123!' },
  { label: '축구좋아', email: 'user1@sommoim.com', password: 'user123!' },
  { label: '맛집탐방러', email: 'user2@sommoim.com', password: 'user123!' },
  { label: '독서광', email: 'user3@sommoim.com', password: 'user123!' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string, userPassword: string) => {
    setError('');
    setIsLoading(true);
    try {
      await login(userEmail, userPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">로그인</h1>
          <p className="mt-2 text-gray-600">소모임에 오신 것을 환영합니다</p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
            <p className="mb-3 text-center text-sm font-medium text-gray-500">빠른 로그인 (개발용)</p>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_LOGIN_USERS.map((user) => (
                <Button
                  key={user.email}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin(user.email, user.password)}
                  disabled={isLoading}
                >
                  {user.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-1"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>

          <p className="text-center text-sm text-gray-600">
            계정이 없으신가요?{' '}
            <Link href="/auth/register" className="font-medium text-primary-600 hover:text-primary-500">
              회원가입
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
