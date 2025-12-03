'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { uploadFile } from '@/lib/api/upload';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function EditProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({ nickname: '', bio: '', avatarUrl: '' });
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: usersApi.getMe,
    enabled: isAuthenticated,
  });

  const updateMutation = useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      router.push('/mypage');
    },
  });

  useState(() => {
    if (profile) {
      setFormData({
        nickname: profile.nickname || '',
        bio: profile.profile?.bio || '',
        avatarUrl: profile.profile?.avatarUrl || '',
      });
      if (profile.profile?.avatarUrl) {
        setPreviewUrl(profile.profile.avatarUrl);
      }
    }
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다');
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);

    try {
      const url = await uploadFile(file, 'profile');
      setFormData((p) => ({ ...p, avatarUrl: url }));
    } catch {
      alert('업로드에 실패했습니다');
      setPreviewUrl(formData.avatarUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-500">로그인이 필요합니다</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">프로필 수정</h1>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">기본 정보</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div
                className="relative h-24 w-24 cursor-pointer overflow-hidden rounded-full bg-gray-200"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl text-gray-400">
                    {profile?.nickname?.charAt(0) || '?'}
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                    업로드 중...
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-primary-600 hover:underline"
                disabled={uploading}
              >
                프로필 사진 변경
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">이메일</label>
              <Input value={profile?.email || ''} disabled className="bg-gray-50" />
              <p className="mt-1 text-xs text-gray-500">이메일은 변경할 수 없습니다</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">닉네임 *</label>
              <Input
                value={formData.nickname}
                onChange={(e) => setFormData((p) => ({ ...p, nickname: e.target.value }))}
                required
                minLength={2}
                maxLength={20}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">자기소개</label>
              <textarea
                className="w-full rounded-md border border-gray-300 p-3"
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                placeholder="간단한 자기소개를 작성해주세요"
                maxLength={200}
              />
              <p className="mt-1 text-right text-xs text-gray-500">{formData.bio.length}/200</p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={updateMutation.isPending || uploading}>
                {updateMutation.isPending ? '저장 중...' : '저장'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                취소
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
