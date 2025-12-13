// ================================
// Category Constants
// ================================

export const CATEGORY_LABELS: Record<string, string> = {
  SPORTS: '운동',
  GAMES: '게임',
  FOOD: '음식',
  CULTURE: '문화',
  TRAVEL: '여행',
  STUDY: '학습',
};

// 카테고리 아이콘 (옵션)
export const CATEGORY_ICONS: Record<string, string> = {
  SPORTS: '🏃',
  GAMES: '🎮',
  FOOD: '🍽️',
  CULTURE: '🎨',
  TRAVEL: '✈️',
  STUDY: '📚',
};

// 카테고리 색상 (옵션)
export const CATEGORY_COLORS: Record<string, string> = {
  SPORTS: 'bg-green-500',
  GAMES: 'bg-purple-500',
  FOOD: 'bg-orange-500',
  CULTURE: 'bg-pink-500',
  TRAVEL: 'bg-blue-500',
  STUDY: 'bg-yellow-500',
};

// 이전 변수명과의 호환성을 위한 별칭
export const categoryLabels = CATEGORY_LABELS;
