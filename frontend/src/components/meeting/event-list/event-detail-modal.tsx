'use client';

// ================================
// Event Detail Modal Component
// ================================

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { eventsApi } from '@/lib/api/events';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { toast } from 'sonner';
import {
  Calendar,
  MapPin,
  Zap,
  QrCode,
  UserCheck,
} from 'lucide-react';
import type { EventDetailModalProps } from './types';
import { formatEventDate, isUpcoming } from './utils';

export function EventDetailModal({
  event,
  meetingId,
  isHost,
  userId,
  onClose,
  onJoin,
  onLeave,
}: EventDetailModalProps) {
  const [showQr, setShowQr] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const generateQrMutation = useMutation({
    mutationFn: () => eventsApi.generateQrCode(meetingId, event!.id),
    onSuccess: (data) => {
      setQrCode(data.qrCode);
      setShowQr(true);
    },
    onError: () => {
      toast.error('QR 코드 생성에 실패했습니다');
    },
  });

  if (!event) return null;

  const dateInfo = formatEventDate(event.date);
  const myParticipation = event.participants.find((p) => p.userId === userId);
  const confirmedParticipants = event.participants.filter(
    (p) => p.status === 'CONFIRMED' || p.status === 'ATTENDED'
  );
  const isPast = !isUpcoming(event.date);

  return (
    <Modal isOpen={!!event} onClose={onClose} title={event.title}>
      <div className="space-y-4">
        {/* Type & Status */}
        <div className="flex items-center gap-2">
          {event.type === 'LIGHTNING' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
              <Zap className="h-4 w-4" />
              번개
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              <Calendar className="h-4 w-4" />
              정모
            </span>
          )}
          {isPast && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
              종료됨
            </span>
          )}
        </div>

        {/* Date & Time */}
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <div className="text-center">
                <span className="block text-xs text-gray-500">{dateInfo.month}</span>
                <span className="block text-2xl font-bold text-gray-900">{dateInfo.day}</span>
                <span className="block text-xs text-gray-500">{dateInfo.weekday}</span>
              </div>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{dateInfo.time}</p>
              {event.endTime && (
                <p className="text-sm text-gray-500">
                  ~ {formatEventDate(event.endTime).time}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">장소</p>
              <p className="text-gray-600">{event.location}</p>
            </div>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div>
            <p className="font-medium text-gray-900 mb-1">설명</p>
            <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* Participants */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-gray-900">
              참가자 ({confirmedParticipants.length}
              {event.maxParticipants && `/${event.maxParticipants}`}명)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {confirmedParticipants.length === 0 ? (
              <p className="text-sm text-gray-500">아직 참가자가 없습니다</p>
            ) : (
              confirmedParticipants.map((p) => (
                <span
                  key={p.id}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${
                    p.status === 'ATTENDED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {p.status === 'ATTENDED' && <UserCheck className="h-3 w-3" />}
                  참가자 {p.userId.slice(0, 4)}
                </span>
              ))
            )}
          </div>
        </div>

        {/* QR Code Section (Host Only) */}
        {isHost && !isPast && (
          <div className="border-t pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => generateQrMutation.mutate()}
              disabled={generateQrMutation.isPending}
            >
              <QrCode className="mr-2 h-4 w-4" />
              {generateQrMutation.isPending ? 'QR 생성 중...' : '출석 QR 코드 생성'}
            </Button>
            {showQr && qrCode && (
              <div className="mt-4 rounded-lg bg-gray-50 p-4 text-center">
                <p className="text-sm text-gray-500 mb-2">QR 코드 (30분간 유효)</p>
                <div className="inline-block rounded-lg bg-white p-4 shadow-sm">
                  <p className="font-mono text-lg">{qrCode.slice(0, 16)}...</p>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  참가자가 이 코드를 스캔하면 출석 처리됩니다
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {!isPast && (
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
            {myParticipation ? (
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={onLeave}
              >
                참가 취소
              </Button>
            ) : (
              <Button onClick={onJoin}>참가 신청</Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
