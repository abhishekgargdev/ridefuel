'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth/context';
import type { MileageStats } from '@/lib/services/mileage-calculator';
import { TrendingUp, Award, ArrowDown, ArrowUp, Calendar, Info, Fuel, AlertCircle } from 'lucide-react';

export default function MileageAnalyticsPage() {
  const { activeBike, user } = useAuth();
  const [stats, setStats] = useState<MileageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const currency = user?.currency || '₹';
  const distanceUnit = user?.distanceUnit || 'km';
  const fuelUnit = user?.fuelUnit === 'gallons' ? 'gal' : 'L';

  useEffect(() => {
    if (!activeBike) return;
    setLoading(true);
    fetch(`/api/analytics/mileage?bikeId=${activeBike.id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setStats(json.data.stats);
        }
      })
      .catch((e) => console.warn(e))
      .finally(() => setLoading(false));
  }, [activeBike]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-emerald-400" />
          Mileage Telemetry & Analytics
        </h1>
        <p className="text-xs text-slate-400">
          Full-tank-to-full-tank calculation metrics and fuel efficiency history for {activeBike?.name}
        </p>
      </div>

      {/* Explanatory Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-xs text-slate-300">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300 block font-semibold mb-0.5">
            Full Tank to Full Tank Calculation Methodology
          </strong>
          <p className="text-slate-400 leading-relaxed">
            Because motorcycle fuel gauges fluctuate on road inclines, RideFuel calculates true mileage using full-tank cycles:
            <code className="text-amber-300 ml-1 bg-slate-900 px-1 py-0.5 rounded">Mileage = (Odometer₂ - Odometer₁) ÷ Refill Volume</code>.
            Partial refills are logged for expense accounting but excluded from efficiency math to avoid false readings.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : !stats || !stats.hasEnoughData ? (
        <Card className="text-center py-12">
          <AlertCircle className="w-10 h-10 mx-auto text-amber-400 mb-2" />
          <h3 className="font-bold text-slate-100">Not Enough Data to Calculate Mileage</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            You need at least <strong>two consecutive full-tank refills</strong> to compute authentic mileage.
          </p>
          <Button onClick={() => (window.location.href = '/dashboard/fuel')} variant="primary" size="sm">
            <Fuel className="w-4 h-4 mr-1.5" /> Add Full Tank Refill
          </Button>
        </Card>
      ) : (
        <>
          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 border-emerald-500/30 bg-emerald-500/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                Average Mileage
              </span>
              <span className="text-2xl font-black text-emerald-400">
                {stats.averageMileage} <span className="text-xs font-semibold">{distanceUnit}/{fuelUnit}</span>
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                From {stats.calculationCount} full-tank cycles
              </span>
            </Card>

            <Card className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Most Recent Mileage
              </span>
              <span className="text-2xl font-black text-slate-100">
                {stats.recentMileage} <span className="text-xs font-semibold">{distanceUnit}/{fuelUnit}</span>
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">Latest refill run</span>
            </Card>

            <Card className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Best / Maximum
              </span>
              <span className="text-2xl font-black text-emerald-400 flex items-center gap-1">
                <ArrowUp className="w-5 h-5" /> {stats.maxMileage}
                <span className="text-xs font-semibold text-slate-400">{distanceUnit}/{fuelUnit}</span>
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">Highway / open cruise</span>
            </Card>

            <Card className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Lowest / Minimum
              </span>
              <span className="text-2xl font-black text-rose-400 flex items-center gap-1">
                <ArrowDown className="w-5 h-5" /> {stats.minMileage}
                <span className="text-xs font-semibold text-slate-400">{distanceUnit}/{fuelUnit}</span>
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">City stop-and-go</span>
            </Card>
          </div>

          {/* Full-Tank Cycles Breakdown Table */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-base font-bold">Verified Full-Tank Refill Cycles</CardTitle>
              <p className="text-xs text-slate-400">
                Complete log of calculated runs between consecutive full tanks
              </p>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Odometer</th>
                    <th className="p-3">Distance Run</th>
                    <th className="p-3">Fuel Added</th>
                    <th className="p-3">Calculated Mileage</th>
                    <th className="p-3">Cost / {distanceUnit}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {stats.logsWithMileage.map((item) => (
                    <tr key={item.logId} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-medium text-slate-200">{item.date}</td>
                      <td className="p-3">{item.odometer.toLocaleString()} {distanceUnit}</td>
                      <td className="p-3 font-semibold text-slate-100">+{item.distance} {distanceUnit}</td>
                      <td className="p-3 text-amber-400 font-semibold">{item.fuelQuantity} {fuelUnit}</td>
                      <td className="p-3">
                        <span className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          {item.mileage} {distanceUnit}/{fuelUnit}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 font-mono">
                        {currency}{item.costPerKm}
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
