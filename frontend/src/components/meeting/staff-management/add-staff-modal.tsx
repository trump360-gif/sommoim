'use client';

// ================================
// Add Staff Modal Component
// ================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { X, Check, Settings, ChevronDown, ChevronUp } from 'lucide-react';

import type { StaffRole, StaffPermission } from './types';
import type { AddStaffModalProps } from './types';
import { ROLE_INFO, PERMISSION_INFO, ALL_PERMISSIONS, getDefaultPermissions } from './constants';

// ================================
// Component
// ================================

export function AddStaffModal({
  isOpen,
  onClose,
  onAdd,
  participants,
  existingStaffIds,
  isLoading,
}: AddStaffModalProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<StaffRole>('STAFF');
  const [permissions, setPermissions] = useState<StaffPermission[]>(getDefaultPermissions('STAFF'));
  const [showPermissions, setShowPermissions] = useState(false);

  const availableParticipants = participants.filter(
    (p) => p.status === 'APPROVED' && !existingStaffIds.includes(p.user.id)
  );

  const handleRoleChange = (role: StaffRole) => {
    setSelectedRole(role);
    setPermissions(getDefaultPermissions(role));
  };

  const togglePermission = (perm: StaffPermission) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSubmit = () => {
    if (!selectedUserId) {
      toast.error('멤버를 선택해주세요');
      return;
    }
    onAdd({ userId: selectedUserId, role: selectedRole, permissions });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg animate-scale-in rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">운영진 추가</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* 멤버 선택 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">멤버 선택</label>
            {availableParticipants.length === 0 ? (
              <p className="text-sm text-gray-500">추가할 수 있는 멤버가 없습니다</p>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">멤버를 선택하세요</option>
                {availableParticipants.map((p) => (
                  <option key={p.user.id} value={p.user.id}>
                    {p.user.nickname}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 역할 선택 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">역할 선택</label>
            <div className="space-y-2">
              {(Object.keys(ROLE_INFO) as StaffRole[]).map((role) => {
                const info = ROLE_INFO[role];
                const Icon = info.icon;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleChange(role)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      selectedRole === role
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${info.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{info.label}</p>
                      <p className="text-sm text-gray-500">{info.description}</p>
                    </div>
                    {selectedRole === role && <Check className="h-5 w-5 text-primary-600 mt-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 권한 설정 */}
          <div>
            <button
              type="button"
              onClick={() => setShowPermissions(!showPermissions)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
            >
              <Settings className="h-4 w-4" />
              세부 권한 설정
              {showPermissions ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {showPermissions && (
              <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
                {ALL_PERMISSIONS.map((perm) => {
                  const info = PERMISSION_INFO[perm];
                  const isChecked = permissions.includes(perm);
                  return (
                    <label key={perm} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(perm)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <p className="text-sm font-medium">{info.label}</p>
                        <p className="text-xs text-gray-500">{info.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={!selectedUserId || isLoading}
              className="flex-1 rounded-xl"
            >
              {isLoading ? '추가 중...' : '운영진 추가'}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
              취소
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
