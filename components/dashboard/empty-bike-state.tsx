'use client';

import React from 'react';
import Link from 'next/link';
import { Fuel, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyBikeState({
  title = 'No Motorcycle Configured',
  description = 'Add a motorcycle to start tracking fuel, mileage, expenses, and maintenance.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="text-center py-16 space-y-4">
      <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
        <Fuel className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-100">{title}</h2>
      <p className="text-sm text-slate-400 max-w-md mx-auto">{description}</p>
      <Link href="/dashboard/bikes">
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" /> Add Your Bike
        </Button>
      </Link>
    </div>
  );
}
