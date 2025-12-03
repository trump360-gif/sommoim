'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Tabs } from '@/components/ui/tabs';
import type { Meeting, PaginatedResponse } from '@/types';

const STATUS_TABS = [
  { key: 'all', label: '전체' },
  { key: 'RECRUITING', label: '모집중' },
  { key: 'ONGOING', label: '진행중' },
  { key: 'COMPLETED', label: '완료' },
  { key: 'CANCELLED', label: '취소됨' },
];

export default function AdminMeetingsPage() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const { data, isLoading } = useQuery<PaginatedResponse<Meeting>>({
    queryKey: ['admin-meetings', page, statusFilter],
    queryFn: () => adminApi.getMeetings(page, 20, statusFilter === 'all' ? undefined : statusFilter),
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteMeeting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-meetings'] });
      setSelectedMeeting(null);
    },
  });

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <div className="flex min-h-[50vh] items-center justify-center text-gray-500">권한이 없습니다</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">모임 관리</h1>

      <Tabs tabs={STATUS_TABS} activeTab={statusFilter} onChange={(key) => { setStatusFilter(key); setPage(1); }} className="mb-4" />

      {isLoading ? (
        <div className="py-8 text-center text-gray-500">로딩 중...</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-sm font-medium">제목</th>
                  <th className="p-3 text-left text-sm font-medium">주최자</th>
                  <th className="p-3 text-left text-sm font-medium">카테고리</th>
                  <th className="p-3 text-left text-sm font-medium">상태</th>
                  <th className="p-3 text-left text-sm font-medium">조회수</th>
                  <th className="p-3 text-left text-sm font-medium">작업</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((m) => (
                  <tr key={m.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <Link href={`/meetings/${m.id}`} className="text-primary-600 hover:underline">{m.title}</Link>
                    </td>
                    <td className="p-3 text-sm">{m.host.nickname}</td>
                    <td className="p-3 text-sm"><CategoryBadge category={m.category} /></td>
                    <td className="p-3"><StatusBadge status={m.status} /></td>
                    <td className="p-3 text-sm text-gray-500">{m.viewCount}</td>
                    <td className="p-3">
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => setSelectedMeeting(m)}>삭제</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: Math.min(data.meta.totalPages, 10) }, (_, i) => (
            <Button key={i} size="sm" variant={page === i + 1 ? 'default' : 'outline'} onClick={() => setPage(i + 1)}>{i + 1}</Button>
          ))}
        </div>
      )}

      <Modal isOpen={!!selectedMeeting} onClose={() => setSelectedMeeting(null)} title="모임 삭제">
        <div className="space-y-4">
          <p>"{selectedMeeting?.title}"을(를) 삭제하시겠습니까?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedMeeting(null)}>취소</Button>
            <Button className="bg-red-600" onClick={() => selectedMeeting && deleteMutation.mutate(selectedMeeting.id)}>삭제</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    RECRUITING: 'bg-green-100 text-green-700', ONGOING: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-gray-100 text-gray-700', CANCELLED: 'bg-red-100 text-red-700', DRAFT: 'bg-yellow-100 text-yellow-700',
  };
  const labels: Record<string, string> = { RECRUITING: '모집중', ONGOING: '진행중', COMPLETED: '완료', CANCELLED: '취소', DRAFT: '임시저장' };
  return <span className={`rounded-full px-2 py-1 text-xs ${styles[status]}`}>{labels[status]}</span>;
}

function CategoryBadge({ category }: { category: string }) {
  const labels: Record<string, string> = { SPORTS: '운동', GAMES: '게임', FOOD: '음식', CULTURE: '문화', TRAVEL: '여행', STUDY: '스터디' };
  return <span className="text-sm text-gray-600">{labels[category] || category}</span>;
}
