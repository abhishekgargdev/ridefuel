'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardCharts } from '@/components/charts/dashboard-charts';
import { QuickActionModals } from '@/components/dashboard/quick-action-modals';
import { Speedometer } from '@/components/dashboard/Speedometer';
import { FuelGauge } from '@/components/dashboard/FuelGauge';
import { BikeHealthCard } from '@/components/dashboard/BikeHealthCard';
import { useAuth } from '@/lib/auth/context';
import type { DashboardSummary, DashboardChartsData, TimeRangeFilter } from '@/types';
import {
  Gauge,
  Fuel,
  Compass,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertTriangle,
  Wrench,
  Clock,
  Plus,
  RefreshCw,
  CalendarRange,
  ChevronDown,
  AlertCircle,
  WifiOff,
  Droplets,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { OfflineDataCache } from '@/lib/offline/offline-cache';

export default function DashboardPage() {
  const { user, activeBike, bikes, switchActiveBike } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<DashboardChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [cachedTimestamp, setCachedTimestamp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'fuel' | 'reading' | 'expense' | 'maintenance' | 'bike_wash' | 'chain_lube' | 'service' | null
  >(null);

  const currency = user?.currency || '₹';
  const distanceUnit = user?.distanceUnit || 'km';
  const fuelUnit = user?.fuelUnit === 'gallons' ? 'gal' : 'L';

  const fetchDashboard = useCallback(async (isChartOnly = false) => {
    if (!activeBike) return;
    if (isChartOnly) {
      setChartsLoading(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      let chartUrl = `/api/dashboard/charts?bikeId=${activeBike.id}&timeRange=${timeRange}`;
      if (timeRange === 'custom' && customStartDate) {
        chartUrl += `&startDate=${encodeURIComponent(customStartDate)}`;
        if (customEndDate) {
          chartUrl += `&endDate=${encodeURIComponent(customEndDate)}`;
        }
      }

      const requests: Promise<Response>[] = [fetch(chartUrl)];
      if (!isChartOnly) {
        requests.unshift(fetch(`/api/dashboard/summary?bikeId=${activeBike.id}`));
      }

      const results = await Promise.all(requests);

      if (!isChartOnly) {
        const sumRes = results[0];
        const chartRes = results[1];
        const sumJson = await sumRes.json();
        const chartJson = await chartRes.json();

        if (sumJson.success && sumJson.data?.summary) {
          setSummary(sumJson.data.summary);
          OfflineDataCache.save(`summary_${activeBike.id}`, sumJson.data.summary);
          setIsCached(false);
        } else {
          throw new Error(sumJson.error || 'Failed to fetch vehicle telemetry summary');
        }

        if (chartJson.success && chartJson.data?.charts) {
          setCharts(chartJson.data.charts);
          OfflineDataCache.save(`charts_${activeBike.id}_${timeRange}`, chartJson.data.charts);
        } else {
          throw new Error(chartJson.error || 'Failed to fetch telemetry charts');
        }
      } else {
        const chartJson = await results[0].json();
        if (chartJson.success && chartJson.data?.charts) {
          setCharts(chartJson.data.charts);
          OfflineDataCache.save(`charts_${activeBike.id}_${timeRange}`, chartJson.data.charts);
        }
      }
    } catch (err: unknown) {
      // Offline fallback: load from IndexedDB/LocalStorage cache
      const cachedSum = await OfflineDataCache.get<DashboardSummary>(`summary_${activeBike.id}`);
      const cachedChr = await OfflineDataCache.get<DashboardChartsData>(`charts_${activeBike.id}_${timeRange}`);

      if (cachedSum.data) {
        setSummary(cachedSum.data);
        setIsCached(true);
        if (cachedSum.cachedAt) {
          setCachedTimestamp(new Date(cachedSum.cachedAt).toLocaleTimeString());
        }
        if (cachedChr.data) {
          setCharts(cachedChr.data);
        }
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : 'Error loading vehicle dashboard');
      }
    } finally {
      setLoading(false);
      setChartsLoading(false);
    }
  }, [activeBike, timeRange, customStartDate, customEndDate]);

  // Initial load or bike switch
  useEffect(() => {
    if (activeBike) {
      fetchDashboard(false);
    }
  }, [activeBike?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Time range filter update
  useEffect(() => {
    if (activeBike && !loading) {
      if (timeRange === 'custom') {
        if (customStartDate) {
          fetchDashboard(true);
        }
      } else {
        fetchDashboard(true);
      }
    }
  }, [timeRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBikeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'new_bike') {
      window.location.href = '/dashboard/bikes';
      return;
    }
    if (val && val !== activeBike?.id) {
      await switchActiveBike(val);
    }
  };

  const handleApplyCustomFilter = () => {
    if (customStartDate) {
      fetchDashboard(true);
    }
  };

  if (!activeBike) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Fuel className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">No Motorcycle Configured</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Add your Royal Enfield Classic 350 or other motorcycle to start tracking fuel telemetry, mileage, and maintenance.
        </p>
        <Button onClick={() => (window.location.href = '/dashboard/bikes')} variant="primary">
          <Plus className="w-4 h-4 mr-2" /> Add Your Bike
        </Button>
      </div>
    );
  }

  // Current odometer (dynamic from summary, synchronized with latest valid readings)
  const displayOdometer = summary?.currentOdometer ?? activeBike.currentOdometer ?? activeBike.initialOdometer ?? 0;

  // Format bike display title
  const bikeDisplayTitle = (activeBike.name || `${activeBike.manufacturer} ${activeBike.model}`).toUpperCase();

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================
          TOP SECTION: ROYAL ENFIELD CLASSIC 350 & CURRENT ODOMETER
          ======================================================== */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-[#0d1424] to-slate-950 border border-slate-800/90 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative motorcycle dial pattern backdrop */}
        <div className="absolute right-0 top-0 bottom-0 w-80 pointer-events-none opacity-5 flex items-center justify-center">
          <Gauge className="w-72 h-72 text-amber-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono tracking-widest text-amber-500 uppercase font-semibold">
              <span>Motorcycle Companion</span>
              <span className="text-slate-600">·</span>
              <span>{activeBike.year} Model</span>
              {activeBike.registrationNumber && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">{activeBike.registrationNumber}</span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-100 mt-1 uppercase">
              {bikeDisplayTitle}
            </h1>

            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 font-mono">
              <span>Tank: {activeBike.tankCapacity} {fuelUnit} (Reserve: {activeBike.reserveCapacity || 2.6} {fuelUnit})</span>
              <span>·</span>
              <span>Factory: {activeBike.expectedMileage} {distanceUnit}/{fuelUnit}</span>
            </div>
          </div>

          {/* Current Odometer display */}
          <div className="flex items-center gap-4">
            <div className="bg-slate-950/80 border border-slate-800 px-5 py-3 rounded-2xl flex flex-col items-start sm:items-end shadow-inner">
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                Current Odometer
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-slate-100 tracking-tight">
                {displayOdometer.toLocaleString()}{' '}
                <span className="text-sm font-semibold text-slate-400">{distanceUnit}</span>
              </div>
            </div>

            {/* Bike Filter Dropdown & Refresh */}
            <div className="flex flex-col gap-1.5 shrink-0">
              {bikes.length > 1 && (
                <div className="relative inline-block">
                  <select
                    value={activeBike.id}
                    onChange={handleBikeChange}
                    className="appearance-none bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-200 rounded-xl px-2.5 py-1.5 pr-6 hover:border-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    {bikes.map((b) => (
                      <option key={b.id} value={b.id} className="bg-slate-900 text-slate-100">
                        {b.name}
                      </option>
                    ))}
                    <option value="new_bike" className="bg-slate-900 text-amber-400 font-bold">
                      + Add Bike...
                    </option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                </div>
              )}
              <button
                onClick={() => fetchDashboard(false)}
                className="p-2 self-end text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-xl transition border border-transparent hover:border-slate-800"
                title="Refresh Real Telemetry"
                aria-label="Refresh telemetry data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Offline Cached Notice */}
        {isCached && !error && (
          <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Offline Telemetry:</strong> Viewing cached motorcycle readings {cachedTimestamp ? `(saved ${cachedTimestamp})` : ''}. Any new actions will queue in local storage until reconnection.
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30 shrink-0">
              Cached
            </span>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => fetchDashboard(false)}
              className="text-xs h-7 bg-rose-950/60 border-rose-800 text-rose-200 hover:bg-rose-900 shrink-0"
            >
              Retry
            </Button>
          </div>
        )}
      </div>

      {/* ========================================================
          RESPONSIVE CONTENT CONTAINER
          On Mobile:
          1. Instrument panel first (Speedometer)
          2. Estimated fuel/range second (FuelGauge)
          3. Quick actions third
          4. Bike health fourth
          5. Upcoming care fifth
          6. Charts afterward
          On Desktop:
          Clean dashboard cockpit grid layout
          ======================================================== */}
      <div className="flex flex-col space-y-6">
        {/* 1 & 2. MOTORCYCLE INSTRUMENT PANEL (SPEEDOMETER + FUEL GAUGE + RANGE + MILEAGE) */}
        <div className="order-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Speedometer (Mode A GPS / Mode B Speed Unavailable) */}
          <div className="order-1 lg:order-none lg:col-span-5 flex">
            <Speedometer className="w-full" />
          </div>

          {/* Motorcycle Fuel Gauge & Estimated Range / Mileage Console */}
          <div className="order-2 lg:order-none lg:col-span-7 flex">
            {loading && !summary ? (
              <Skeleton className="w-full h-[320px] rounded-3xl" />
            ) : (
              <FuelGauge
                bike={activeBike}
                estimatedFuel={summary?.estimatedFuel ?? null}
                estimatedRange={summary?.estimatedRange ?? null}
                averageMileage={summary?.averageMileage ?? null}
                distanceUnit={distanceUnit}
                fuelUnit={fuelUnit}
                className="w-full"
              />
            )}
          </div>
        </div>

        {/* 3. QUICK ACTIONS (6 Actions: Add Fuel, Add Reading, Bike Wash, Chain Lube, Add Service, Add Expense) */}
        <div className="order-3">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 font-mono">
              Quick Telemetry & Care Actions
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Action 1: Add Fuel */}
            <button
              onClick={() => setActiveModal('fuel')}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800/90 hover:border-amber-500/50 text-slate-200 hover:text-slate-100 transition shadow-sm group"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                <Fuel className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-tight">Add Fuel</div>
                <div className="text-[10px] text-slate-400">Refill log</div>
              </div>
            </button>

            {/* Action 2: Add Reading */}
            <button
              onClick={() => setActiveModal('reading')}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800/90 hover:border-sky-500/50 text-slate-200 hover:text-slate-100 transition shadow-sm group"
            >
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:bg-sky-500 group-hover:text-slate-950 transition">
                <Gauge className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-tight">Add Reading</div>
                <div className="text-[10px] text-slate-400">Daily odo</div>
              </div>
            </button>

            {/* Action 3: Bike Wash */}
            <button
              onClick={() => setActiveModal('bike_wash')}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800/90 hover:border-cyan-500/50 text-slate-200 hover:text-slate-100 transition shadow-sm group"
            >
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition">
                <Droplets className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-tight">Bike Wash</div>
                <div className="text-[10px] text-slate-400">Cleaning log</div>
              </div>
            </button>

            {/* Action 4: Chain Lube */}
            <button
              onClick={() => setActiveModal('chain_lube')}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800/90 hover:border-amber-500/50 text-slate-200 hover:text-slate-100 transition shadow-sm group"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                <Layers className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-tight">Chain Lube</div>
                <div className="text-[10px] text-slate-400">500 km routine</div>
              </div>
            </button>

            {/* Action 5: Add Service */}
            <button
              onClick={() => setActiveModal('service')}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800/90 hover:border-orange-500/50 text-slate-200 hover:text-slate-100 transition shadow-sm group"
            >
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-slate-950 transition">
                <Wrench className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-tight">Add Service</div>
                <div className="text-[10px] text-slate-400">Service record</div>
              </div>
            </button>

            {/* Action 6: Add Expense */}
            <button
              onClick={() => setActiveModal('expense')}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800/90 hover:border-emerald-500/50 text-slate-200 hover:text-slate-100 transition shadow-sm group"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition">
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-tight">Add Expense</div>
                <div className="text-[10px] text-slate-400">Parts, toll, gear</div>
              </div>
            </button>
          </div>
        </div>

        {/* 4. BIKE HEALTH (Score 92% + 6 Indicators: Engine Oil, Chain, Brakes, Tyres, Battery, Service) */}
        <div className="order-4">
          {loading && !summary ? (
            <Skeleton className="w-full h-44 rounded-3xl" />
          ) : (
            <BikeHealthCard healthScore={summary?.healthScore} />
          )}
        </div>

        {/* 5. 4 CORE DASHBOARD SECTIONS (TODAY, BIKE CARE, FUEL, EXPENSES) */}
        <div className="order-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* SECTION A: TODAY */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/70 border border-slate-800/80 shadow-lg flex flex-col justify-between hover:border-slate-700/80 transition">
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  TODAY
                </span>
                <span className="text-[11px] text-slate-400 font-normal">Trip Telemetry</span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Distance</span>
                  <div className="text-xl sm:text-2xl font-black font-mono text-slate-100">
                    +{summary?.todaysDistance ?? 0}{' '}
                    <span className="text-xs font-semibold text-slate-400">{distanceUnit}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Fuel Consumed</span>
                    <span className="text-sm font-bold font-mono text-amber-400">
                      {summary?.todayStats?.fuelConsumed ? `${summary.todayStats.fuelConsumed} ${fuelUnit}` : '0.00 L'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Cost</span>
                    <span className="text-sm font-bold font-mono text-slate-200">
                      {currency}{summary?.todayStats?.estimatedCost ? summary.todayStats.estimatedCost.toLocaleString() : '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800/50 flex items-center justify-between text-[11px] text-slate-400">
              <span>{summary && summary.todaysDistance > 0 ? 'Logged from today\'s reading' : 'No trips logged today'}</span>
            </div>
          </div>

          {/* SECTION B: BIKE CARE */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/70 border border-slate-800/80 shadow-lg flex flex-col justify-between hover:border-slate-700/80 transition">
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Wrench className="w-4 h-4 text-orange-400" />
                  BIKE CARE
                </span>
                <span className="text-[11px] text-slate-400 font-normal">Maintenance</span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Next Care</span>
                  <div className="text-sm font-bold text-slate-100 truncate mt-0.5">
                    {summary?.upcomingCare && summary.upcomingCare.length > 0
                      ? `${summary.upcomingCare[0].category} · ${summary.upcomingCare[0].dueDescription}`
                      : summary?.nextMaintenance
                      ? `${summary.nextMaintenance.serviceType} · Due in ${summary.nextMaintenance.remainingKm ?? 0} km`
                      : 'All maintenance on track'}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Upcoming Service</span>
                  <div className="text-xs font-semibold text-amber-400 truncate mt-0.5">
                    {summary?.nextMaintenance
                      ? `${summary.nextMaintenance.serviceType} (${summary.nextMaintenance.remainingKm ? `in ${summary.nextMaintenance.remainingKm.toLocaleString()} km` : `${summary.nextMaintenance.daysRemaining} days`})`
                      : 'General service up to date'}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Overdue Tasks</span>
                  <span className="text-xs font-mono font-bold text-rose-400">
                    {summary?.overdueTasksCount !== undefined && summary.overdueTasksCount > 0
                      ? `${summary.overdueTasksCount} task${summary.overdueTasksCount > 1 ? 's' : ''}`
                      : '0 tasks · Clear'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800/50 flex items-center justify-between text-[11px] text-slate-400">
              <a href="/dashboard/maintenance" className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1">
                View Schedule <ChevronRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* SECTION C: FUEL */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/70 border border-slate-800/80 shadow-lg flex flex-col justify-between hover:border-slate-700/80 transition">
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Fuel className="w-4 h-4 text-amber-400" />
                  FUEL
                </span>
                <span className="text-[11px] text-slate-400 font-normal">Efficiency</span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Average Mileage</span>
                  <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                    {summary?.averageMileage !== null && summary?.averageMileage !== undefined ? (
                      <>
                        {summary.averageMileage}{' '}
                        <span className="text-xs font-semibold text-emerald-300/80">{distanceUnit}/{fuelUnit}</span>
                      </>
                    ) : (
                      <span className="text-xs font-normal text-slate-400">Needs 2 full tanks</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Fill</span>
                  <div className="text-xs font-mono font-bold text-slate-200 truncate mt-0.5">
                    {summary?.lastFuelFill ? (
                      `${summary.lastFuelFill.quantity}${fuelUnit} · ${currency}${summary.lastFuelFill.totalAmount} (${summary.lastFuelFill.odometer} ${distanceUnit})`
                    ) : (
                      <span className="text-slate-400 font-normal">No fill history</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Fuel Spend</span>
                  <span className="font-bold text-slate-200">
                    {currency}{summary?.totalFuelExpenditure ? summary.totalFuelExpenditure.toLocaleString() : 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800/50 flex items-center justify-between text-[11px] text-slate-400">
              <a href="/dashboard/fuel" className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1">
                Refill History <ChevronRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* SECTION D: EXPENSES */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/70 border border-slate-800/80 shadow-lg flex flex-col justify-between hover:border-slate-700/80 transition">
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <DollarSign className="w-4 h-4 text-sky-400" />
                  EXPENSES
                </span>
                <span className="text-[11px] text-slate-400 font-normal">Expenditure</span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">This Month</span>
                  <div className="text-xl sm:text-2xl font-black font-mono text-slate-100">
                    {currency}{summary?.expenseBreakdown?.thisMonthTotal
                      ? summary.expenseBreakdown.thisMonthTotal.toLocaleString()
                      : (summary?.currentMonthFuelExpenditure ?? 0).toLocaleString()}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/60 text-xs font-mono">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Fuel</span>
                    <span className="text-slate-200 font-bold truncate block">
                      {currency}{summary?.totalFuelExpenditure ? summary.totalFuelExpenditure.toLocaleString() : 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Maint.</span>
                    <span className="text-slate-200 font-bold truncate block">
                      {currency}{summary?.expenseBreakdown?.maintenanceTotal ? summary.expenseBreakdown.maintenanceTotal.toLocaleString() : 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Other</span>
                    <span className="text-slate-200 font-bold truncate block">
                      {currency}{summary?.expenseBreakdown?.otherTotal ? summary.expenseBreakdown.otherTotal.toLocaleString() : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800/50 flex items-center justify-between text-[11px] text-slate-400">
              <a href="/dashboard/expenses" className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1">
                View All Expenses <ChevronRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* 6. CHARTS & ANALYTICS VISUALIZATION */}
        <div className="order-6 space-y-4 pt-4 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Telemetry & Analytics</h2>
              <p className="text-xs text-slate-400">
                Interactive graphs powered by verified database logs
              </p>
            </div>

            {/* Preset Date Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-2xl overflow-x-auto shrink-0">
              {(['7d', '30d', '3m', '6m', '1y', 'all'] as TimeRangeFilter[]).map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setTimeRange(range);
                    setIsCustomOpen(false);
                  }}
                  className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-xl transition shrink-0 ${
                    timeRange === range
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
              <button
                onClick={() => {
                  setTimeRange('custom');
                  setIsCustomOpen(!isCustomOpen);
                }}
                className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-xl transition flex items-center gap-1 shrink-0 ${
                  timeRange === 'custom'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CalendarRange className="w-3 h-3" />
                <span>CUSTOM</span>
              </button>
            </div>
          </div>

          {/* Custom Date Range Picker Accordion */}
          {(timeRange === 'custom' || isCustomOpen) && (
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-wrap items-center gap-3 text-xs">
              <span className="font-semibold text-slate-300">Custom Date Range:</span>
              <div className="flex items-center gap-2">
                <label className="text-slate-400">From:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1 text-slate-100 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-slate-400">To:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1 text-slate-100 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={handleApplyCustomFilter}
                className="text-xs h-7 px-3"
              >
                Apply Filter
              </Button>
              <button
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                  setTimeRange('30d');
                  setIsCustomOpen(false);
                }}
                className="text-slate-400 hover:text-slate-200 underline text-xs"
              >
                Reset
              </button>
            </div>
          )}

          {/* Render Recharts Visualizations */}
          <DashboardCharts
            data={charts}
            loading={chartsLoading || (loading && !charts)}
            currency={currency}
            distanceUnit={distanceUnit}
            fuelUnit={fuelUnit}
            expectedMileage={activeBike.expectedMileage || 35.0}
            onAddLog={(type) => setActiveModal(type)}
          />
        </div>
      </div>

      {/* Quick Action Modals Triggered from Page & Quick Actions */}
      <QuickActionModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        onSuccess={() => fetchDashboard(false)}
      />
    </div>
  );
}
