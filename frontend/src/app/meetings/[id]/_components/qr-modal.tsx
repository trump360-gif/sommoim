// ================================
// Types & Imports
// ================================

'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { eventsApi, AttendanceStats } from '@/lib/api/events';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { QrCode, Users, Check, X, Clock } from 'lucide-react';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  eventId: string | null;
}

// ================================
// Component
// ================================

export function QrModal({ isOpen, onClose, meetingId, eventId }: QrModalProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const generateMutation = useMutation({
    mutationFn: () => eventsApi.generateQrCode(meetingId, eventId!),
    onSuccess: (data) => {
      setQrCode(data.qrCode);
      setExpiresAt(new Date(data.expiresAt));
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['attendance', eventId],
    queryFn: () => eventsApi.getAttendanceStats(meetingId, eventId!),
    enabled: !!eventId && isOpen,
    refetchInterval: 5000, // 5초마다 갱신
  });

  useEffect(() => {
    if (!isOpen) {
      setQrCode(null);
      setExpiresAt(null);
    }
  }, [isOpen]);

  if (!eventId) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR 출석 체크">
      <div className="space-y-6">
        {/* QR Code Section */}
        <div className="text-center">
          {qrCode ? (
            <QrCodeDisplay qrCode={qrCode} expiresAt={expiresAt} />
          ) : (
            <div className="py-8">
              <QrCode className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <p className="mb-4 text-gray-500">QR 코드를 생성하여 출석을 체크하세요</p>
              <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
                {generateMutation.isPending ? '생성 중...' : 'QR 코드 생성'}
              </Button>
            </div>
          )}
        </div>

        {/* Attendance Stats */}
        {stats && <AttendanceStatsDisplay stats={stats} />}

        {/* Regenerate Button */}
        {qrCode && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              새 QR 코드 생성
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ================================
// QR Code Display
// ================================

interface QrCodeDisplayProps {
  qrCode: string;
  expiresAt: Date | null;
}

function QrCodeDisplay({ qrCode, expiresAt }: QrCodeDisplayProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('만료됨');
        clearInterval(interval);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Generate a simple visual QR representation (in production, use a QR library)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`;

  return (
    <div className="py-4">
      <div className="mx-auto mb-4 h-52 w-52 rounded-lg border-2 border-dashed border-gray-300 p-2">
        <img src={qrUrl} alt="QR Code" className="h-full w-full" />
      </div>
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Clock className="h-4 w-4" />
        <span>남은 시간: {timeLeft}</span>
      </div>
      <p className="mt-2 text-xs text-gray-400">참가자가 이 QR 코드를 스캔하면 출석이 체크됩니다</p>
    </div>
  );
}

// ================================
// Attendance Stats Display
// ================================

interface AttendanceStatsDisplayProps {
  stats: AttendanceStats;
}

function AttendanceStatsDisplay({ stats }: AttendanceStatsDisplayProps) {
  const total = stats.CONFIRMED + stats.ATTENDED + stats.PENDING + stats.DECLINED + stats.NO_SHOW;

  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <h3 className="mb-3 flex items-center gap-2 font-medium">
        <Users className="h-4 w-4" />
        출석 현황
      </h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <StatItem
          icon={<Check className="h-4 w-4 text-green-500" />}
          label="출석 완료"
          value={stats.ATTENDED}
        />
        <StatItem
          icon={<Clock className="h-4 w-4 text-blue-500" />}
          label="참여 예정"
          value={stats.CONFIRMED}
        />
        <StatItem
          icon={<X className="h-4 w-4 text-gray-400" />}
          label="불참"
          value={stats.DECLINED}
        />
        <StatItem
          icon={<X className="h-4 w-4 text-red-500" />}
          label="노쇼"
          value={stats.NO_SHOW}
        />
      </div>
      <div className="mt-3 border-t pt-3 text-center text-sm text-gray-600">
        출석률: {total > 0 ? Math.round((stats.ATTENDED / total) * 100) : 0}%
      </div>
    </div>
  );
}

// ================================
// Stat Item
// ================================

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

function StatItem({ icon, label, value }: StatItemProps) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-gray-600">{label}</span>
      <span className="ml-auto font-semibold">{value}</span>
    </div>
  );
}
