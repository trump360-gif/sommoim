// ================================
// Constants
// ================================

export const categoryLabels: Record<string, string> = {
  SPORTS: '운동',
  GAMES: '게임',
  FOOD: '음식',
  CULTURE: '문화',
  TRAVEL: '여행',
  STUDY: '학습',
};

export const statusLabels: Record<string, string> = {
  RECRUITING: '모집중',
  ONGOING: '진행중',
  COMPLETED: '완료',
  CANCELLED: '취소됨',
};

// ================================
// Helper Functions
// ================================

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
