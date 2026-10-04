import React from 'react';
import { cn } from '@/lib/utils';

export function Tabs({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string;
  onValueChange: (val: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('w-full', className)}>{children}</div>;
}

export function TabsList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'inline-flex h-11 items-center justify-start rounded-xl bg-slate-950/80 p-1 border border-slate-800 text-slate-400 overflow-x-auto max-w-full',
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  activeValue,
  onClick,
  children,
  className,
}: {
  value: string;
  activeValue?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const isActive = value === activeValue;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold ring-offset-background transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 select-none',
        isActive
          ? 'bg-amber-500 text-slate-950 shadow font-bold'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900',
        className
      )}
    >
      {children}
    </button>
  );
}
