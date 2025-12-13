// ================================
// Staff Management Constants
// ================================

import { Crown, Shield, Users } from 'lucide-react';
import type { StaffRole, StaffPermission } from './types';

// ================================
// Role Configuration
// ================================

export const ROLE_INFO: Record<
  StaffRole,
  { label: string; icon: typeof Crown; color: string; description: string }
> = {
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

// ================================
// Permission Configuration
// ================================

export const PERMISSION_INFO: Record<StaffPermission, { label: string; description: string }> = {
  MANAGE_EVENTS: { label: '이벤트 관리', description: '정모/번개 생성, 수정, 삭제' },
  MANAGE_SCHEDULES: { label: '일정 관리', description: '모임 일정 관리' },
  MANAGE_ACTIVITIES: { label: '활동 관리', description: '활동 기록, 갤러리 관리' },
  MANAGE_MEMBERS: { label: '멤버 관리', description: '가입 승인/거절, 멤버 관리' },
  MANAGE_CHAT: { label: '채팅 관리', description: '채팅 메시지 삭제, 뮤트' },
  VIEW_STATS: { label: '통계 조회', description: '모임 통계 및 분석 조회' },
};

export const ALL_PERMISSIONS: StaffPermission[] = [
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

export function getDefaultPermissions(role: StaffRole): StaffPermission[] {
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
