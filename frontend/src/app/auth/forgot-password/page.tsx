'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { authApi } from '@/lib/api/auth';

// ================================
// Types
// ================================

type Step = 'email' | 'verify' | 'success';

// ================================
// Component
// ================================

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 이메일 입력 단계 제출
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authApi.requestPasswordReset({ email });
      setStep('verify');
    } catch (err: any) {
      setError(err.message || '요청 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 인증 코드 + 새 비밀번호 제출
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.confirmPasswordReset({ email, code, newPassword });
      setStep('success');
    } catch (err: any) {
      setError(err.message || '인증에 실패했습니다. 코드를 다시 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 성공 화면
  if (step === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 pt-16">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <span className="text-3xl">✓</span>
            </div>
            <h1 className="text-2xl font-bold">비밀번호 변경 완료</h1>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-gray-600">
              비밀번호가 성공적으로 변경되었습니다.<br />
              새 비밀번호로 로그인해주세요.
            </p>
            <Link href="/auth/login">
              <Button className="w-full">로그인하기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 인증 코드 입력 단계
  if (step === 'verify') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 pt-16">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <h1 className="text-2xl font-bold">인증 코드 입력</h1>
            <p className="mt-2 text-gray-600">
              <strong>{email}</strong>으로 발송된<br />
              6자리 인증 코드를 입력해주세요.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  인증 코드
                </label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  className="mt-1 text-center text-2xl tracking-widest"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  새 비밀번호
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="최소 8자 이상"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  비밀번호 확인
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 재입력"
                  required
                  className="mt-1"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
                {isLoading ? '확인 중...' : '비밀번호 변경'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                다른 이메일로 다시 시도
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 이메일 입력 단계
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 pt-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-bold">비밀번호 찾기</h1>
          <p className="mt-2 text-gray-600">
            가입할 때 사용한 이메일을 입력하시면<br />
            인증 코드를 보내드립니다.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="mt-1"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '전송 중...' : '인증 코드 받기'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/auth/login" className="text-sm text-primary-600 hover:underline">
              로그인으로 돌아가기
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
