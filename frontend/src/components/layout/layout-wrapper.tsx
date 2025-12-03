'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { AdminSidebar } from './admin-sidebar';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <div className="flex pt-16">
      {isAdminPage ? <AdminSidebar /> : <Sidebar />}
      <main className="ml-60 flex-1 p-6">{children}</main>
    </div>
  );
}
