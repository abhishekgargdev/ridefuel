'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { getSafeRedirect, LOGIN_PATH } from '@/lib/auth/routes';
import { PageSkeleton } from '@/components/ui/page-skeleton';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || user) return;
    const redirect = encodeURIComponent(getSafeRedirect(pathname));
    router.replace(`${LOGIN_PATH}?redirect=${redirect}`);
  }, [loading, user, pathname, router]);

  if (loading || !user) {
    return <PageSkeleton variant="dashboard" />;
  }

  return <>{children}</>;
}
