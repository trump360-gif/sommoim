'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingsApi } from '@/lib/api/meetings';
import { uploadFile } from '@/lib/api/upload';
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

export default function EditMeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'SPORTS' as Category,
    location: '',
    maxParticipants: 10,
    autoApprove: false,
    imageUrl: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const { data: meeting, isLoading } = useQuery({
    queryKey: ['meeting', id],
    queryFn: () => meetingsApi.getOne(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (meeting) {
      setFormData({
        title: meeting.title,
        description: meeting.description,
        category: meeting.category,
        location: meeting.location,
        maxParticipants: meeting.maxParticipants,
        autoApprove: meeting.autoApprove,
        imageUrl: meeting.imageUrl || '',
      });
      if (meeting.imageUrl) {
        setImagePreview(meeting.imageUrl);
      }
    }
  }, [meeting]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => meetingsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      router.push(`/meetings/${id}`);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : '수정에 실패했습니다');
    },
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다');
      return;
    }

    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    setError('');

    try {
      const url = await uploadFile(file, 'meeting');
      setFormData((p) => ({ ...p, imageUrl: url }));
    } catch {
      setError('이미지 업로드에 실패했습니다');
      setImagePreview(formData.imageUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-gray-500">로딩 중...</div>;
  }

  if (!meeting) {
    return <div className="flex min-h-[50vh] items-center justify-center text-gray-500">모임을 찾을 수 없습니다</div>;
  }

  if (meeting.host?.id !== user?.id) {
    return <div className="flex min-h-[50vh] items-center justify-center text-gray-500">수정 권한이 없습니다</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">모임 수정</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">모임 이미지</h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div
                className="relative h-48 w-full cursor-pointer overflow-hidden rounded-lg bg-gray-100"
                onClick={() => document.getElementById('image-input')?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                    클릭하여 이미지 추가
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                    업로드 중...
                  </div>
                )}
              </div>
              <input id="image-input" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">기본 정보</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">모임 이름 *</label>
              <Input name="title" value={formData.title} onChange={handleChange} required minLength={2} className="mt-1" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">모임 설명 *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                minLength={10}
                rows={5}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">카테고리 *</label>
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
              <label className="block text-sm font-medium text-gray-700">지역 *</label>
              <Input name="location" value={formData.location} onChange={handleChange} required className="mt-1" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">최대 인원 *</label>
                <Input name="maxParticipants" type="number" value={formData.maxParticipants} onChange={handleChange} min={2} max={100} className="mt-1" />
              </div>
              <div className="flex items-center pt-6">
                <input
                  name="autoApprove"
                  type="checkbox"
                  checked={formData.autoApprove}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label className="ml-2 text-sm text-gray-700">자동 승인</label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
            취소
          </Button>
          <Button type="submit" disabled={updateMutation.isPending || uploading} className="flex-1">
            {updateMutation.isPending ? '저장 중...' : '저장'}
          </Button>
        </div>
      </form>
    </div>
  );
}
