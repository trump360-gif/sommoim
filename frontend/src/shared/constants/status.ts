// ================================
// Status Constants
// ================================

// 모임 상태
export const STATUS_LABELS: Record<string, string> = {
  RECRUITING: '모집중',
  ONGOING: '진행중',
  COMPLETED: '완료',
  CANCELLED: '취소됨',
};

// 모임 상태 색상
export const STATUS_COLORS: Record<string, string> = {
  RECRUITING: 'bg-green-100 text-green-800',
  ONGOING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

// 참가자 상태 (라벨과 색상 통합)
export const PARTICIPANT_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: '대기중', color: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: '승인됨', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: '거절됨', color: 'bg-red-100 text-red-800' },
  CANCELLED: { label: '취소됨', color: 'bg-gray-100 text-gray-800' },
  KICKED: { label: '강퇴됨', color: 'bg-red-100 text-red-800' },
  ATTENDED: { label: '참석함', color: 'bg-blue-100 text-blue-800' },
};

// 참가자 상태 라벨만
export const PARTICIPANT_STATUS_LABELS: Record<string, string> = {
  PENDING: '대기중',
  APPROVED: '승인됨',
  REJECTED: '거절됨',
  CANCELLED: '취소됨',
  KICKED: '강퇴됨',
  ATTENDED: '참석함',
};

// 참가자 상태 색상만
export const PARTICIPANT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  KICKED: 'bg-red-100 text-red-800',
  ATTENDED: 'bg-blue-100 text-blue-800',
};

// 신고 상태
export const REPORT_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: '대기중', color: 'bg-yellow-100 text-yellow-700' },
  PROCESSING: { label: '처리중', color: 'bg-blue-100 text-blue-700' },
  RESOLVED: { label: '해결됨', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: '반려됨', color: 'bg-gray-100 text-gray-700' },
};

// 이전 변수명과의 호환성을 위한 별칭
export const statusLabels = STATUS_LABELS;
