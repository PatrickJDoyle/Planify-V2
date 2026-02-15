'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useUIStore } from '@/lib/stores/ui-store';
import { setAuthCredentials } from '@/lib/api/client';
import { cn } from '@/lib/utils';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getToken, userId } = useAuth();
  const { sidebarCollapsed } = useUIStore();

  // Sync Clerk auth token to localStorage for API client
  useEffect(() => {
    async function syncToken() {
      if (userId) {
        const token = await getToken();
        if (token) {
          setAuthCredentials(token, userId);
        }
      }
    }
    syncToken();

    // Refresh token periodically
    const interval = setInterval(syncToken, 50_000);
    return () => clearInterval(interval);
  }, [getToken, userId]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-200',
          sidebarCollapsed
            ? 'lg:pl-[var(--sidebar-collapsed-width)]'
            : 'lg:pl-[var(--sidebar-width)]',
        )}
      >
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
