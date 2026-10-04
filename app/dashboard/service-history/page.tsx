'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/context';
import type { MaintenanceRecord } from '@/types';
import { Wrench, Calendar, MapPin, DollarSign, CheckCircle2 } from 'lucide-react';
import { EmptyBikeState } from '@/components/dashboard/empty-bike-state';
import { ListSkeleton } from '@/components/ui/page-skeleton';

export default function ServiceHistoryPage() {
  const { activeBike, user } = useAuth();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const currency = user?.currency || '₹';
  const distanceUnit = user?.distanceUnit || 'km';

  useEffect(() => {
    if (!activeBike) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/maintenance?bikeId=${activeBike.id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setRecords(json.data || []);
        }
      })
      .finally(() => setLoading(false));
  }, [activeBike]);

  const totalSpent = records.reduce((acc, r) => acc + (r.amount || 0), 0);

  if (!activeBike) {
    return <EmptyBikeState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <Wrench className="w-7 h-7 text-amber-400" />
            Official Service History
          </h1>
          <p className="text-xs text-slate-400">
            Chronological maintenance registry, garage invoices, and part replacements for {activeBike?.name}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Servicing Investment</span>
          <span className="text-xl font-bold text-amber-400">{currency}{totalSpent.toLocaleString()}</span>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <ListSkeleton count={3} height="h-28" />
        ) : records.length === 0 ? (
          <Card className="text-center py-12 text-slate-400 text-xs">
            No service history recorded yet.
          </Card>
        ) : (
        records.map((rec, index) => (
          <Card key={rec.id} className="p-5 border-slate-800 hover:border-slate-700 transition">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Badge variant="amber">Service #{records.length - index}</Badge>
                  <h3 className="font-bold text-base text-slate-100">{rec.serviceType}</h3>
                  <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {rec.odometer.toLocaleString()} {distanceUnit}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{rec.description}</p>

                <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> {rec.date}
                  </span>
                  {rec.workshop && (
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" /> {rec.workshop}
                    </span>
                  )}
                  {rec.nextDueOdometer && (
                    <span className="text-amber-400 font-medium">
                      Next check @ {rec.nextDueOdometer.toLocaleString()} {distanceUnit}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <div className="text-lg font-black text-slate-100">
                  {currency}{rec.amount.toLocaleString()}
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center sm:justify-end gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Logged & Verified
                </span>
              </div>
            </div>
          </Card>
        ))
        )}
      </div>
    </div>
  );
}
