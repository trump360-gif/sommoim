'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  const isMypagePage = pathname.startsWith('/mypage');

  // Admin and Mypage have their own layout with sidebar, so just return children
  if (isAdminPage || isMypagePage) {
    return <>{children}</>;
  }

  // Regular pages use the standard sidebar
  return (
    <div className="flex min-h-[calc(100vh-4rem)] pt-16">
      <Sidebar />
      <main className="ml-64 flex-1 p-8 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
