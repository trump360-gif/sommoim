'use client';

// ================================
// Imports
// ================================
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { eventsApi } from '@/lib/api/events';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  Loader2,
  LogIn,
} from 'lucide-react';

// ================================
// Inner Component (uses useSearchParams)
// ================================
function EventCheckInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [qrCode, setQrCode] = useState<string>('');
  const [manualCode, setManualCode] = useState('');

  // Get QR code from URL
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setQrCode(code);
    }
  }, [searchParams]);

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: (code: string) => eventsApi.checkIn(code),
    onSuccess: () => {
      // Success is handled in the UI
    },
  });

  // Auto check-in when QR code is present and user is authenticated
  useEffect(() => {
    if (qrCode && isAuthenticated && !checkInMutation.isPending && !checkInMutation.isSuccess && !checkInMutation.isError) {
      checkInMutation.mutate(qrCode);
    }
  }, [qrCode, isAuthenticated, checkInMutation]);

  // Handle manual code submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      checkInMutation.mutate(manualCode.trim());
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <LogIn className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h1>
            <p className="text-gray-600 mb-6">
              출석 체크를 위해 먼저 로그인해 주세요
            </p>
            <Button onClick={() => router.push(`/auth/login?redirect=${encodeURIComponent(window.location.href)}`)}>
              로그인하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {/* Processing */}
          {checkInMutation.isPending && (
            <div className="text-center py-8">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-600 mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">출석 확인 중...</h1>
              <p className="text-gray-600">잠시만 기다려 주세요</p>
            </div>
          )}

          {/* Success */}
          {checkInMutation.isSuccess && (
            <div className="text-center py-8">
              <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">출석 완료!</h1>
              <p className="text-gray-600 mb-6">출석이 성공적으로 처리되었습니다</p>
              <Button onClick={() => router.push('/mypage/calendar')}>
                내 일정 보기
              </Button>
            </div>
          )}

          {/* Error */}
          {checkInMutation.isError && (
            <div className="text-center py-8">
              <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">출석 실패</h1>
              <p className="text-gray-600 mb-6">
                {(checkInMutation.error as any)?.response?.data?.message || 'QR 코드가 유효하지 않거나 만료되었습니다'}
              </p>
              <div className="space-y-2">
                <Button variant="outline" onClick={() => checkInMutation.reset()}>
                  다시 시도
                </Button>
                <Button variant="ghost" onClick={() => router.push('/meetings')}>
                  모임 목록으로
                </Button>
              </div>
            </div>
          )}

          {/* Manual Input (shown when no QR code and not processing) */}
          {!qrCode && !checkInMutation.isPending && !checkInMutation.isSuccess && !checkInMutation.isError && (
            <div className="text-center">
              <QrCode className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">출석 체크</h1>
              <p className="text-gray-600 mb-6">
                QR 코드를 스캔하거나 출석 코드를 입력하세요
              </p>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="출석 코드 입력"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center font-mono text-lg"
                />
                <Button type="submit" className="w-full" disabled={!manualCode.trim()}>
                  출석 확인
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ================================
// Loading Fallback
// ================================
function CheckInLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
    </div>
  );
}

// ================================
// Main Component (with Suspense boundary)
// ================================
export default function EventCheckInPage() {
  return (
    <Suspense fallback={<CheckInLoading />}>
      <EventCheckInContent />
    </Suspense>
  );
}
