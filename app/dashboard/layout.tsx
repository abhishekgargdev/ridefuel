'use client';

import React, { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MobileNav } from '@/components/dashboard/mobile-nav';
import { MobileFabMenu } from '@/components/dashboard/mobile-fab';
import { QuickActionModals } from '@/components/dashboard/quick-action-modals';
import { OfflineIndicator } from '@/components/pwa/offline-indicator';
import { RequireAuth } from '@/components/auth/require-auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [activeQuickModal, setActiveQuickModal] = useState<
    'fuel' | 'reading' | 'expense' | 'maintenance' | null
  >(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleActionSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <RequireAuth>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
        <DashboardHeader onOpenQuickModal={(type) => setActiveQuickModal(type)} />

        <main className="flex-1 pb-24 lg:pb-12 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
          <div key={refreshKey}>{children}</div>
        </main>

        <MobileNav onOpenQuickAction={() => setFabOpen(true)} />

        <MobileFabMenu
          isOpen={fabOpen}
          onClose={() => setFabOpen(false)}
          onSelectAction={(type) => setActiveQuickModal(type)}
        />

        <QuickActionModals
          activeModal={activeQuickModal}
          onClose={() => setActiveQuickModal(null)}
          onSuccess={handleActionSuccess}
        />

        <OfflineIndicator />
      </div>
    </RequireAuth>
  );
}
