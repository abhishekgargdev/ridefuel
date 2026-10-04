'use client';

import React, { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MobileNav } from '@/components/dashboard/mobile-nav';
import { MobileFabMenu } from '@/components/dashboard/mobile-fab';
import { QuickActionModals } from '@/components/dashboard/quick-action-modals';
import { OfflineIndicator } from '@/components/pwa/offline-indicator';
import { useAuth } from '@/lib/auth/context';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [activeQuickModal, setActiveQuickModal] = useState<
    'fuel' | 'reading' | 'expense' | 'maintenance' | null
  >(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleActionSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      <DashboardHeader onOpenQuickModal={(type) => setActiveQuickModal(type)} />

      <main className="flex-1 pb-24 lg:pb-12 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {loading ? (
          <div className="space-y-4 py-8">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div key={refreshKey}>{children}</div>
        )}
      </main>

      {/* Mobile Navigation bar */}
      <MobileNav onOpenQuickAction={() => setFabOpen(true)} />

      {/* Mobile Floating Action Modal Menu */}
      <MobileFabMenu
        isOpen={fabOpen}
        onClose={() => setFabOpen(false)}
        onSelectAction={(type) => setActiveQuickModal(type)}
      />

      {/* Global Quick Action Modals */}
      <QuickActionModals
        activeModal={activeQuickModal}
        onClose={() => setActiveQuickModal(null)}
        onSuccess={handleActionSuccess}
      />

      {/* Offline Status Badge */}
      <OfflineIndicator />
    </div>
  );
}
