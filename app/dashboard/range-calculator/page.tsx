'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/context';
import type { RangeEstimateResult } from '@/lib/services/range-calculator';
import { Gauge, Fuel, AlertTriangle, Info, Compass, Calculator } from 'lucide-react';
import { EmptyBikeState } from '@/components/dashboard/empty-bike-state';
import { PageSkeleton } from '@/components/ui/page-skeleton';

export default function RangeCalculatorPage() {
  const { activeBike, user } = useAuth();
  const [data, setData] = useState<RangeEstimateResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulation inputs
  const [simExtraKm, setSimExtraKm] = useState<number>(0);
  const [simRefillLiters, setSimRefillLiters] = useState<number>(0);

  const distanceUnit = user?.distanceUnit || 'km';
  const fuelUnit = user?.fuelUnit === 'gallons' ? 'gal' : 'L';

  useEffect(() => {
    if (!activeBike) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/analytics/range?bikeId=${activeBike.id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.data.rangeResult);
        }
      })
      .catch((e) => console.warn(e))
      .finally(() => setLoading(false));
  }, [activeBike]);

  // Compute simulated range & fuel
  let simFuel = data?.estimatedFuel !== null && data?.estimatedFuel !== undefined ? data.estimatedFuel : null;
  let simRange = data?.estimatedRange !== null && data?.estimatedRange !== undefined ? data.estimatedRange : null;

  if (data && simFuel !== null && data.effectiveMileage > 0) {
    const adjustedFuel = Math.min(
      activeBike?.tankCapacity || 13,
      Math.max(0, simFuel + simRefillLiters - simExtraKm / data.effectiveMileage)
    );
    simFuel = Number(adjustedFuel.toFixed(1));
    simRange = Math.max(0, Number((simFuel * data.effectiveMileage).toFixed(0)));
  }

  const reserveLevel = activeBike?.reserveCapacity || 2.6;
  const isReserve = simFuel !== null && simFuel <= reserveLevel;

  if (!activeBike) {
    return <EmptyBikeState />;
  }

  if (loading) {
    return <PageSkeleton variant="analytics" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
          <Gauge className="w-7 h-7 text-amber-400" />
          Estimated Range & Fuel Telemetry
        </h1>
        <p className="text-xs text-slate-400">
          Algorithmic fuel estimation for {activeBike?.name} without relying on inaccurate tank floats
        </p>
      </div>

      {/* Sensor Disclaimer Alert */}
      <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-xs text-slate-200">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300 block font-semibold mb-1">
            Important Notice on Fuel Estimation
          </strong>
          <p className="text-slate-300 leading-relaxed">
            Motorcycles such as the Royal Enfield Classic 350 feature fuel tank geometries that produce erratic float gauge signals when leaning, braking, or riding uphill.
            Values shown here are mathematically calculated as <strong>Estimated Fuel</strong> and <strong>Estimated Range</strong> derived from your verified fuel refills, trip distances, and true engine consumption.
          </p>
        </div>
      </div>

      {/* Main Estimation Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estimated Fuel Gauge Card */}
        <Card className="p-6 border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Fuel className="w-4 h-4" /> Estimated Fuel
            </span>
            {isReserve && (
              <Badge variant="danger" className="animate-pulse flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> RESERVE LEVEL
              </Badge>
            )}
          </div>

          <div className="py-6 text-center">
            <div className="text-5xl font-black text-amber-400">
              {simFuel !== null ? simFuel : '—'}{' '}
              <span className="text-xl font-bold text-amber-300/80">{fuelUnit}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              of {activeBike?.tankCapacity} {fuelUnit} total capacity (Reserve: {reserveLevel} {fuelUnit})
            </p>

            {/* Visual Tank Bar */}
            <div className="mt-4 w-full h-4 bg-slate-950 rounded-full border border-slate-800 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isReserve ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-amber-400'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(5, ((simFuel || 0) / (activeBike?.tankCapacity || 13)) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-800 text-slate-400">
            <div>
              <span className="block font-semibold text-slate-200">Distance Since Refill:</span>
              <span>{data?.distanceTraveledSinceRefill ?? 0} {distanceUnit}</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-200">Effective Mileage:</span>
              <span>{data?.effectiveMileage ?? 35} {distanceUnit}/{fuelUnit}</span>
            </div>
          </div>
        </Card>

        {/* Estimated Range Gauge Card */}
        <Card className="p-6 border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-400" /> Estimated Range
            </span>
            <Badge variant="amber">To Empty</Badge>
          </div>

          <div className="py-6 text-center">
            <div className="text-5xl font-black text-slate-100">
              ~{simRange !== null ? simRange : '—'}{' '}
              <span className="text-xl font-bold text-amber-400">{distanceUnit}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Predicted riding distance remaining before fuel exhaustion
            </p>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Known Baseline Odometer:</span>
              <span className="font-semibold text-slate-200">{data?.lastKnownOdometer ?? 0} {distanceUnit}</span>
            </div>
            <div className="flex justify-between">
              <span>Current Verified Odometer:</span>
              <span className="font-semibold text-slate-200">{data?.currentOdometer ?? 0} {distanceUnit}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Interactive Trip Simulation Playground */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            Ride & Refill Simulation Playground
          </CardTitle>
          <p className="text-xs text-slate-400">
            Simulate an upcoming highway trip or fuel pump top-up to preview estimated range adjustments
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Simulate Riding Distance (+{distanceUnit})</Label>
              <Input
                type="number"
                min="0"
                max="500"
                value={simExtraKm}
                onChange={(e) => setSimExtraKm(Math.max(0, Number(e.target.value)))}
                placeholder="e.g. 50"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Adds additional travel on top of your current odometer.
              </p>
            </div>

            <div>
              <Label>Simulate Petrol Refill (+{fuelUnit})</Label>
              <Input
                type="number"
                min="0"
                max="15"
                step="0.5"
                value={simRefillLiters}
                onChange={(e) => setSimRefillLiters(Math.max(0, Number(e.target.value)))}
                placeholder="e.g. 5.0"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Simulates adding fuel into the tank.
              </p>
            </div>
          </div>

          {(simExtraKm > 0 || simRefillLiters > 0) && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-300">
                Simulation Active: <strong>+{simExtraKm} {distanceUnit}</strong> ride, <strong>+{simRefillLiters} {fuelUnit}</strong> fuel
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSimExtraKm(0);
                  setSimRefillLiters(0);
                }}
              >
                Reset Simulation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
