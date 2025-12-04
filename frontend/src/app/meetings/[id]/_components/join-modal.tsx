'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingsApi, JoinQuestion } from '@/lib/api/meetings';
import { Button } from '@/components/ui/button';

// ================================
// Types
// ================================

interface JoinModalProps {
  meetingId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ================================
// Component
// ================================

export function JoinModal({ meetingId, isOpen, onClose, onSuccess }: JoinModalProps) {
  const queryClient = useQueryClient();
  const [introduction, setIntroduction] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // ================================
  // Queries
  // ================================

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['join-questions', meetingId],
    queryFn: () => meetingsApi.getJoinQuestions(meetingId),
    enabled: isOpen,
  });

  // ================================
  // Mutations
  // ================================

  const applyMutation = useMutation({
    mutationFn: () =>
      meetingsApi.applyMeeting(meetingId, {
        introduction: introduction || undefined,
        answers: Object.entries(answers)
          .filter(([, value]) => value.trim())
          .map(([questionId, answer]) => ({ questionId, answer })),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      alert(data.message);
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '가입 신청에 실패했습니다');
    },
  });

  // ================================
  // Handlers
  // ================================

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 필수 질문 확인
    const requiredQuestions = questions.filter((q) => q.isRequired);
    const missingAnswers = requiredQuestions.filter(
      (q) => !answers[q.id] || !answers[q.id].trim()
    );

    if (missingAnswers.length > 0) {
      alert('필수 질문에 모두 답변해주세요');
      return;
    }

    applyMutation.mutate();
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // ================================
  // Render
  // ================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6">
        <h3 className="mb-4 text-xl font-semibold">모임 가입 신청</h3>

        {isLoading ? (
          <p className="text-gray-500">로딩 중...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* 자기소개 */}
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">자기소개 (선택)</label>
              <textarea
                value={introduction}
                onChange={(e) => setIntroduction(e.target.value)}
                placeholder="간단한 자기소개를 작성해주세요"
                className="w-full rounded-lg border border-gray-300 p-3"
                rows={3}
                maxLength={500}
              />
            </div>

            {/* 가입 질문 */}
            {questions.length > 0 && (
              <div className="mb-4 space-y-4">
                <p className="text-sm font-medium text-gray-700">가입 질문</p>
                {questions.map((question) => (
                  <div key={question.id}>
                    <label className="mb-1 block text-sm">
                      {question.question}
                      {question.isRequired && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                    </label>
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="답변을 입력하세요"
                      className="w-full rounded-lg border border-gray-300 p-3"
                      rows={2}
                      maxLength={1000}
                      required={question.isRequired}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                취소
              </Button>
              <Button type="submit" disabled={applyMutation.isPending}>
                {applyMutation.isPending ? '신청 중...' : '가입 신청'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
