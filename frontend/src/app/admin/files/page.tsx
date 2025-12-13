'use client';

// ================================
// Imports
// ================================
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, type UploadedFile, type FileStats } from '@/lib/api/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimpleTabs as Tabs } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  HardDrive,
  Search,
  Trash2,
  Download,
  Image as ImageIcon,
  FileText,
  File,
  Film,
  Grid,
  List,
  FolderOpen,
  Loader2,
} from 'lucide-react';

// ================================
// Constants
// ================================
const FILE_TABS = [
  { key: 'all', label: '전체' },
  { key: 'image', label: '이미지' },
  { key: 'document', label: '문서' },
  { key: 'video', label: '동영상' },
];

// ================================
// Helper Functions
// ================================
function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) {
    return <ImageIcon className="h-5 w-5 text-blue-500" />;
  }
  if (fileType.includes('pdf') || fileType.includes('document')) {
    return <FileText className="h-5 w-5 text-orange-500" />;
  }
  if (fileType.startsWith('video/')) {
    return <Film className="h-5 w-5 text-purple-500" />;
  }
  return <File className="h-5 w-5 text-gray-500" />;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getFileTypeCategory(fileType: string): string {
  if (fileType.startsWith('image/')) return 'image';
  if (fileType.includes('pdf') || fileType.includes('document')) return 'document';
  if (fileType.startsWith('video/')) return 'video';
  return 'other';
}

// ================================
// Component
// ================================
export default function AdminFilesPage() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  // Queries
  const { data: filesData, isLoading: filesLoading } = useQuery({
    queryKey: ['admin-files', page],
    queryFn: () => adminApi.getFiles(page, 50),
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  const { data: statsData } = useQuery({
    queryKey: ['admin-files-stats'],
    queryFn: adminApi.getFileStats,
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-files'] });
      queryClient.invalidateQueries({ queryKey: ['admin-files-stats'] });
      toast.success('파일이 삭제되었습니다');
    },
    onError: () => {
      toast.error('파일 삭제에 실패했습니다');
    },
  });

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
        권한이 없습니다
      </div>
    );
  }

  const files = filesData?.data || [];
  const stats = statsData || { totalSize: 0, totalCount: 0, byType: {}, byEntity: {} };

  // 필터링
  const filteredFiles = files.filter((file) => {
    const category = getFileTypeCategory(file.fileType);
    if (typeFilter !== 'all' && category !== typeFilter) return false;
    if (searchQuery) {
      return file.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const handleSelectFile = (id: string) => {
    setSelectedFiles((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    for (const id of selectedFiles) {
      await deleteMutation.mutateAsync(id);
    }
    setSelectedFiles([]);
  };

  const handleDeleteFile = (id: string) => {
    if (confirm('이 파일을 삭제하시겠습니까?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <HardDrive className="h-6 w-6 text-gray-600" />
        <h1 className="text-2xl font-bold">파일 관리</h1>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-100 p-2">
              <HardDrive className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
              <p className="text-sm text-gray-500">총 사용량</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-100 p-2">
              <ImageIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.byType.image?.count || 0}</p>
              <p className="text-sm text-gray-500">이미지</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-orange-100 p-2">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.byType.application?.count || 0}</p>
              <p className="text-sm text-gray-500">문서</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-purple-100 p-2">
              <Film className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.byType.video?.count || 0}</p>
              <p className="text-sm text-gray-500">동영상</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs tabs={FILE_TABS} activeTab={typeFilter} onChange={setTypeFilter} variant="pills" />
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="파일 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm sm:w-64"
            />
          </div>
          <div className="flex rounded-lg border border-gray-300">
            <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}>
              <List className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}>
              <Grid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Selected Actions */}
      {selectedFiles.length > 0 && (
        <div className="flex items-center gap-4 rounded-lg bg-blue-50 p-3">
          <span className="text-sm font-medium text-blue-700">{selectedFiles.length}개 선택됨</span>
          <Button size="sm" variant="outline" onClick={handleDeleteSelected} disabled={deleteMutation.isPending}>
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </Button>
        </div>
      )}

      {/* Loading */}
      {filesLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* File List */}
      {!filesLoading && viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                      onChange={(e) => setSelectedFiles(e.target.checked ? filteredFiles.map((f) => f.id) : [])}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="p-3 text-left text-sm font-medium">파일명</th>
                  <th className="p-3 text-left text-sm font-medium">유형</th>
                  <th className="p-3 text-left text-sm font-medium">크기</th>
                  <th className="p-3 text-left text-sm font-medium">엔티티</th>
                  <th className="p-3 text-left text-sm font-medium">날짜</th>
                  <th className="p-3 text-left text-sm font-medium">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => handleSelectFile(file.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.fileType)}
                        <span className="max-w-[200px] truncate text-sm font-medium">{file.fileName}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-600">{file.fileType}</td>
                    <td className="p-3 text-sm text-gray-600">{formatFileSize(file.fileSize)}</td>
                    <td className="p-3 text-sm text-gray-600">{file.entityType || '-'}</td>
                    <td className="p-3 text-sm text-gray-500">{formatDate(file.createdAt)}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium hover:bg-gray-100"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteFile(file.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {!filesLoading && viewMode === 'grid' && (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filteredFiles.map((file) => (
            <Card
              key={file.id}
              className={`cursor-pointer transition-shadow hover:shadow-md ${
                selectedFiles.includes(file.id) ? 'ring-2 ring-primary-500' : ''
              }`}
              onClick={() => handleSelectFile(file.id)}
            >
              <CardContent className="p-4">
                <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-gray-100">
                  {file.fileType.startsWith('image/') ? (
                    <img src={file.url} alt={file.fileName} className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    getFileIcon(file.fileType)
                  )}
                </div>
                <p className="truncate text-sm font-medium">{file.fileName}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!filesLoading && filteredFiles.length === 0 && (
        <div className="py-12 text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">파일이 없습니다</p>
        </div>
      )}

      {/* Pagination */}
      {filesData?.meta && filesData.meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
            이전
          </Button>
          <span className="flex items-center px-3 text-sm text-gray-600">
            {page} / {filesData.meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === filesData.meta.totalPages}
            onClick={() => setPage(page + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
