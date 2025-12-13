import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date utilities - re-exported from shared for backward compatibility
export { formatDate, formatDateTime, formatRelativeTime } from '@/shared';
