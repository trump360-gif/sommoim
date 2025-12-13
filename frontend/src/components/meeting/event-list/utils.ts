// ================================
// Event List Utilities
// ================================

import type { EventDateInfo } from './types';

/**
 * 이벤트 날짜 정보 포맷팅
 */
export function formatEventDate(dateStr: string): EventDateInfo {
  const date = new Date(dateStr);
  return {
    month: date.toLocaleDateString('ko-KR', { month: 'short' }),
    day: date.getDate(),
    weekday: date.toLocaleDateString('ko-KR', { weekday: 'short' }),
    time: date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * 미래 이벤트인지 확인
 */
export function isUpcoming(dateStr: string): boolean {
  return new Date(dateStr) > new Date();
}
