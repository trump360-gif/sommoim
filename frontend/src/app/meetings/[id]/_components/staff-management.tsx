'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingsApi, MeetingStaff, StaffRole, StaffPermission } from '@/lib/api/meetings';
import { Button } from '@/components/ui/button';

// ================================
// Types
// ================================

interface StaffManagementProps {
  meetingId: string;
  isHost: boolean;
  members: { id: string; name: string; profileImage?: string }[];
}

const STAFF_ROLES: { value: StaffRole; label: string; description: string }[] = [
  { value: 'CO_HOST', label: '공동 모임장', description: '모든 권한 보유' },
  { value: 'MANAGER', label: '매니저', description: '이벤트/일정/활동 관리' },
  { value: 'STAFF', label: '스태프', description: '활동 관리 및 통계 열람' },
];

const PERMISSIONS: { value: StaffPermission; label: string }[] = [
  { value: 'MANAGE_EVENTS', label: '이벤트 관리' },
  { value: 'MANAGE_SCHEDULES', label: '일정 관리' },
  { value: 'MANAGE_ACTIVITIES', label: '활동 관리' },
  { value: 'MANAGE_MEMBERS', label: '멤버 관리' },
  { value: 'MANAGE_CHAT', label: '채팅 관리' },
  { value: 'VIEW_STATS', label: '통계 열람' },
];

// ================================
// Component
// ================================

export function StaffManagement({ meetingId, isHost, members }: StaffManagementProps) {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<StaffRole>('STAFF');
  const [selectedPermissions, setSelectedPermissions] = useState<StaffPermission[]>([]);

  // ================================
  // Queries
  // ================================

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['meeting-staff', meetingId],
    queryFn: () => meetingsApi.getStaffList(meetingId),
  });

  // ================================
  // Mutations
  // ================================

  const addStaffMutation = useMutation({
    mutationFn: (data: { userId: string; role: StaffRole; permissions?: StaffPermission[] }) =>
      meetingsApi.addStaff(meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-staff', meetingId] });
      setIsAddModalOpen(false);
      resetForm();
    },
  });

  const removeStaffMutation = useMutation({
    mutationFn: (staffUserId: string) => meetingsApi.removeStaff(meetingId, staffUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-staff', meetingId] });
    },
  });

  // ================================
  // Handlers
  // ================================

  const resetForm = () => {
    setSelectedUserId('');
    setSelectedRole('STAFF');
    setSelectedPermissions([]);
  };

  const handleAddStaff = () => {
    if (!selectedUserId) return;
    addStaffMutation.mutate({
      userId: selectedUserId,
      role: selectedRole,
      permissions: selectedPermissions.length > 0 ? selectedPermissions : undefined,
    });
  };

  const togglePermission = (permission: StaffPermission) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const getRoleLabel = (role: StaffRole) => {
    return STAFF_ROLES.find((r) => r.value === role)?.label || role;
  };

  // 이미 운영진인 멤버 필터링
  const availableMembers = members.filter(
    (m) => !staffList.some((s) => s.userId === m.id)
  );

  // ================================
  // Render
  // ================================

  if (!isHost) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-4 text-lg font-semibold">운영진</h3>
        {staffList.length === 0 ? (
          <p className="text-sm text-gray-500">등록된 운영진이 없습니다</p>
        ) : (
          <ul className="space-y-2">
            {staffList.map((staff) => (
              <li key={staff.id} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-200" />
                <div>
                  <p className="text-sm font-medium">{staff.user?.name || '알 수 없음'}</p>
                  <p className="text-xs text-gray-500">{getRoleLabel(staff.role)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">운영진 관리</h3>
        <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
          운영진 추가
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">로딩 중...</p>
      ) : staffList.length === 0 ? (
        <p className="text-sm text-gray-500">등록된 운영진이 없습니다</p>
      ) : (
        <ul className="space-y-3">
          {staffList.map((staff) => (
            <li
              key={staff.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div>
                  <p className="font-medium">{staff.user?.name || '알 수 없음'}</p>
                  <p className="text-sm text-gray-500">{getRoleLabel(staff.role)}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-600"
                onClick={() => removeStaffMutation.mutate(staff.userId)}
                disabled={removeStaffMutation.isPending}
              >
                제외
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h4 className="mb-4 text-lg font-semibold">운영진 추가</h4>

            {/* Member Select */}
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">멤버 선택</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2"
              >
                <option value="">선택하세요</option>
                {availableMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Select */}
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">역할</label>
              <div className="space-y-2">
                {STAFF_ROLES.map((role) => (
                  <label
                    key={role.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                      selectedRole === role.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={selectedRole === role.value}
                      onChange={() => setSelectedRole(role.value)}
                      className="hidden"
                    />
                    <div>
                      <p className="font-medium">{role.label}</p>
                      <p className="text-sm text-gray-500">{role.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Permissions */}
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">
                커스텀 권한 (선택사항)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PERMISSIONS.map((perm) => (
                  <label
                    key={perm.value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(perm.value)}
                      onChange={() => togglePermission(perm.value)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
              >
                취소
              </Button>
              <Button
                onClick={handleAddStaff}
                disabled={!selectedUserId || addStaffMutation.isPending}
              >
                {addStaffMutation.isPending ? '추가 중...' : '추가'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
