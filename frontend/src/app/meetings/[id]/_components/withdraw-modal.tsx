'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWithdraw: (reason?: string) => void;
  isLoading: boolean;
  meetingTitle: string;
}

export function WithdrawModal({
  isOpen,
  onClose,
  onWithdraw,
  isLoading,
  meetingTitle,
}: WithdrawModalProps) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onWithdraw(reason.trim() || undefined);
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-lg font-semibold">모임 탈퇴</h2>
        <p className="mb-4 text-sm text-gray-600">
          정말 &apos;{meetingTitle}&apos; 모임에서 탈퇴하시겠습니까?
        </p>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            탈퇴 사유 (선택)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="탈퇴 사유를 입력해주세요..."
            className="w-full resize-none rounded-md border border-gray-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            rows={3}
            maxLength={500}
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {reason.length}/500
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? '탈퇴 중...' : '탈퇴하기'}
          </Button>
        </div>
      </div>
    </div>
  );
}
