'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { DASHBOARD_PATH } from '@/lib/auth/routes';
import { PageSkeleton } from '@/components/ui/page-skeleton';

export function RequireGuest({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(DASHBOARD_PATH);
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <PageSkeleton variant="form" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
}
