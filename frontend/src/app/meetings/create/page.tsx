'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { meetingsApi, CreateMeetingDto } from '@/lib/api/meetings';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Category } from '@/types';

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'SPORTS', label: '운동' },
  { value: 'GAMES', label: '게임' },
  { value: 'FOOD', label: '음식' },
  { value: 'CULTURE', label: '문화' },
  { value: 'TRAVEL', label: '여행' },
  { value: 'STUDY', label: '학습' },
];

interface ScheduleInput {
  startTime: string;
  endTime: string;
  location: string;
  note: string;
}

export default function CreateMeetingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'SPORTS' as Category,
    location: '',
    maxParticipants: 10,
    autoApprove: false,
  });

  const [schedules, setSchedules] = useState<ScheduleInput[]>([
    { startTime: '', endTime: '', location: '', note: '' },
  ]);

  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: CreateMeetingDto) => meetingsApi.create(data),
    onSuccess: (meeting) => {
      router.push(`/meetings/${meeting.id}`);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : '모임 생성에 실패했습니다');
    },
  });

  // 인증 체크
  if (!authLoading && !isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const handleScheduleChange = (index: number, field: keyof ScheduleInput, value: string) => {
    setSchedules((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addSchedule = () => {
    setSchedules((prev) => [...prev, { startTime: '', endTime: '', location: '', note: '' }]);
  };

  const removeSchedule = (index: number) => {
    if (schedules.length > 1) {
      setSchedules((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (formData.title.length < 2) {
      setError('제목은 2자 이상이어야 합니다');
      return;
    }
    if (formData.description.length < 10) {
      setError('설명은 10자 이상이어야 합니다');
      return;
    }

    const validSchedules = schedules
      .filter((s) => s.startTime && s.endTime)
      .map((s) => ({
        startTime: new Date(s.startTime).toISOString(),
        endTime: new Date(s.endTime).toISOString(),
        location: s.location || undefined,
        note: s.note || undefined,
      }));

    createMutation.mutate({
      ...formData,
      schedules: validSchedules.length > 0 ? validSchedules : undefined,
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">새 모임 만들기</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">기본 정보</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                모임 이름 *
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="모임 이름을 입력하세요"
                required
                minLength={2}
                maxLength={100}
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                모임 설명 *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="모임에 대해 자세히 설명해주세요 (최소 10자)"
                required
                minLength={10}
                maxLength={2000}
                rows={5}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리 *
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, category: cat.value }))}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      formData.category === cat.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                지역 *
              </label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="예: 서울 강남구"
                required
                maxLength={200}
                className="mt-1"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700">
                  최대 인원 *
                </label>
                <Input
                  id="maxParticipants"
                  name="maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  min={2}
                  max={100}
                  required
                  className="mt-1"
                />
              </div>

              <div className="flex items-center pt-6">
                <input
                  id="autoApprove"
                  name="autoApprove"
                  type="checkbox"
                  checked={formData.autoApprove}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600"
                />
                <label htmlFor="autoApprove" className="ml-2 text-sm text-gray-700">
                  자동 승인 (신청 시 바로 참가)
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-xl font-semibold">일정</h2>
            <Button type="button" variant="outline" size="sm" onClick={addSchedule}>
              일정 추가
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {schedules.map((schedule, index) => (
              <div key={index} className="relative rounded-lg border border-gray-200 p-4">
                {schedules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSchedule(index)}
                    className="absolute right-2 top-2 text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">시작 시간</label>
                    <Input
                      type="datetime-local"
                      value={schedule.startTime}
                      onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">종료 시간</label>
                    <Input
                      type="datetime-local"
                      value={schedule.endTime}
                      onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">장소</label>
                    <Input
                      value={schedule.location}
                      onChange={(e) => handleScheduleChange(index, 'location', e.target.value)}
                      placeholder="상세 장소"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">메모</label>
                    <Input
                      value={schedule.note}
                      onChange={(e) => handleScheduleChange(index, 'note', e.target.value)}
                      placeholder="추가 안내사항"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1"
          >
            {createMutation.isPending ? '생성 중...' : '모임 만들기'}
          </Button>
        </div>
      </form>
    </div>
  );
}
