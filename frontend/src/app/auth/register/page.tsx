'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다');
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, nickname);
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-block rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 px-4 py-2 shadow-lg">
            <span className="text-2xl font-bold text-white">소모임</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">회원가입</h1>
          <p className="mt-2 text-gray-600">새로운 모임을 시작해보세요</p>
        </div>

        <div className="rounded-2xl border-0 bg-white p-8 shadow-medium">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  이메일
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="mt-2 rounded-xl border-gray-300 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label htmlFor="nickname" className="block text-sm font-semibold text-gray-700">
                  닉네임
                </label>
                <Input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="닉네임"
                  required
                  minLength={2}
                  maxLength={20}
                  className="mt-2 rounded-xl border-gray-300 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  비밀번호
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8자 이상"
                  required
                  minLength={8}
                  className="mt-2 rounded-xl border-gray-300 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                  비밀번호 확인
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 확인"
                  required
                  className="mt-2 rounded-xl border-gray-300 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl bg-primary-600 py-6 text-base font-semibold shadow-sm transition-all hover:bg-primary-700 hover:shadow-md"
              disabled={isLoading}
            >
              {isLoading ? '가입 중...' : '회원가입'}
            </Button>

            <p className="text-center text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link href="/auth/login" className="font-semibold text-primary-600 transition-colors hover:text-primary-700">
                로그인
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
