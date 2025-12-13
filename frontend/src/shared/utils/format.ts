// ================================
// Date & Format Utilities
// ================================

export interface FormatDateOptions {
  includeWeekday?: boolean;
  includeTime?: boolean;
  includeYear?: boolean;
}

/**
 * 날짜를 한국어 형식으로 포맷팅
 * @param date - Date 객체 또는 날짜 문자열
 * @param options - 포맷 옵션
 * @returns 포맷된 날짜 문자열
 */
export function formatDate(
  date: Date | string,
  options: FormatDateOptions = {}
): string {
  const { includeWeekday = false, includeTime = false, includeYear = true } = options;

  const d = new Date(date);

  const formatOptions: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
  };

  if (includeYear) {
    formatOptions.year = 'numeric';
  }

  if (includeWeekday) {
    formatOptions.weekday = 'short';
  }

  if (includeTime) {
    formatOptions.hour = '2-digit';
    formatOptions.minute = '2-digit';
  }

  return d.toLocaleDateString('ko-KR', formatOptions);
}

/**
 * 날짜와 시간을 함께 포맷팅
 */
export function formatDateTime(date: Date | string): string {
  return formatDate(date, { includeTime: true });
}

/**
 * 날짜와 요일을 함께 포맷팅
 */
export function formatDateWithWeekday(date: Date | string): string {
  return formatDate(date, { includeWeekday: true });
}

/**
 * 날짜, 요일, 시간을 모두 포맷팅
 */
export function formatFullDateTime(date: Date | string): string {
  return formatDate(date, { includeWeekday: true, includeTime: true });
}

/**
 * 이벤트 날짜 파싱 (월, 일, 요일, 시간 분리)
 */
export interface EventDateParts {
  month: string;
  day: number;
  weekday: string;
  time: string;
}

export function formatEventDate(dateStr: string): EventDateParts {
  const date = new Date(dateStr);

  return {
    month: date.toLocaleDateString('ko-KR', { month: 'short' }),
    day: date.getDate(),
    weekday: date.toLocaleDateString('ko-KR', { weekday: 'short' }),
    time: date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

/**
 * 상대 시간 포맷팅 (예: "3분 전", "2시간 전", "어제")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return '방금 전';
  } else if (diffMin < 60) {
    return `${diffMin}분 전`;
  } else if (diffHour < 24) {
    return `${diffHour}시간 전`;
  } else if (diffDay === 1) {
    return '어제';
  } else if (diffDay < 7) {
    return `${diffDay}일 전`;
  } else if (diffDay < 30) {
    return `${Math.floor(diffDay / 7)}주 전`;
  } else if (diffDay < 365) {
    return `${Math.floor(diffDay / 30)}개월 전`;
  } else {
    return `${Math.floor(diffDay / 365)}년 전`;
  }
}

/**
 * 숫자 포맷팅 (천 단위 콤마)
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

/**
 * 짧은 숫자 포맷팅 (1.2K, 3.5M 등)
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
