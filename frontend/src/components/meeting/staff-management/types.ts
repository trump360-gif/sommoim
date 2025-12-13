// ================================
// Staff Management Types
// ================================

import type {
  MeetingStaff,
  StaffRole,
  StaffPermission,
  AddStaffDto,
  UpdateStaffDto,
} from '@/lib/api/meetings';

export interface StaffManagementProps {
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

export interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: AddStaffDto) => void;
  participants: StaffManagementProps['participants'];
  existingStaffIds: string[];
  isLoading: boolean;
}

export interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: MeetingStaff | null;
  onUpdate: (data: UpdateStaffDto) => void;
  onRemove: () => void;
  isLoading: boolean;
}

export interface StaffCardProps {
  staff: MeetingStaff;
  onEdit: (staff: MeetingStaff) => void;
}

// Re-export for convenience
export type { MeetingStaff, StaffRole, StaffPermission, AddStaffDto, UpdateStaffDto };
