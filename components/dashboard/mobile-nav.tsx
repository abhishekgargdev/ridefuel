'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Fuel, DollarSign, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isNavActive } from '@/lib/navigation';

export function MobileNav({
  onOpenQuickAction,
}: {
  onOpenQuickAction: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-2 py-1 safe-area-pb">
      <div className="flex items-center justify-around">
        <Link
          href="/dashboard"
          className={cn(
            'flex flex-col items-center justify-center p-2 rounded-xl transition',
            isNavActive(pathname, '/dashboard', 'exact') ? 'text-amber-400 font-bold' : 'text-slate-400'
          )}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] mt-1">Dashboard</span>
        </Link>

        <Link
          href="/dashboard/fuel"
          className={cn(
            'flex flex-col items-center justify-center p-2 rounded-xl transition',
            isNavActive(pathname, '/dashboard/fuel') ? 'text-amber-400 font-bold' : 'text-slate-400'
          )}
        >
          <Fuel className="w-5 h-5" />
          <span className="text-[10px] mt-1">Fuel</span>
        </Link>

        {/* Center Quick Action Floating Action Hub */}
        <button
          onClick={onOpenQuickAction}
          className="flex flex-col items-center justify-center -mt-5"
          aria-label="Quick log"
        >
          <div className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 font-black text-xl active:scale-95 transition-transform">
            +
          </div>
          <span className="text-[10px] text-amber-400 font-bold mt-0.5">Quick Log</span>
        </button>

        <Link
          href="/dashboard/expenses"
          className={cn(
            'flex flex-col items-center justify-center p-2 rounded-xl transition',
            isNavActive(pathname, '/dashboard/expenses') ? 'text-amber-400 font-bold' : 'text-slate-400'
          )}
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-[10px] mt-1">Expenses</span>
        </Link>

        <Link
          href="/dashboard/maintenance"
          className={cn(
            'flex flex-col items-center justify-center p-2 rounded-xl transition',
            isNavActive(pathname, '/dashboard/maintenance') ? 'text-amber-400 font-bold' : 'text-slate-400'
          )}
        >
          <Wrench className="w-5 h-5" />
          <span className="text-[10px] mt-1">Service</span>
        </Link>
      </div>
    </nav>
  );
}
