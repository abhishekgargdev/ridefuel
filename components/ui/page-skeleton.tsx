import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-28" />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 3, height = 'h-24' }: { count?: number; height?: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className={height} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4">
      <Skeleton className="h-8 w-full" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function PageSkeleton({
  variant = 'dashboard',
}: {
  variant?: 'dashboard' | 'list' | 'analytics' | 'form';
}) {
  if (variant === 'form') {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="space-y-4 py-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
        <StatCardsSkeleton />
        <ListSkeleton />
      </div>
    );
  }

  if (variant === 'analytics') {
    return (
      <div className="space-y-4 py-2">
        <Skeleton className="h-8 w-64" />
        <StatCardsSkeleton />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      <Skeleton className="h-8 w-48" />
      <StatCardsSkeleton />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
