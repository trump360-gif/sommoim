'use client';

import { usePathname } from 'next/navigation';
import { Header } from './header';

export function ConditionalHeader() {
  const pathname = usePathname();

  // Admin 페이지에서는 자체 AdminHeader를 사용하므로 메인 Header 숨김
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return <Header />;
}
