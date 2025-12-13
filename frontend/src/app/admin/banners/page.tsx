'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, Banner } from '@/lib/api/admin';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/ui/image-upload';

export default function AdminBannersPage() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    imageUrl: '',
    linkUrl: '',
    title: '',
    subtitle: '',
    backgroundColor: '',
    order: 0,
    isActive: true,
    startDate: '',
    endDate: '',
  });

  const { data: banners, isLoading } = useQuery<Banner[]>({
    queryKey: ['admin-banners'],
    queryFn: adminApi.getBanners,
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  const invalidateBannerQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
    queryClient.invalidateQueries({ queryKey: ['public', 'banners'] });
  };

  const createMutation = useMutation({
    mutationFn: adminApi.createBanner,
    onSuccess: () => {
      invalidateBannerQueries();
      setIsCreating(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Banner> }) => adminApi.updateBanner(id, data),
    onSuccess: () => {
      invalidateBannerQueries();
      setEditingId(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteBanner,
    onSuccess: () => invalidateBannerQueries(),
  });

  const resetForm = () => setFormData({
    imageUrl: '',
    linkUrl: '',
    title: '',
    subtitle: '',
    backgroundColor: '',
    order: 0,
    isActive: true,
    startDate: '',
    endDate: ''
  });

  const buildBannerData = (isUpdate = false): Omit<Banner, 'id' | 'clickCount' | 'createdAt' | 'updatedAt'> => ({
    order: formData.order,
    isActive: formData.isActive,
    // 수정 시 이미지가 비어있으면 빈 문자열로 보내서 명시적으로 삭제
    imageUrl: formData.imageUrl || (isUpdate ? '' : undefined),
    linkUrl: formData.linkUrl || undefined,
    title: formData.title || undefined,
    subtitle: formData.subtitle || undefined,
    backgroundColor: formData.backgroundColor || undefined,
    startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
    endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
  });

  const handleCreate = () => {
    createMutation.mutate(buildBannerData());
  };

  const handleUpdate = (id: string) => {
    updateMutation.mutate({ id, data: buildBannerData(true) });
  };

  const startEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setFormData({
      imageUrl: banner.imageUrl || '',
      linkUrl: banner.linkUrl || '',
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      backgroundColor: banner.backgroundColor || '',
      order: banner.order,
      isActive: banner.isActive,
      startDate: banner.startDate ? banner.startDate.split('T')[0] : '',
      endDate: banner.endDate ? banner.endDate.split('T')[0] : '',
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR');
  };

  const isExpired = (banner: Banner) => {
    if (!banner.endDate) return false;
    return new Date(banner.endDate) < new Date();
  };

  const isNotStarted = (banner: Banner) => {
    if (!banner.startDate) return false;
    return new Date(banner.startDate) > new Date();
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <div className="flex min-h-[50vh] items-center justify-center text-gray-500">관리자 권한이 필요합니다</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">배너 관리</h1>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
          새 배너 추가
        </Button>
      </div>

      {isCreating && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold">새 배너</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">배너 이미지 *</label>
              <ImageUpload
                value={formData.imageUrl}
                onChange={(url) => setFormData((p) => ({ ...p, imageUrl: url }))}
                onRemove={() => setFormData((p) => ({ ...p, imageUrl: '' }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">배너 제목</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder="배너 제목 (선택)"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">배너 부제목</label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) => setFormData((p) => ({ ...p, subtitle: e.target.value }))}
                  placeholder="배너 부제목 (선택)"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">배경색 (이미지가 없을 때)</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.backgroundColor || '#3B82F6'}
                  onChange={(e) => setFormData((p) => ({ ...p, backgroundColor: e.target.value }))}
                  className="h-10 w-20"
                />
                <Input
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData((p) => ({ ...p, backgroundColor: e.target.value }))}
                  placeholder="#3B82F6 또는 blue"
                  className="flex-1"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">이미지가 없을 때 배경색으로 표시됩니다</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">링크 URL</label>
              <Input
                value={formData.linkUrl}
                onChange={(e) => setFormData((p) => ({ ...p, linkUrl: e.target.value }))}
                placeholder="https://example.com/page"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">시작일</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">종료일</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">순서</label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData((p) => ({ ...p, order: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
              />
              <label htmlFor="isActive" className="text-sm">활성화</label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending || (!formData.imageUrl && !formData.backgroundColor)}>
                {createMutation.isPending ? '저장 중...' : '저장'}
              </Button>
              <Button variant="outline" onClick={() => { setIsCreating(false); resetForm(); }}>
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="py-8 text-center text-gray-500">로딩 중...</div>
      ) : !banners?.length ? (
        <div className="py-8 text-center text-gray-500">등록된 배너가 없습니다</div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner) => (
            <Card key={banner.id} className={!banner.isActive || isExpired(banner) ? 'opacity-50' : ''}>
              <CardContent className="py-4">
                {editingId === banner.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium">배너 이미지 *</label>
                      <ImageUpload
                        value={formData.imageUrl}
                        onChange={(url) => setFormData((p) => ({ ...p, imageUrl: url }))}
                        onRemove={() => setFormData((p) => ({ ...p, imageUrl: '' }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium">배너 제목</label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                          placeholder="배너 제목 (선택)"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">배너 부제목</label>
                        <Input
                          value={formData.subtitle}
                          onChange={(e) => setFormData((p) => ({ ...p, subtitle: e.target.value }))}
                          placeholder="배너 부제목 (선택)"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">배경색 (이미지가 없을 때)</label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={formData.backgroundColor || '#3B82F6'}
                          onChange={(e) => setFormData((p) => ({ ...p, backgroundColor: e.target.value }))}
                          className="h-10 w-20"
                        />
                        <Input
                          value={formData.backgroundColor}
                          onChange={(e) => setFormData((p) => ({ ...p, backgroundColor: e.target.value }))}
                          placeholder="#3B82F6 또는 blue"
                          className="flex-1"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">이미지가 없을 때 배경색으로 표시됩니다</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">링크 URL</label>
                      <Input
                        value={formData.linkUrl}
                        onChange={(e) => setFormData((p) => ({ ...p, linkUrl: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium">시작일</label>
                        <Input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">종료일</label>
                        <Input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                        />
                        <span className="text-sm">활성화</span>
                      </label>
                      <Button size="sm" onClick={() => handleUpdate(banner.id)} disabled={updateMutation.isPending}>
                        저장
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <img
                      src={banner.imageUrl}
                      alt="Banner"
                      className="h-20 w-32 rounded object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/128x80?text=No+Image'; }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {!banner.isActive && <span className="rounded bg-gray-200 px-2 py-0.5 text-xs">비활성</span>}
                        {isExpired(banner) && <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-600">만료됨</span>}
                        {isNotStarted(banner) && <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-600">예약</span>}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        노출 기간: {formatDate(banner.startDate)} ~ {formatDate(banner.endDate)}
                      </p>
                      {banner.linkUrl && (
                        <p className="mt-1 truncate text-sm text-blue-600">{banner.linkUrl}</p>
                      )}
                      <p className="mt-1 text-sm text-gray-500">
                        클릭 수: <span className="font-medium">{banner.clickCount.toLocaleString()}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(banner)}>
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (confirm('이 배너를 삭제하시겠습니까?')) {
                            deleteMutation.mutate(banner.id);
                          }
                        }}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
