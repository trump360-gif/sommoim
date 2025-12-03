'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, Report } from '@/lib/api/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Tabs } from '@/components/ui/tabs';
import type { PaginatedResponse } from '@/types';

const STATUS_TABS = [
  { key: 'all', label: '전체' },
  { key: 'PENDING', label: '대기중' },
  { key: 'PROCESSING', label: '처리중' },
  { key: 'RESOLVED', label: '해결됨' },
  { key: 'REJECTED', label: '반려됨' },
];

const REASON_LABELS: Record<string, string> = {
  SPAM: '스팸', INAPPROPRIATE: '부적절', ILLEGAL: '불법', HARASSMENT: '괴롭힘', FRAUD: '사기', DEFAMATION: '명예훼손', OTHER: '기타',
};

export default function AdminReportsPage() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const { data, isLoading } = useQuery<PaginatedResponse<Report>>({
    queryKey: ['admin-reports', page, statusFilter],
    queryFn: () => adminApi.getReports(page, 20, statusFilter === 'all' ? undefined : statusFilter),
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateReport(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      setSelectedReport(null);
    },
  });

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <div className="flex min-h-[50vh] items-center justify-center text-gray-500">권한이 없습니다</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">신고 관리</h1>

      <Tabs tabs={STATUS_TABS} activeTab={statusFilter} onChange={(key) => { setStatusFilter(key); setPage(1); }} className="mb-4" />

      {isLoading ? (
        <div className="py-8 text-center text-gray-500">로딩 중...</div>
      ) : data?.data?.length === 0 ? (
        <div className="py-8 text-center text-gray-500">신고 내역이 없습니다</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-sm font-medium">유형</th>
                  <th className="p-3 text-left text-sm font-medium">사유</th>
                  <th className="p-3 text-left text-sm font-medium">신고자</th>
                  <th className="p-3 text-left text-sm font-medium">대상</th>
                  <th className="p-3 text-left text-sm font-medium">상태</th>
                  <th className="p-3 text-left text-sm font-medium">신고일</th>
                  <th className="p-3 text-left text-sm font-medium">작업</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="p-3"><TypeBadge type={r.type} /></td>
                    <td className="p-3 text-sm">{REASON_LABELS[r.reason] || r.reason}</td>
                    <td className="p-3 text-sm">{r.sender.nickname}</td>
                    <td className="p-3 text-sm">{r.targetUser?.nickname || r.targetMeeting?.title || '-'}</td>
                    <td className="p-3"><StatusBadge status={r.status} /></td>
                    <td className="p-3 text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString('ko-KR')}</td>
                    <td className="p-3">
                      <Button size="sm" variant="outline" onClick={() => setSelectedReport(r)}>처리</Button>
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
            <Button key={i} size="sm" variant={page === i + 1 ? 'primary' : 'outline'} onClick={() => setPage(i + 1)}>{i + 1}</Button>
          ))}
        </div>
      )}

      <Modal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} title="신고 처리">
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm"><strong>유형:</strong> {selectedReport?.type === 'USER' ? '사용자' : '모임'}</p>
            <p className="text-sm"><strong>사유:</strong> {selectedReport && REASON_LABELS[selectedReport.reason]}</p>
            <p className="text-sm"><strong>대상:</strong> {selectedReport?.targetUser?.nickname || selectedReport?.targetMeeting?.title}</p>
            {selectedReport?.description && <p className="mt-2 text-sm"><strong>상세:</strong> {selectedReport.description}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => selectedReport && updateMutation.mutate({ id: selectedReport.id, status: 'PROCESSING' })}>처리중</Button>
            <Button className="bg-green-600" onClick={() => selectedReport && updateMutation.mutate({ id: selectedReport.id, status: 'RESOLVED' })}>해결</Button>
            <Button className="bg-gray-600" onClick={() => selectedReport && updateMutation.mutate({ id: selectedReport.id, status: 'REJECTED' })}>반려</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  return <span className={`rounded-full px-2 py-1 text-xs ${type === 'USER' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
    {type === 'USER' ? '사용자' : '모임'}
  </span>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700', PROCESSING: 'bg-blue-100 text-blue-700',
    RESOLVED: 'bg-green-100 text-green-700', REJECTED: 'bg-gray-100 text-gray-700',
  };
  const labels: Record<string, string> = { PENDING: '대기중', PROCESSING: '처리중', RESOLVED: '해결됨', REJECTED: '반려됨' };
  return <span className={`rounded-full px-2 py-1 text-xs ${styles[status]}`}>{labels[status]}</span>;
}
