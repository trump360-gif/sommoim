'use client';

// ================================
// Edit Staff Modal Component
// ================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Check, Settings, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

import type { StaffRole, StaffPermission } from './types';
import type { EditStaffModalProps } from './types';
import { ROLE_INFO, PERMISSION_INFO, ALL_PERMISSIONS, getDefaultPermissions } from './constants';

// ================================
// Component
// ================================

export function EditStaffModal({
  isOpen,
  onClose,
  staff,
  onUpdate,
  onRemove,
  isLoading,
}: EditStaffModalProps) {
  const [selectedRole, setSelectedRole] = useState<StaffRole>(staff?.role || 'STAFF');
  const [permissions, setPermissions] = useState<StaffPermission[]>(staff?.permissions || []);
  const [showPermissions, setShowPermissions] = useState(false);

  const handleRoleChange = (role: StaffRole) => {
    setSelectedRole(role);
    setPermissions(getDefaultPermissions(role));
  };

  const togglePermission = (perm: StaffPermission) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleUpdate = () => {
    onUpdate({ role: selectedRole, permissions });
  };

  if (!isOpen || !staff) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg animate-scale-in rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">운영진 수정</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* 역할 선택 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">역할 변경</label>
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
            <Button onClick={handleUpdate} disabled={isLoading} className="flex-1 rounded-xl">
              {isLoading ? '수정 중...' : '변경 저장'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('이 운영진을 해제하시겠습니까?')) {
                  onRemove();
                }
              }}
              disabled={isLoading}
              className="rounded-xl text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
