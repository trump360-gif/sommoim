'use client';

// ================================
// Imports
// ================================
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimpleTabs as Tabs } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  HardDrive,
  Search,
  Upload,
  Trash2,
  Download,
  Image,
  FileText,
  File,
  Film,
  MoreVertical,
  Grid,
  List,
  FolderOpen,
} from 'lucide-react';

// ================================
// Types
// ================================
interface FileItem {
  id: string;
  name: string;
  type: 'image' | 'document' | 'video' | 'other';
  size: number;
  url: string;
  uploadedBy: string;
  createdAt: string;
}

// ================================
// Constants
// ================================
const FILE_TABS = [
  { key: 'all', label: '전체' },
  { key: 'image', label: '이미지' },
  { key: 'document', label: '문서' },
  { key: 'video', label: '동영상' },
  { key: 'other', label: '기타' },
];

// Mock data
const mockFiles: FileItem[] = [
  {
    id: '1',
    name: 'banner-main.jpg',
    type: 'image',
    size: 2456789,
    url: '/uploads/banners/banner-main.jpg',
    uploadedBy: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'meeting-photo-001.png',
    type: 'image',
    size: 1234567,
    url: '/uploads/meetings/photo-001.png',
    uploadedBy: 'user123',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    name: 'terms-of-service.pdf',
    type: 'document',
    size: 567890,
    url: '/uploads/docs/terms.pdf',
    uploadedBy: 'admin',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '4',
    name: 'intro-video.mp4',
    type: 'video',
    size: 45678901,
    url: '/uploads/videos/intro.mp4',
    uploadedBy: 'admin',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: '5',
    name: 'profile-avatar.jpg',
    type: 'image',
    size: 345678,
    url: '/uploads/avatars/user-123.jpg',
    uploadedBy: 'user456',
    createdAt: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: '6',
    name: 'backup-data.zip',
    type: 'other',
    size: 89012345,
    url: '/uploads/backups/backup.zip',
    uploadedBy: 'system',
    createdAt: new Date(Date.now() - 432000000).toISOString(),
  },
];

// ================================
// Helper Functions
// ================================
function getFileIcon(type: string) {
  switch (type) {
    case 'image':
      return <Image className="h-5 w-5 text-blue-500" />;
    case 'document':
      return <FileText className="h-5 w-5 text-orange-500" />;
    case 'video':
      return <Film className="h-5 w-5 text-purple-500" />;
    default:
      return <File className="h-5 w-5 text-gray-500" />;
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ================================
// Component
// ================================
export default function AdminFilesPage() {
  const { user, isAuthenticated } = useAuth();
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
        권한이 없습니다
      </div>
    );
  }

  const filteredFiles = mockFiles.filter((file) => {
    if (typeFilter !== 'all' && file.type !== typeFilter) return false;
    if (searchQuery) {
      return file.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const totalSize = mockFiles.reduce((acc, file) => acc + file.size, 0);

  const handleSelectFile = (id: string) => {
    setSelectedFiles((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    toast.success(`${selectedFiles.length}개 파일이 삭제되었습니다`);
    setSelectedFiles([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HardDrive className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-bold">파일 관리</h1>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          파일 업로드
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-100 p-2">
              <HardDrive className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
              <p className="text-sm text-gray-500">총 사용량</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-100 p-2">
              <Image className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {mockFiles.filter((f) => f.type === 'image').length}
              </p>
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
              <p className="text-2xl font-bold">
                {mockFiles.filter((f) => f.type === 'document').length}
              </p>
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
              <p className="text-2xl font-bold">
                {mockFiles.filter((f) => f.type === 'video').length}
              </p>
              <p className="text-sm text-gray-500">동영상</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          tabs={FILE_TABS}
          activeTab={typeFilter}
          onChange={setTypeFilter}
          variant="pills"
        />
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
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Selected Actions */}
      {selectedFiles.length > 0 && (
        <div className="flex items-center gap-4 rounded-lg bg-blue-50 p-3">
          <span className="text-sm font-medium text-blue-700">
            {selectedFiles.length}개 선택됨
          </span>
          <Button size="sm" variant="outline" onClick={handleDeleteSelected}>
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </Button>
          <Button size="sm" variant="outline">
            <Download className="mr-2 h-4 w-4" />
            다운로드
          </Button>
        </div>
      )}

      {/* File List */}
      {viewMode === 'list' ? (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedFiles.length === filteredFiles.length}
                      onChange={(e) =>
                        setSelectedFiles(
                          e.target.checked
                            ? filteredFiles.map((f) => f.id)
                            : []
                        )
                      }
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="p-3 text-left text-sm font-medium">파일명</th>
                  <th className="p-3 text-left text-sm font-medium">유형</th>
                  <th className="p-3 text-left text-sm font-medium">크기</th>
                  <th className="p-3 text-left text-sm font-medium">
                    업로드 사용자
                  </th>
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
                        {getFileIcon(file.type)}
                        <span className="text-sm font-medium">{file.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm capitalize text-gray-600">
                      {file.type}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {file.uploadedBy}
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {formatDate(file.createdAt)}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
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
      ) : (
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
                  {file.type === 'image' ? (
                    <Image className="h-12 w-12 text-gray-400" />
                  ) : (
                    getFileIcon(file.type)
                  )}
                </div>
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredFiles.length === 0 && (
        <div className="py-12 text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">파일이 없습니다</p>
        </div>
      )}
    </div>
  );
}
