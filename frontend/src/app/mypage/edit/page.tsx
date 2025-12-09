'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { uploadFile } from '@/lib/api/upload';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Dumbbell,
  Gamepad2,
  UtensilsCrossed,
  Theater,
  Plane,
  GraduationCap,
  Check,
} from 'lucide-react';

// ================================
// Constants
// ================================

const CATEGORIES = [
  { value: 'SPORTS', label: '스포츠', icon: Dumbbell, color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'GAMES', label: '게임', icon: Gamepad2, color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { value: 'FOOD', label: '음식', icon: UtensilsCrossed, color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { value: 'CULTURE', label: '문화', icon: Theater, color: 'bg-pink-100 text-pink-700 border-pink-300' },
  { value: 'TRAVEL', label: '여행', icon: Plane, color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'STUDY', label: '스터디', icon: GraduationCap, color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
];

export default function EditProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({ nickname: '', bio: '', avatarUrl: '', interests: [] as string[] });
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

  useEffect(() => {
    if (profile) {
      setFormData({
        nickname: profile.nickname || '',
        bio: profile.profile?.bio || '',
        avatarUrl: profile.profile?.avatarUrl || '',
        interests: (profile.profile as any)?.interests || [],
      });
      if (profile.profile?.avatarUrl) {
        setPreviewUrl(profile.profile.avatarUrl);
      }
    }
  }, [profile]);

  const toggleInterest = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(category)
        ? prev.interests.filter((i) => i !== category)
        : [...prev.interests, category],
    }));
  };

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

            {/* 관심사 선택 */}
            <div>
              <label className="mb-3 block text-sm font-medium">관심사</label>
              <p className="text-xs text-gray-500 mb-3">관심 있는 모임 카테고리를 선택하세요 (추천 모임에 활용됩니다)</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = formData.interests.includes(cat.value);
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => toggleInterest(cat.value)}
                      className={`relative flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 transition-all ${
                        isSelected
                          ? `${cat.color} border-current`
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{cat.label}</span>
                      {isSelected && (
                        <Check className="absolute right-2 h-4 w-4" />
                      )}
                    </button>
                  );
                })}
              </div>
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
