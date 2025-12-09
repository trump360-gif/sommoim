'use client';

// ================================
// Imports & Dependencies
// ================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  meetingsApi,
  JoinQuestion,
  CreateJoinQuestionDto,
} from '@/lib/api/meetings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  HelpCircle,
  Plus,
  GripVertical,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

// ================================
// Types & Interfaces
// ================================

interface JoinQuestionsManagerProps {
  meetingId: string;
}

// ================================
// Sub Components
// ================================

function QuestionCard({
  question,
  onEdit,
  onDelete,
  isDeleting,
}: {
  question: JoinQuestion;
  onEdit: (q: JoinQuestion) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all group">
      <div className="text-gray-400 cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900">{question.question}</p>
        <div className="flex items-center gap-2 mt-1">
          {question.isRequired ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
              <AlertCircle className="h-3 w-3" />
              필수
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              선택
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(question)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            if (confirm('이 질문을 삭제하시겠습니까?')) {
              onDelete(question.id);
            }
          }}
          disabled={isDeleting}
          className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function QuestionForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: {
  initialData?: JoinQuestion;
  onSubmit: (data: CreateJoinQuestionDto) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [question, setQuestion] = useState(initialData?.question || '');
  const [isRequired, setIsRequired] = useState(initialData?.isRequired ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      toast.error('질문을 입력해주세요');
      return;
    }
    onSubmit({ question: question.trim(), isRequired });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-xl space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          질문 내용
        </label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="예: 어떤 계기로 저희 모임에 관심을 갖게 되셨나요?"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          autoFocus
        />
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-gray-700">필수 질문</span>
        </label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading} className="rounded-xl">
          {isLoading ? '저장 중...' : initialData ? '수정' : '추가'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
          취소
        </Button>
      </div>
    </form>
  );
}

// ================================
// Main Component
// ================================

export function JoinQuestionsManager({ meetingId }: JoinQuestionsManagerProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<JoinQuestion | null>(null);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['join-questions', meetingId],
    queryFn: () => meetingsApi.getJoinQuestions(meetingId),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateJoinQuestionDto) =>
      meetingsApi.createJoinQuestion(meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['join-questions', meetingId] });
      setShowForm(false);
      toast.success('질문이 추가되었습니다');
    },
    onError: () => toast.error('질문 추가에 실패했습니다'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; dto: Partial<CreateJoinQuestionDto> }) =>
      meetingsApi.updateJoinQuestion(data.id, data.dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['join-questions', meetingId] });
      setEditingQuestion(null);
      toast.success('질문이 수정되었습니다');
    },
    onError: () => toast.error('질문 수정에 실패했습니다'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => meetingsApi.deleteJoinQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['join-questions', meetingId] });
      toast.success('질문이 삭제되었습니다');
    },
    onError: () => toast.error('질문 삭제에 실패했습니다'),
  });

  const handleCreate = (data: CreateJoinQuestionDto) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data: CreateJoinQuestionDto) => {
    if (!editingQuestion) return;
    updateMutation.mutate({ id: editingQuestion.id, dto: data });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">가입 질문 관리</h3>
          <p className="text-sm text-gray-500 mt-1">
            신규 회원 가입 시 답변해야 하는 질문을 설정하세요
          </p>
        </div>
        {!showForm && !editingQuestion && (
          <Button onClick={() => setShowForm(true)} className="rounded-xl">
            <Plus className="h-4 w-4 mr-1.5" />
            질문 추가
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Form */}
        {showForm && (
          <QuestionForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            isLoading={createMutation.isPending}
          />
        )}

        {/* Questions List */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : questions.length === 0 && !showForm ? (
          <div className="text-center py-8">
            <HelpCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">등록된 가입 질문이 없습니다</p>
            <p className="text-sm text-gray-400 mt-1">
              질문을 추가하면 가입 신청 시 답변을 받을 수 있습니다
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {questions.map((q) =>
              editingQuestion?.id === q.id ? (
                <QuestionForm
                  key={q.id}
                  initialData={q}
                  onSubmit={handleUpdate}
                  onCancel={() => setEditingQuestion(null)}
                  isLoading={updateMutation.isPending}
                />
              ) : (
                <QuestionCard
                  key={q.id}
                  question={q}
                  onEdit={setEditingQuestion}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  isDeleting={deleteMutation.isPending}
                />
              )
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-blue-50 rounded-xl">
          <div className="flex gap-3">
            <div className="text-blue-600">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">가입 질문 활용 팁</p>
              <ul className="space-y-1 text-blue-700">
                <li>• 필수 질문은 반드시 답변해야 가입 신청이 가능합니다</li>
                <li>• 질문을 통해 모임에 적합한 회원인지 파악할 수 있습니다</li>
                <li>• 너무 많은 질문은 가입률을 낮출 수 있으니 3-5개를 권장합니다</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
