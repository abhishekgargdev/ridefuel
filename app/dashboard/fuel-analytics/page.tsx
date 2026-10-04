'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth/context';
import type { FuelAnalyticsSummary } from '@/lib/services/fuel-calculator';
import { Fuel, DollarSign, MapPin, TrendingUp, Calendar } from 'lucide-react';
import { EmptyBikeState } from '@/components/dashboard/empty-bike-state';
import { PageSkeleton } from '@/components/ui/page-skeleton';

export default function FuelAnalyticsPage() {
  const { activeBike, user } = useAuth();
  const [analytics, setAnalytics] = useState<FuelAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const currency = user?.currency || '₹';
  const fuelUnit = user?.fuelUnit === 'gallons' ? 'gal' : 'L';

  useEffect(() => {
    if (!activeBike) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/analytics/fuel?bikeId=${activeBike.id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setAnalytics(json.data.analytics);
        }
      })
      .catch((e) => console.warn(e))
      .finally(() => setLoading(false));
  }, [activeBike]);

  if (!activeBike) {
    return <EmptyBikeState />;
  }

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
          <Fuel className="w-7 h-7 text-amber-400" />
          Fuel Consumption & Price Analytics
        </h1>
        <p className="text-xs text-slate-400">
          Refill quantities, petrol price history, and station analytics for {activeBike?.name}
        </p>
      </div>

      {loading ? (
        <PageSkeleton variant="analytics" />
      ) : !analytics || analytics.totalRefills === 0 ? (
        <Card className="text-center py-12">
          <Fuel className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <p className="font-semibold text-slate-200">No Fuel Records Available</p>
          <p className="text-xs text-slate-400">Log petrol fills to unlock price and consumption analytics.</p>
        </Card>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Volume
              </span>
              <span className="text-2xl font-black text-amber-400">
                {analytics.totalLiters} <span className="text-xs font-semibold">{fuelUnit}</span>
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">{analytics.totalRefills} fill-ups</span>
            </Card>

            <Card className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Average Petrol Price
              </span>
              <span className="text-2xl font-black text-slate-100">
                {currency}{analytics.averagePricePerLiter}
                <span className="text-xs font-semibold text-slate-400">/{fuelUnit}</span>
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">Weighted average</span>
            </Card>

            <Card className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Lowest Price Paid
              </span>
              <span className="text-2xl font-black text-emerald-400">
                {currency}{analytics.minPricePerLiter}
                <span className="text-xs font-semibold text-slate-400">/{fuelUnit}</span>
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">Best deal logged</span>
            </Card>

            <Card className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Highest Price Paid
              </span>
              <span className="text-2xl font-black text-rose-400">
                {currency}{analytics.maxPricePerLiter}
                <span className="text-xs font-semibold text-slate-400">/{fuelUnit}</span>
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">Peak premium petrol</span>
            </Card>
          </div>

          {/* Monthly Consumption Breakdown */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-base font-bold">Monthly Consumption Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Month</th>
                    <th className="p-3">Refills</th>
                    <th className="p-3">Volume ({fuelUnit})</th>
                    <th className="p-3">Total Spend</th>
                    <th className="p-3">Avg Cost / Refill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {analytics.monthlyConsumption.map((m) => (
                    <tr key={m.month} className="hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-slate-200">{m.month}</td>
                      <td className="p-3">{m.refillsCount} fills</td>
                      <td className="p-3 text-amber-400 font-semibold">{m.liters} {fuelUnit}</td>
                      <td className="p-3 font-bold text-slate-100">{currency}{m.amount.toLocaleString()}</td>
                      <td className="p-3 text-slate-400 font-mono">
                        {currency}{(m.amount / m.refillsCount).toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
