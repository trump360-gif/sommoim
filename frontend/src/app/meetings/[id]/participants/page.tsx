'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { meetingsApi } from '@/lib/api/meetings';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Participant } from '@/types';

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'KICKED';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: '대기중', color: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: '승인됨', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: '거절됨', color: 'bg-red-100 text-red-800' },
  CANCELLED: { label: '취소됨', color: 'bg-gray-100 text-gray-800' },
  KICKED: { label: '강퇴됨', color: 'bg-red-100 text-red-800' },
  ATTENDED: { label: '참석함', color: 'bg-blue-100 text-blue-800' },
};

export default function ParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>('ALL');

  const { data: meeting } = useQuery({
    queryKey: ['meeting', id],
    queryFn: () => meetingsApi.getOne(id),
  });

  const { data: participants, isLoading } = useQuery({
    queryKey: ['participants', id, filter],
    queryFn: () => meetingsApi.getParticipants(id, filter === 'ALL' ? undefined : filter),
  });

  const updateMutation = useMutation({
    mutationFn: ({ participantId, status }: { participantId: string; status: 'APPROVED' | 'REJECTED' | 'KICKED' }) =>
      meetingsApi.updateParticipant(id, participantId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants', id] });
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
    },
  });

  const isHost = meeting?.host?.id === user?.id;

  if (!isHost) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-500">관리 권한이 없습니다</p>
      </div>
    );
  }

  const filterTabs: { key: StatusFilter; label: string }[] = [
    { key: 'ALL', label: '전체' },
    { key: 'PENDING', label: '대기중' },
    { key: 'APPROVED', label: '승인됨' },
    { key: 'REJECTED', label: '거절됨' },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/meetings/${id}`} className="text-sm text-gray-500 hover:underline">
            ← 모임으로 돌아가기
          </Link>
          <h1 className="mt-2 text-2xl font-bold">참가자 관리</h1>
          <p className="text-gray-600">{meeting?.title}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">참가자</p>
          <p className="text-2xl font-bold">
            {meeting?._count?.participants || 0} / {meeting?.maxParticipants}
          </p>
        </div>
      </div>

      <div className="mb-6 flex gap-2 border-b">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 font-medium ${
              filter === tab.key
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-gray-500">로딩 중...</div>
      ) : !participants?.length ? (
        <div className="py-8 text-center text-gray-500">
          {filter === 'ALL' ? '아직 참가 신청이 없습니다' : `${filterTabs.find(t => t.key === filter)?.label} 참가자가 없습니다`}
        </div>
      ) : (
        <div className="space-y-4">
          {participants.map((p: Participant) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-200">
                    {p.user?.profile?.avatarUrl ? (
                      <img src={p.user.profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg text-gray-400">
                        {p.user?.nickname?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <Link href={`/profile/${p.user?.id}`} className="font-medium hover:underline">
                      {p.user?.nickname}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_LABELS[p.status]?.color || 'bg-gray-100'}`}>
                        {STATUS_LABELS[p.status]?.label || p.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(p.createdAt).toLocaleDateString('ko-KR')} 신청
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {p.status === 'PENDING' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateMutation.mutate({ participantId: p.id, status: 'APPROVED' })}
                        disabled={updateMutation.isPending}
                      >
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => updateMutation.mutate({ participantId: p.id, status: 'REJECTED' })}
                        disabled={updateMutation.isPending}
                      >
                        거절
                      </Button>
                    </>
                  )}
                  {p.status === 'APPROVED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm('이 참가자를 강퇴하시겠습니까?')) {
                          updateMutation.mutate({ participantId: p.id, status: 'KICKED' });
                        }
                      }}
                      disabled={updateMutation.isPending}
                    >
                      강퇴
                    </Button>
                  )}
                  {p.status === 'REJECTED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateMutation.mutate({ participantId: p.id, status: 'APPROVED' })}
                      disabled={updateMutation.isPending}
                    >
                      승인으로 변경
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
