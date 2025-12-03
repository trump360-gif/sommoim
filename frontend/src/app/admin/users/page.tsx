'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api/admin';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Tabs } from '@/components/ui/tabs';
import type { User, PaginatedResponse } from '@/types';

const ROLE_TABS = [
  { key: 'all', label: '전체' },
  { key: 'ADMIN', label: '관리자' },
  { key: 'MODERATOR', label: '운영자' },
  { key: 'USER', label: '일반' },
];

export default function AdminUsersPage() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalType, setModalType] = useState<'role' | 'delete' | null>(null);

  const { data, isLoading } = useQuery<PaginatedResponse<User>>({
    queryKey: ['admin-users', page, search],
    queryFn: () => adminApi.getUsers(page, 20, search || undefined),
    enabled: isAuthenticated && user?.role === 'ADMIN',
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => adminApi.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      closeModal();
    },
  });

  const closeModal = () => { setSelectedUser(null); setModalType(null); };

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <div className="flex min-h-[50vh] items-center justify-center text-gray-500">권한이 없습니다</div>;
  }

  const filteredUsers = data?.data?.filter((u) => roleFilter === 'all' || u.role === roleFilter) || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">사용자 관리</h1>

      <div className="mb-4 flex gap-4">
        <Input placeholder="이메일 또는 닉네임 검색" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      <Tabs tabs={ROLE_TABS} activeTab={roleFilter} onChange={setRoleFilter} className="mb-4" />

      {isLoading ? (
        <div className="py-8 text-center text-gray-500">로딩 중...</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-sm font-medium">닉네임</th>
                  <th className="p-3 text-left text-sm font-medium">이메일</th>
                  <th className="p-3 text-left text-sm font-medium">권한</th>
                  <th className="p-3 text-left text-sm font-medium">가입일</th>
                  <th className="p-3 text-left text-sm font-medium">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{u.nickname}</td>
                    <td className="p-3 text-sm text-gray-600">{u.email}</td>
                    <td className="p-3"><RoleBadge role={u.role} /></td>
                    <td className="p-3 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString('ko-KR')}</td>
                    <td className="flex gap-2 p-3">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedUser(u); setModalType('role'); }}>권한</Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => { setSelectedUser(u); setModalType('delete'); }}>삭제</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: data.meta.totalPages }, (_, i) => (
            <Button key={i} size="sm" variant={page === i + 1 ? 'primary' : 'outline'} onClick={() => setPage(i + 1)}>{i + 1}</Button>
          ))}
        </div>
      )}

      <Modal isOpen={modalType === 'role' && !!selectedUser} onClose={closeModal} title="권한 변경">
        <div className="space-y-4">
          <p>{selectedUser?.nickname}의 권한을 변경합니다</p>
          <div className="flex gap-2">
            {['USER', 'MODERATOR', 'ADMIN'].map((role) => (
              <Button key={role} variant={selectedUser?.role === role ? 'primary' : 'outline'}
                onClick={() => selectedUser && updateRoleMutation.mutate({ id: selectedUser.id, role })}>
                {role === 'USER' ? '일반' : role === 'MODERATOR' ? '운영자' : '관리자'}
              </Button>
            ))}
          </div>
        </div>
      </Modal>

      <Modal isOpen={modalType === 'delete' && !!selectedUser} onClose={closeModal} title="사용자 삭제">
        <div className="space-y-4">
          <p>{selectedUser?.nickname}을(를) 삭제하시겠습니까?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeModal}>취소</Button>
            <Button className="bg-red-600" onClick={() => selectedUser && deleteMutation.mutate(selectedUser.id)}>삭제</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors = { ADMIN: 'bg-red-100 text-red-700', MODERATOR: 'bg-yellow-100 text-yellow-700', USER: 'bg-gray-100 text-gray-700' };
  const labels = { ADMIN: '관리자', MODERATOR: '운영자', USER: '일반' };
  return <span className={`rounded-full px-2 py-1 text-xs ${colors[role as keyof typeof colors]}`}>{labels[role as keyof typeof labels]}</span>;
}
