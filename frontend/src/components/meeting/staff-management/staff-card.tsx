'use client';

// ================================
// Staff Card Component
// ================================

import { Button } from '@/components/ui/button';
import { ROLE_INFO } from './constants';
import type { StaffCardProps } from './types';

// ================================
// Component
// ================================

export function StaffCard({ staff, onEdit }: StaffCardProps) {
  const roleInfo = ROLE_INFO[staff.role];
  const Icon = roleInfo.icon;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-all">
      <div className="h-12 w-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
        {staff.user?.profile?.avatarUrl ? (
          <img
            src={staff.user.profile.avatarUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-lg font-medium text-gray-400">
            {staff.user?.nickname?.charAt(0) || '?'}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">
          {staff.user?.nickname || '알 수 없음'}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}
          >
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
