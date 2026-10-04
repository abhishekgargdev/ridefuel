'use client';

import React from 'react';
import { Fuel, AlertTriangle, ShieldAlert, Info, TrendingUp, Gauge } from 'lucide-react';
import type { Bike } from '@/types';

interface FuelGaugeProps {
  bike: Bike;
  estimatedFuel: number | null;
  estimatedRange: number | null;
  averageMileage: number | null;
  distanceUnit?: string;
  fuelUnit?: string;
  className?: string;
}

export function FuelGauge({
  bike,
  estimatedFuel,
  estimatedRange,
  averageMileage,
  distanceUnit = 'km',
  fuelUnit = 'L',
  className = '',
}: FuelGaugeProps) {
  const tankCapacity = bike.tankCapacity || 13.0;
  const reserveCapacity = bike.reserveCapacity || 2.6;

  const hasData = estimatedFuel !== null && estimatedFuel > 0;
  const isReserve = hasData && estimatedFuel <= reserveCapacity;

  // Percentage of tank (0 to 100)
  const fuelPercent = hasData
    ? Math.max(0, Math.min(100, Math.round((estimatedFuel / tankCapacity) * 100)))
    : 0;

  // Confidence determination
  const getConfidenceLevel = (): 'HIGH CONFIDENCE' | 'MEDIUM CONFIDENCE' | 'LOW CONFIDENCE' | 'INSUFFICIENT DATA' => {
    if (!hasData) return 'INSUFFICIENT DATA';
    if (averageMileage && averageMileage > 0 && estimatedRange !== null) return 'HIGH CONFIDENCE';
    if (averageMileage && averageMileage > 0) return 'MEDIUM CONFIDENCE';
    return 'LOW CONFIDENCE';
  };

  const confidence = getConfidenceLevel();

  const getConfidenceStyles = () => {
    switch (confidence) {
      case 'HIGH CONFIDENCE':
        return { dot: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]', text: 'text-emerald-400' };
      case 'MEDIUM CONFIDENCE':
        return { dot: 'bg-sky-400', text: 'text-sky-400' };
      case 'LOW CONFIDENCE':
        return { dot: 'bg-amber-400', text: 'text-amber-400' };
      case 'INSUFFICIENT DATA':
      default:
        return { dot: 'bg-rose-400', text: 'text-rose-400' };
    }
  };

  const confStyles = getConfidenceStyles();

  // 10 vertical bars for motorcycle digital fuel bar gauge
  const totalBars = 10;
  const activeBars = hasData ? Math.max(1, Math.round((fuelPercent / 100) * totalBars)) : 0;
  const reserveBarThreshold = Math.ceil((reserveCapacity / tankCapacity) * totalBars);

  return (
    <div
      className={`relative flex flex-col justify-between p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-slate-900/90 via-[#0a0f1d] to-[#070b14] border border-slate-800/90 shadow-2xl backdrop-blur-xl ${className}`}
      role="region"
      aria-label="Estimated Fuel Gauge"
    >
      {/* Top Header */}
      <div className="w-full flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Fuel className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400">
            Estimated Fuel
          </span>
          <span
            title="Motorcycles lack physical in-tank float sensors. Value is algorithmically calculated from full-tank refills and recorded odometer telemetry."
            className="cursor-help"
          >
            <Info className="w-3 h-3 text-amber-500/70" />
          </span>
        </div>

        {/* Confidence label (clean text, no pill) */}
        <div className="flex items-center gap-1 text-[10px] font-mono tracking-wider font-semibold">
          <span className={`w-1.5 h-1.5 rounded-full ${confStyles.dot}`} />
          <span className={confStyles.text}>{confidence}</span>
        </div>
      </div>

      {/* Main Gauge & Reading Display */}
      <div className="my-auto py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          {/* Motorcycle Segmented Fuel Level Bar Display */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-400 px-0.5">
              <span className="text-rose-400 flex items-center gap-0.5">
                E {isReserve && <ShieldAlert className="w-3 h-3 animate-pulse" />}
              </span>
              <span className="text-slate-500">1/2</span>
              <span className="text-emerald-400">F</span>
            </div>

            {/* Segmented LED style bars */}
            <div className="grid grid-cols-10 gap-1.5 p-2 bg-slate-950/80 rounded-2xl border border-slate-800/90 shadow-inner">
              {Array.from({ length: totalBars }).map((_, idx) => {
                const isActive = idx < activeBars;
                const isReserveBar = idx < reserveBarThreshold;
                return (
                  <div
                    key={idx}
                    className={`h-9 rounded-md transition-all duration-300 ${
                      isActive
                        ? isReserveBar
                          ? 'bg-gradient-to-t from-rose-600 to-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                          : idx < 6
                          ? 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                          : 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                        : 'bg-slate-800/50 border border-slate-800/40'
                    }`}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
              <span>Reserve: {reserveCapacity} {fuelUnit}</span>
              <span>Capacity: {tankCapacity} {fuelUnit}</span>
            </div>
          </div>

          {/* Numerical readout panel */}
          <div className="flex flex-col justify-center space-y-3 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/60">
            {/* Estimated Fuel */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Estimated Fuel
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 tracking-tight">
                {hasData ? (
                  <>
                    {estimatedFuel}{' '}
                    <span className="text-sm font-semibold text-amber-300/80">{fuelUnit}</span>
                  </>
                ) : (
                  <span className="text-slate-500">-- {fuelUnit}</span>
                )}
              </div>
            </div>

            {/* Estimated Range & Average Mileage */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Est. Range
                </span>
                <span className="text-base font-black font-mono text-slate-100">
                  {estimatedRange !== null ? `~${estimatedRange} ${distanceUnit}` : `-- ${distanceUnit}`}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Mileage
                </span>
                <span className="text-base font-black font-mono text-emerald-400">
                  {averageMileage !== null
                    ? `${averageMileage} ${distanceUnit}/${fuelUnit}`
                    : `-- ${distanceUnit}/${fuelUnit}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Alert / Instruction */}
      <div className="w-full mt-2 pt-2 border-t border-slate-800/60">
        {!hasData ? (
          <p className="text-[11px] text-amber-400/90 flex items-center gap-1.5 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>Add more full-tank fuel records to improve the estimate.</span>
          </p>
        ) : isReserve ? (
          <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-bold animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            <span>Low Fuel Reserve: Refill soon at next available petrol station.</span>
          </p>
        ) : (
          <p className="text-[10px] text-slate-400 flex items-center justify-between font-mono">
            <span>Tank Level: {fuelPercent}%</span>
            <span>Calculated from verified refill logs</span>
          </p>
        )}
      </div>
    </div>
  );
}
