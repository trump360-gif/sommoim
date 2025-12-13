'use client';

// ================================
// Staff Management - Main Component
// ================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingsApi } from '@/lib/api/meetings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { Users, UserPlus } from 'lucide-react';

import type { StaffManagementProps, MeetingStaff, AddStaffDto, UpdateStaffDto } from './types';
import { ROLE_INFO } from './constants';
import { StaffCard } from './staff-card';
import { AddStaffModal } from './add-staff-modal';
import { EditStaffModal } from './edit-staff-modal';

// ================================
// Component
// ================================

export function StaffManagement({ meetingId, participants }: StaffManagementProps) {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<MeetingStaff | null>(null);

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

  // ================================
  // Derived State
  // ================================

  const existingStaffIds = staffList.map((s) => s.userId);

  // ================================
  // Render
  // ================================

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">운영진 관리</h3>
          <p className="text-sm text-gray-500 mt-1">모임 운영을 함께 할 멤버를 지정하세요</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="rounded-xl">
          <UserPlus className="h-4 w-4 mr-1.5" />
          운영진 추가
        </Button>
      </CardHeader>

      <CardContent>
        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : staffList.length === 0 ? (
          /* Empty State */
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">아직 운영진이 없습니다</p>
            <p className="text-sm text-gray-400 mt-1">운영진을 추가하여 모임 운영을 나눠보세요</p>
          </div>
        ) : (
          /* Staff List */
          <div className="space-y-3">
            {staffList.map((staff) => (
              <StaffCard key={staff.id} staff={staff} onEdit={(s) => setEditingStaff(s)} />
            ))}
          </div>
        )}

        {/* Role Guide */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">역할 안내</h4>
          <div className="space-y-2">
            {(Object.keys(ROLE_INFO) as Array<keyof typeof ROLE_INFO>).map((role) => {
              const info = ROLE_INFO[role];
              const Icon = info.icon;
              return (
                <div key={role} className="flex items-center gap-2 text-sm">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${info.color}`}
                  >
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

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(data) => addMutation.mutate(data)}
        participants={participants}
        existingStaffIds={existingStaffIds}
        isLoading={addMutation.isPending}
      />

      {/* Edit Staff Modal */}
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

export default StaffManagement;
