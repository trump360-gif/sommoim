'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { meetingsApi, type AttendanceStatus, type ScheduleConflict } from '@/lib/api/meetings';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface ActivityAttendanceProps {
  activityId: string;
  activityTitle: string;
}

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; activeClass: string }> = {
  ATTENDING: { label: '참석', color: 'text-green-600', activeClass: 'bg-green-600 text-white hover:bg-green-700' },
  NOT_ATTENDING: { label: '불참', color: 'text-red-600', activeClass: 'bg-red-600 text-white hover:bg-red-700' },
  MAYBE: { label: '미정', color: 'text-yellow-600', activeClass: 'bg-yellow-600 text-white hover:bg-yellow-700' },
  PENDING: { label: '미응답', color: 'text-gray-400', activeClass: 'bg-gray-400 text-white' },
};

export function ActivityAttendance({ activityId, activityTitle }: ActivityAttendanceProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);

  const { data: myAttendance } = useQuery({
    queryKey: ['attendance', activityId],
    queryFn: () => meetingsApi.getMyAttendance(activityId),
    enabled: isAuthenticated,
  });

  const mutation = useMutation({
    mutationFn: (status: AttendanceStatus) => meetingsApi.updateAttendance(activityId, status),
    onSuccess: (data) => {
      if (data.hasConflict && data.conflicts) {
        setConflicts(data.conflicts);
        setShowConflictDialog(true);
      } else {
        queryClient.invalidateQueries({ queryKey: ['attendance', activityId] });
        queryClient.invalidateQueries({ queryKey: ['calendar'] });
      }
    },
  });

  const forceAttend = useMutation({
    mutationFn: () => meetingsApi.updateAttendance(activityId, 'ATTENDING'),
    onSuccess: () => {
      setShowConflictDialog(false);
      queryClient.invalidateQueries({ queryKey: ['attendance', activityId] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });

  if (!isAuthenticated) {
    return (
      <p className="text-sm text-gray-500">로그인 후 참석 여부를 선택할 수 있습니다.</p>
    );
  }

  const currentStatus = myAttendance?.status || 'PENDING';

  const handleStatusChange = (status: AttendanceStatus) => {
    if (status === currentStatus) return;
    mutation.mutate(status);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">참석 여부:</span>
        <span className={`text-sm font-semibold ${STATUS_CONFIG[currentStatus].color}`}>
          {STATUS_CONFIG[currentStatus].label}
        </span>
      </div>

      <div className="flex gap-2">
        {(['ATTENDING', 'NOT_ATTENDING', 'MAYBE'] as AttendanceStatus[]).map((status) => (
          <Button
            key={status}
            size="sm"
            variant={currentStatus === status ? 'primary' : 'outline'}
            className={currentStatus === status ? STATUS_CONFIG[status].activeClass : ''}
            onClick={() => handleStatusChange(status)}
            disabled={mutation.isPending}
          >
            {STATUS_CONFIG[status].label}
          </Button>
        ))}
      </div>

      {showConflictDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-yellow-600">일정 충돌 알림</h3>
            <p className="mb-4 text-gray-600">
              같은 시간에 다른 일정이 있습니다. 그래도 참석하시겠습니까?
            </p>
            <div className="mb-4 max-h-40 space-y-2 overflow-y-auto">
              {conflicts.map((conflict) => (
                <div key={conflict.activityId} className="rounded-md bg-yellow-50 p-3">
                  <p className="font-medium text-gray-800">{conflict.activityTitle}</p>
                  <p className="text-sm text-gray-600">{conflict.meetingTitle}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(conflict.date).toLocaleString('ko-KR')}
                    {conflict.endTime && ` ~ ${new Date(conflict.endTime).toLocaleTimeString('ko-KR')}`}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConflictDialog(false)}>
                취소
              </Button>
              <Button
                onClick={() => forceAttend.mutate()}
                disabled={forceAttend.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                그래도 참석
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
