'use client';

// ================================
// Imports & Dependencies
// ================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  meetingsApi,
  MeetingStaff,
  StaffRole,
  StaffPermission,
  AddStaffDto,
  UpdateStaffDto,
} from '@/lib/api/meetings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Crown,
  Shield,
  Users,
  UserPlus,
  X,
  Check,
  Settings,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ================================
// Types & Interfaces
// ================================

interface StaffManagementProps {
  meetingId: string;
  participants: Array<{
    user: {
      id: string;
      nickname: string;
      profile?: { avatarUrl?: string };
    };
    status: string;
  }>;
}

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: AddStaffDto) => void;
  participants: StaffManagementProps['participants'];
  existingStaffIds: string[];
  isLoading: boolean;
}

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: MeetingStaff | null;
  onUpdate: (data: UpdateStaffDto) => void;
  onRemove: () => void;
  isLoading: boolean;
}

// ================================
// Constants
// ================================

const ROLE_INFO: Record<StaffRole, { label: string; icon: typeof Crown; color: string; description: string }> = {
  CO_HOST: {
    label: '공동운영자',
    icon: Crown,
    color: 'text-amber-600 bg-amber-100',
    description: '모임장과 거의 동일한 권한 (멤버/이벤트/채팅 관리)',
  },
  MANAGER: {
    label: '매니저',
    icon: Shield,
    color: 'text-blue-600 bg-blue-100',
    description: '이벤트/일정/활동 관리 및 통계 조회',
  },
  STAFF: {
    label: '스태프',
    icon: Users,
    color: 'text-green-600 bg-green-100',
    description: '활동 기록 관리 및 통계 조회',
  },
};

const PERMISSION_INFO: Record<StaffPermission, { label: string; description: string }> = {
  MANAGE_EVENTS: { label: '이벤트 관리', description: '정모/번개 생성, 수정, 삭제' },
  MANAGE_SCHEDULES: { label: '일정 관리', description: '모임 일정 관리' },
  MANAGE_ACTIVITIES: { label: '활동 관리', description: '활동 기록, 갤러리 관리' },
  MANAGE_MEMBERS: { label: '멤버 관리', description: '가입 승인/거절, 멤버 관리' },
  MANAGE_CHAT: { label: '채팅 관리', description: '채팅 메시지 삭제, 뮤트' },
  VIEW_STATS: { label: '통계 조회', description: '모임 통계 및 분석 조회' },
};

const ALL_PERMISSIONS: StaffPermission[] = [
  'MANAGE_EVENTS',
  'MANAGE_SCHEDULES',
  'MANAGE_ACTIVITIES',
  'MANAGE_MEMBERS',
  'MANAGE_CHAT',
  'VIEW_STATS',
];

// ================================
// Helper Functions
// ================================

function getDefaultPermissions(role: StaffRole): StaffPermission[] {
  switch (role) {
    case 'CO_HOST':
      return [...ALL_PERMISSIONS];
    case 'MANAGER':
      return ['MANAGE_EVENTS', 'MANAGE_SCHEDULES', 'MANAGE_ACTIVITIES', 'VIEW_STATS'];
    case 'STAFF':
      return ['MANAGE_ACTIVITIES', 'VIEW_STATS'];
    default:
      return [];
  }
}

// ================================
// Sub Components
// ================================

function AddStaffModal({
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
                    {selectedRole === role && (
                      <Check className="h-5 w-5 text-primary-600 mt-1" />
                    )}
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
                    <label
                      key={perm}
                      className="flex items-center gap-3 cursor-pointer"
                    >
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

function EditStaffModal({
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
                    {selectedRole === role && (
                      <Check className="h-5 w-5 text-primary-600 mt-1" />
                    )}
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
                    <label
                      key={perm}
                      className="flex items-center gap-3 cursor-pointer"
                    >
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

function StaffCard({
  staff,
  onEdit,
}: {
  staff: MeetingStaff;
  onEdit: (staff: MeetingStaff) => void;
}) {
  const roleInfo = ROLE_INFO[staff.role];
  const Icon = roleInfo.icon;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-all">
      <div className="h-12 w-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
        {staff.user?.profile?.avatarUrl ? (
          <img src={staff.user.profile.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-lg font-medium text-gray-400">
            {staff.user?.nickname?.charAt(0) || '?'}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{staff.user?.nickname || '알 수 없음'}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
            <Icon className="h-3 w-3" />
            {roleInfo.label}
          </span>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={() => onEdit(staff)} className="rounded-lg">
        수정
      </Button>
    </div>
  );
}

// ================================
// Main Component
// ================================

export function StaffManagement({ meetingId, participants }: StaffManagementProps) {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<MeetingStaff | null>(null);

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['meeting-staff', meetingId],
    queryFn: () => meetingsApi.getStaffList(meetingId),
  });

  const addMutation = useMutation({
    mutationFn: (data: AddStaffDto) => meetingsApi.addStaff(meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-staff', meetingId] });
      setShowAddModal(false);
      toast.success('운영진을 추가했습니다');
    },
    onError: () => toast.error('운영진 추가에 실패했습니다'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateStaffDto) =>
      meetingsApi.updateStaff(meetingId, editingStaff!.userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-staff', meetingId] });
      setEditingStaff(null);
      toast.success('운영진 정보를 수정했습니다');
    },
    onError: () => toast.error('운영진 수정에 실패했습니다'),
  });

  const removeMutation = useMutation({
    mutationFn: () => meetingsApi.removeStaff(meetingId, editingStaff!.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-staff', meetingId] });
      setEditingStaff(null);
      toast.success('운영진에서 제외했습니다');
    },
    onError: () => toast.error('운영진 제외에 실패했습니다'),
  });

  const existingStaffIds = staffList.map((s) => s.userId);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">운영진 관리</h3>
          <p className="text-sm text-gray-500 mt-1">
            모임 운영을 함께 할 멤버를 지정하세요
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="rounded-xl">
          <UserPlus className="h-4 w-4 mr-1.5" />
          운영진 추가
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">아직 운영진이 없습니다</p>
            <p className="text-sm text-gray-400 mt-1">
              운영진을 추가하여 모임 운영을 나눠보세요
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {staffList.map((staff) => (
              <StaffCard
                key={staff.id}
                staff={staff}
                onEdit={(s) => setEditingStaff(s)}
              />
            ))}
          </div>
        )}

        {/* 역할 안내 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">역할 안내</h4>
          <div className="space-y-2">
            {(Object.keys(ROLE_INFO) as StaffRole[]).map((role) => {
              const info = ROLE_INFO[role];
              const Icon = info.icon;
              return (
                <div key={role} className="flex items-center gap-2 text-sm">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${info.color}`}>
                    <Icon className="h-3 w-3" />
                    {info.label}
                  </span>
                  <span className="text-gray-600">{info.description}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>

      <AddStaffModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(data) => addMutation.mutate(data)}
        participants={participants}
        existingStaffIds={existingStaffIds}
        isLoading={addMutation.isPending}
      />

      <EditStaffModal
        isOpen={!!editingStaff}
        onClose={() => setEditingStaff(null)}
        staff={editingStaff}
        onUpdate={(data) => updateMutation.mutate(data)}
        onRemove={() => removeMutation.mutate()}
        isLoading={updateMutation.isPending || removeMutation.isPending}
      />
    </Card>
  );
}
