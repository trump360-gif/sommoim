'use client';

// ================================
// Imports
// ================================
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowUpDown, ArrowUp, ArrowDown, Search
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { SimpleTabs as Tabs } from '@/components/ui/tabs';
import type { User, PaginatedResponse } from '@/types';

// ================================
// Types & Interfaces
// ================================
type SortField = 'nickname' | 'email' | 'role' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  order: SortOrder;
}

// ================================
// Constants
// ================================
const ROLE_TABS = [
  { key: 'all', label: '전체' },
  { key: 'ADMIN', label: '관리자' },
  { key: 'MODERATOR', label: '운영자' },
  { key: 'USER', label: '일반' },
];

const ROLE_ORDER = { ADMIN: 0, MODERATOR: 1, USER: 2 };

// ================================
// Sub Components
// ================================
function SortableHeader({
  label,
  field,
  sortConfig,
  onSort,
}: {
  label: string;
  field: SortField;
  sortConfig: SortConfig;
  onSort: (field: SortField) => void;
}) {
  const isActive = sortConfig.field === field;

  return (
    <th
      className="cursor-pointer p-3 text-left text-sm font-medium hover:bg-gray-100 select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          sortConfig.order === 'asc' ? (
            <ArrowUp className="h-4 w-4 text-primary-600" />
          ) : (
            <ArrowDown className="h-4 w-4 text-primary-600" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 text-gray-400" />
        )}
      </div>
    </th>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors = {
    ADMIN: 'bg-red-100 text-red-700',
    MODERATOR: 'bg-yellow-100 text-yellow-700',
    USER: 'bg-gray-100 text-gray-700',
  };
  const labels = { ADMIN: '관리자', MODERATOR: '운영자', USER: '일반' };
  return (
    <span className={`rounded-full px-2 py-1 text-xs ${colors[role as keyof typeof colors]}`}>
      {labels[role as keyof typeof labels]}
    </span>
  );
}

// ================================
// Main Component
// ================================
export default function AdminUsersPage() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // ================================
  // State
  // ================================
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalType, setModalType] = useState<'role' | 'delete' | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'createdAt',
    order: 'desc',
  });

  // ================================
  // Queries & Mutations
  // ================================
  const { data, isLoading } = useQuery<PaginatedResponse<User>>({
    queryKey: ['admin-users', page, search],
    queryFn: () => adminApi.getUsers(page, 20, search || undefined),
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      adminApi.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('권한이 변경되었습니다');
      closeModal();
    },
    onError: () => {
      toast.error('권한 변경에 실패했습니다');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('사용자가 삭제되었습니다');
      closeModal();
    },
    onError: () => {
      toast.error('사용자 삭제에 실패했습니다');
    },
  });

  // ================================
  // Handlers
  // ================================
  const closeModal = () => {
    setSelectedUser(null);
    setModalType(null);
  };

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  // ================================
  // Computed Values
  // ================================
  const filteredAndSortedUsers = useMemo(() => {
    let users = data?.data?.filter(
      (u) => roleFilter === 'all' || u.role === roleFilter
    ) || [];

    users = [...users].sort((a, b) => {
      const { field, order } = sortConfig;
      let comparison = 0;

      switch (field) {
        case 'nickname':
          comparison = a.nickname.localeCompare(b.nickname, 'ko');
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'role':
          comparison =
            (ROLE_ORDER[a.role as keyof typeof ROLE_ORDER] || 99) -
            (ROLE_ORDER[b.role as keyof typeof ROLE_ORDER] || 99);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return order === 'asc' ? comparison : -comparison;
    });

    return users;
  }, [data?.data, roleFilter, sortConfig]);

  // ================================
  // Auth Check
  // ================================
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
        권한이 없습니다
      </div>
    );
  }

  // ================================
  // Render
  // ================================
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">사용자 관리</h1>

      {/* Search Bar */}
      <div className="mb-4 flex gap-4">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="이메일 또는 닉네임 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Role Filter Tabs */}
      <Tabs
        tabs={ROLE_TABS}
        activeTab={roleFilter}
        onChange={setRoleFilter}
        className="mb-4"
      />

      {/* Users Table */}
      {isLoading ? (
        <div className="py-8 text-center text-gray-500">로딩 중...</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <SortableHeader
                    label="닉네임"
                    field="nickname"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="이메일"
                    field="email"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="권한"
                    field="role"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="가입일"
                    field="createdAt"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <th className="p-3 text-left text-sm font-medium">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      사용자가 없습니다
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedUsers.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{u.nickname}</td>
                      <td className="p-3 text-sm text-gray-600">{u.email}</td>
                      <td className="p-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="p-3 text-sm text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="flex gap-2 p-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(u);
                            setModalType('role');
                          }}
                        >
                          권한
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setSelectedUser(u);
                            setModalType('delete');
                          }}
                        >
                          삭제
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {data?.meta && data.meta.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: Math.min(data.meta.totalPages, 10) }, (_, i) => (
            <Button
              key={i}
              size="sm"
              variant={page === i + 1 ? 'primary' : 'outline'}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}

      {/* Role Change Modal */}
      <Modal
        isOpen={modalType === 'role' && !!selectedUser}
        onClose={closeModal}
        title="권한 변경"
      >
        <div className="space-y-4">
          <p>{selectedUser?.nickname}의 권한을 변경합니다</p>
          <div className="flex gap-2">
            {['USER', 'MODERATOR', 'ADMIN'].map((role) => (
              <Button
                key={role}
                variant={selectedUser?.role === role ? 'primary' : 'outline'}
                onClick={() =>
                  selectedUser &&
                  updateRoleMutation.mutate({ id: selectedUser.id, role })
                }
              >
                {role === 'USER' ? '일반' : role === 'MODERATOR' ? '운영자' : '관리자'}
              </Button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={modalType === 'delete' && !!selectedUser}
        onClose={closeModal}
        title="사용자 삭제"
      >
        <div className="space-y-4">
          <p>{selectedUser?.nickname}을(를) 삭제하시겠습니까?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeModal}>
              취소
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() =>
                selectedUser && deleteMutation.mutate(selectedUser.id)
              }
            >
              삭제
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
