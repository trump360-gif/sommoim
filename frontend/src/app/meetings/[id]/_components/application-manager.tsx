'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingsApi, Application } from '@/lib/api/meetings';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, X, Users, ChevronDown, ChevronUp } from 'lucide-react';

// ================================
// Types
// ================================

interface ApplicationManagerProps {
  meetingId: string;
  isHost: boolean;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: '대기 중', color: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: '승인됨', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: '거절됨', color: 'bg-red-100 text-red-800' },
  CANCELLED: { label: '취소됨', color: 'bg-gray-100 text-gray-800' },
  KICKED: { label: '추방됨', color: 'bg-red-100 text-red-800' },
};

// ================================
// Component
// ================================

export function ApplicationManager({ meetingId, isHost }: ApplicationManagerProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // ================================
  // Queries
  // ================================

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications', meetingId, activeTab],
    queryFn: () => meetingsApi.getApplications(meetingId, activeTab),
    enabled: isHost,
  });

  // ================================
  // Mutations
  // ================================

  const reviewMutation = useMutation({
    mutationFn: ({ participantId, status, reason }: { participantId: string; status: 'APPROVED' | 'REJECTED'; reason?: string }) =>
      meetingsApi.reviewApplication(participantId, { status, reason }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      setSelectedIds([]);
      toast.success(variables.status === 'APPROVED' ? '가입을 승인했습니다' : '가입을 거절했습니다');
    },
    onError: () => toast.error('처리에 실패했습니다'),
  });

  const bulkReviewMutation = useMutation({
    mutationFn: ({ status, reason }: { status: 'APPROVED' | 'REJECTED'; reason?: string }) =>
      meetingsApi.bulkReviewApplications(meetingId, selectedIds, { status, reason }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      setSelectedIds([]);
      setShowRejectModal(false);
      toast.success(`${data.success}명 ${variables.status === 'APPROVED' ? '승인' : '거절'} 완료`);
    },
    onError: () => toast.error('일괄 처리에 실패했습니다'),
  });

  // ================================
  // Handlers
  // ================================

  const handleApprove = (participantId: string) => {
    reviewMutation.mutate({ participantId, status: 'APPROVED' });
  };

  const handleReject = (participantId: string, reason?: string) => {
    reviewMutation.mutate({ participantId, status: 'REJECTED', reason });
  };

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    bulkReviewMutation.mutate({ status: 'APPROVED' });
  };

  const handleBulkReject = () => {
    if (selectedIds.length === 0) return;
    setShowRejectModal(true);
  };

  const confirmBulkReject = () => {
    bulkReviewMutation.mutate({ status: 'REJECTED', reason: rejectReason });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === applications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(applications.map((a) => a.id));
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ================================
  // Render
  // ================================

  if (!isHost) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-4 text-lg font-semibold">가입 신청 관리</h3>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setActiveTab(status)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              activeTab === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {STATUS_LABELS[status].label}
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {activeTab === 'PENDING' && applications.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedIds.length === applications.length}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-gray-300"
            />
            전체 선택
          </label>
          {selectedIds.length > 0 && (
            <>
              <span className="text-sm text-gray-500">({selectedIds.length}명 선택)</span>
              <Button
                size="sm"
                onClick={handleBulkApprove}
                disabled={bulkReviewMutation.isPending}
              >
                일괄 승인
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600"
                onClick={handleBulkReject}
                disabled={bulkReviewMutation.isPending}
              >
                일괄 거절
              </Button>
            </>
          )}
        </div>
      )}

      {/* Applications List */}
      {isLoading ? (
        <p className="text-sm text-gray-500">로딩 중...</p>
      ) : applications.length === 0 ? (
        <p className="text-sm text-gray-500">신청이 없습니다</p>
      ) : (
        <ul className="space-y-3">
          {applications.map((app) => (
            <li
              key={app.id}
              className="rounded-lg border border-gray-100 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {activeTab === 'PENDING' && (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(app.id)}
                      onChange={() => toggleSelect(app.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />
                  )}
                  <div className="h-10 w-10 rounded-full bg-gray-200" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{app.user.nickname}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${STATUS_LABELS[app.status].color}`}
                      >
                        {STATUS_LABELS[app.status].label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{formatDate(app.createdAt)}</p>
                    {app.introduction && (
                      <p className="mt-1 text-sm text-gray-700">{app.introduction}</p>
                    )}
                    {app.answers.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {app.answers.map((answer) => (
                          <div key={answer.id} className="text-sm">
                            <p className="text-gray-500">{answer.question?.question}</p>
                            <p className="text-gray-700">{answer.answer}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {app.rejectedReason && (
                      <p className="mt-1 text-sm text-red-600">
                        거절 사유: {app.rejectedReason}
                      </p>
                    )}
                  </div>
                </div>
                {activeTab === 'PENDING' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(app.id)}
                      disabled={reviewMutation.isPending}
                    >
                      승인
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => handleReject(app.id)}
                      disabled={reviewMutation.isPending}
                    >
                      거절
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h4 className="mb-4 text-lg font-semibold">거절 사유 입력</h4>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="거절 사유를 입력하세요 (선택사항)"
              className="mb-4 w-full rounded-lg border border-gray-300 p-2"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowRejectModal(false)}>
                취소
              </Button>
              <Button
                onClick={confirmBulkReject}
                disabled={bulkReviewMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {bulkReviewMutation.isPending ? '처리 중...' : '거절'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
