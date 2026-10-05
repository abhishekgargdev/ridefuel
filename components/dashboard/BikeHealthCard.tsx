'use client';

import React from 'react';
import { ShieldCheck, AlertCircle, Wrench, ChevronRight } from 'lucide-react';
import type { BikeHealthScore, HealthStatusLevel } from '@/types';

interface BikeHealthCardProps {
  healthScore?: BikeHealthScore | null;
  className?: string;
}

type DisplayStatus = 'GOOD' | 'DUE SOON' | 'DUE' | 'OVERDUE' | 'NO DATA';

export function BikeHealthCard({ healthScore, className = '' }: BikeHealthCardProps) {
  const score = healthScore?.score ?? 100;

  // Helper to map status to GOOD / DUE SOON / DUE / OVERDUE / NO DATA
  const mapStatus = (rawStatus?: HealthStatusLevel): DisplayStatus => {
    if (!rawStatus || rawStatus === 'NO DATA') return 'NO DATA';
    if (rawStatus === 'OK') return 'GOOD';
    return rawStatus;
  };

  // Find category status from health items
  const getItemStatus = (categoryQuery: string): DisplayStatus => {
    if (!healthScore?.items || healthScore.items.length === 0) {
      return 'NO DATA';
    }

    const item = healthScore.items.find((i) =>
      i.name.toLowerCase().includes(categoryQuery.toLowerCase())
    );

    return mapStatus(item?.status);
  };

  // Chain combines Lubrication and Cleaning
  const getChainStatus = (): DisplayStatus => {
    if (!healthScore?.items || healthScore.items.length === 0) return 'NO DATA';
    const lube = healthScore.items.find((i) => i.name.toLowerCase().includes('chain lubrication'));
    const clean = healthScore.items.find((i) => i.name.toLowerCase().includes('chain cleaning'));

    const statuses = [mapStatus(lube?.status), mapStatus(clean?.status)];
    if (statuses.includes('OVERDUE')) return 'OVERDUE';
    if (statuses.includes('DUE')) return 'DUE';
    if (statuses.includes('DUE SOON')) return 'DUE SOON';
    if (statuses.includes('GOOD')) return 'GOOD';
    return 'NO DATA';
  };

  const indicators: { name: string; status: DisplayStatus }[] = [
    { name: 'Engine Oil', status: getItemStatus('Engine Oil') },
    { name: 'Chain', status: getChainStatus() },
    { name: 'Brakes', status: getItemStatus('Brake') },
    { name: 'Tyres', status: getItemStatus('Tyre') },
    { name: 'Battery', status: getItemStatus('Battery') },
    { name: 'Service', status: getItemStatus('General Service') },
  ];

  const getStatusColor = (status: DisplayStatus) => {
    switch (status) {
      case 'GOOD':
        return {
          dot: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]',
          text: 'text-emerald-400',
        };
      case 'DUE SOON':
        return {
          dot: 'bg-amber-400',
          text: 'text-amber-400',
        };
      case 'DUE':
        return {
          dot: 'bg-orange-500 animate-pulse',
          text: 'text-orange-400',
        };
      case 'OVERDUE':
        return {
          dot: 'bg-rose-500 animate-pulse',
          text: 'text-rose-400',
        };
      case 'NO DATA':
      default:
        return {
          dot: 'bg-slate-500',
          text: 'text-slate-400',
        };
    }
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-slate-900/90 via-[#0a0f1d] to-[#070b14] border border-slate-800/90 shadow-2xl backdrop-blur-xl ${className}`}
      role="region"
      aria-label="Motorcycle Health Status"
    >
      {/* Header with Health Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                Bike Health
              </h3>
              <span className="text-xs text-slate-500 font-mono">·</span>
              <span className="text-xs font-mono font-semibold text-slate-400">
                Maintenance Condition
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Evaluated from routine service records, oil changes, and chain care intervals
            </p>
          </div>
        </div>

        {/* Large Score Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-100 tracking-tight">
              {score}%
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              {healthScore?.grade || (score >= 90 ? 'EXCELLENT' : score >= 75 ? 'GOOD' : 'ATTENTION')}
            </div>
          </div>
        </div>
      </div>

      {/* 6 Maintenance Indicators Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
        {indicators.map((item) => {
          const colors = getStatusColor(item.status);
          return (
            <div
              key={item.name}
              className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700/80 transition"
            >
              <div className="text-[11px] font-bold text-slate-300 truncate">
                {item.name}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                <span className={`text-xs font-mono font-bold tracking-wide ${colors.text}`}>
                  {item.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer link to detailed maintenance */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/60 text-xs text-slate-400">
        <span>Routine service schedule active</span>
        <a
          href="/dashboard/maintenance"
          className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition"
        >
          View Service Schedule <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
