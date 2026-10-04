'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardChartsData } from '@/types';
import {
  Fuel,
  Gauge,
  TrendingUp,
  DollarSign,
  Wrench,
  BarChart2,
  PieChart as PieIcon,
  Plus,
} from 'lucide-react';

interface DashboardChartsProps {
  data: DashboardChartsData | null;
  loading?: boolean;
  currency?: string;
  distanceUnit?: string;
  fuelUnit?: string;
  expectedMileage?: number;
  onAddLog?: (type: 'fuel' | 'reading' | 'expense' | 'maintenance') => void;
}

const customTooltipStyle = {
  backgroundColor: '#090d16',
  borderColor: '#1e293b',
  borderRadius: '12px',
  color: '#f8fafc',
  fontSize: '12px',
  boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.7)',
  padding: '8px 12px',
};

function formatDateTick(val: any): string {
  const str = String(val ?? '');
  if (!str) return '';
  if (str.length >= 10) {
    return str.substring(5); // MM-DD
  }
  return str;
}

function formatMonthTick(val: any): string {
  const str = String(val ?? '');
  if (!str) return '';
  // e.g. 2026-09 -> Sep '26
  const parts = str.split('-');
  if (parts.length === 2) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mIdx = parseInt(parts[1], 10) - 1;
    if (mIdx >= 0 && mIdx < 12) {
      return `${months[mIdx]} '${parts[0].slice(2)}`;
    }
  }
  return str;
}

interface EmptyChartStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

function EmptyChartState({ icon, title, description, actionLabel, onAction }: EmptyChartStateProps) {
  return (
    <div className="h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center rounded-xl bg-slate-900/30 border border-dashed border-slate-800/80">
      <div className="w-10 h-10 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">{title}</h4>
      <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button
          size="sm"
          variant="secondary"
          onClick={onAction}
          className="mt-3 text-xs h-7 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200"
        >
          <Plus className="w-3 h-3 mr-1" /> {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function DashboardCharts({
  data,
  loading = false,
  currency = '₹',
  distanceUnit = 'km',
  fuelUnit = 'L',
  expectedMileage = 35.0,
  onAddLog,
}: DashboardChartsProps) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="p-4 sm:p-6 space-y-3">
            <div className="space-y-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-60" />
            </div>
            <Skeleton className="h-60 w-full rounded-xl" />
          </Card>
        ))}
      </div>
    );
  }

  const {
    mileageOverTime,
    monthlyDistance,
    monthlyFuelConsumption,
    monthlyFuelExpense,
    petrolPriceTrend,
    costPerKmTrend,
    maintenanceExpenses,
    totalExpensesByCategory,
  } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
      {/* 1. Mileage Trend */}
      <Card className="hover:border-slate-800 transition-all duration-200">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              1. Mileage Trend
            </CardTitle>
            <span className="text-[11px] font-semibold text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
              {distanceUnit}/{fuelUnit}
            </span>
          </div>
          <CardDescription className="text-xs text-slate-400">
            Calculated from full-tank refills • Factory rated at {expectedMileage} {distanceUnit}/{fuelUnit}
          </CardDescription>
        </CardHeader>
        <div className="p-4 sm:p-6 pt-0 h-64 w-full">
          {mileageOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mileageOverTime} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={formatDateTick}
                  tickMargin={6}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  domain={['dataMin - 3', 'dataMax + 3']}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip
                  contentStyle={customTooltipStyle}
                  formatter={(value: any, _: any, item: any) => [
                    `${value} ${distanceUnit}/${fuelUnit} (Odo: ${item.payload.odometer} ${distanceUnit})`,
                    'Mileage',
                  ]}
                  labelFormatter={(l) => `Refill Date: ${l}`}
                />
                <ReferenceLine
                  y={expectedMileage}
                  stroke="#64748b"
                  strokeDasharray="4 4"
                  label={{ value: 'Factory', fill: '#94a3b8', fontSize: 10, position: 'insideTopRight' }}
                />
                <Line
                  type="monotone"
                  dataKey="mileage"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#f59e0b', stroke: '#0f172a', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#fbbf24', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState
              icon={<TrendingUp className="w-5 h-5 text-amber-400" />}
              title="Not Enough Mileage Data"
              description="Mileage requires at least two full-tank fuel refills to compute exact consumption intervals."
              actionLabel="Log Fuel Fill"
              onAction={() => onAddLog?.('fuel')}
            />
          )}
        </div>
      </Card>

      {/* 2. Distance Travelled */}
      <Card className="hover:border-slate-800 transition-all duration-200">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-sky-400" />
              2. Distance Travelled
            </CardTitle>
            <span className="text-[11px] font-semibold text-sky-400/90 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
              {distanceUnit}
            </span>
          </div>
          <CardDescription className="text-xs text-slate-400">
            Total riding distance covered per month from odometer telemetry
          </CardDescription>
        </CardHeader>
        <div className="p-4 sm:p-6 pt-0 h-64 w-full">
          {monthlyDistance.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyDistance} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={formatMonthTick}
                  tickMargin={6}
                />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}`} />
                <Tooltip
                  contentStyle={customTooltipStyle}
                  formatter={(value: any) => [`${value} ${distanceUnit}`, 'Distance']}
                  labelFormatter={(l) => `Period: ${formatMonthTick(l)}`}
                />
                <Bar
                  dataKey="distance"
                  fill="#38bdf8"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState
              icon={<Gauge className="w-5 h-5 text-sky-400" />}
              title="No Distance Records"
              description="Record daily speedometer readings or fuel refills to track your monthly riding mileage."
              actionLabel="Add Speedometer Reading"
              onAction={() => onAddLog?.('reading')}
            />
          )}
        </div>
      </Card>

      {/* 3. Fuel Consumption */}
      <Card className="hover:border-slate-800 transition-all duration-200">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Fuel className="w-4 h-4 text-orange-400" />
              3. Fuel Consumption
            </CardTitle>
            <span className="text-[11px] font-semibold text-orange-400/90 bg-orange-500/10 px-2 py-0.5 rounded-lg border border-orange-500/20">
              {fuelUnit}
            </span>
          </div>
          <CardDescription className="text-xs text-slate-400">
            Total volume of petrol refilled across monthly intervals
          </CardDescription>
        </CardHeader>
        <div className="p-4 sm:p-6 pt-0 h-64 w-full">
          {monthlyFuelConsumption.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyFuelConsumption} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={formatMonthTick}
                  tickMargin={6}
                />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}`} />
                <Tooltip
                  contentStyle={customTooltipStyle}
                  formatter={(value: any) => [`${value} ${fuelUnit}`, 'Refilled']}
                  labelFormatter={(l) => `Month: ${formatMonthTick(l)}`}
                />
                <Bar
                  dataKey="liters"
                  fill="#fb923c"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState
              icon={<Fuel className="w-5 h-5 text-orange-400" />}
              title="No Fuel Logs Found"
              description="Log your petrol pump refills to visualize consumption volumes and trends."
              actionLabel="Log Fuel Fill"
              onAction={() => onAddLog?.('fuel')}
            />
          )}
        </div>
      </Card>

      {/* 4. Fuel Expenditure */}
      <Card className="hover:border-slate-800 transition-all duration-200">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              4. Fuel Expenditure
            </CardTitle>
            <span className="text-[11px] font-semibold text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
              {currency}
            </span>
          </div>
          <CardDescription className="text-xs text-slate-400">
            Total money spent on petrol by billing month
          </CardDescription>
        </CardHeader>
        <div className="p-4 sm:p-6 pt-0 h-64 w-full">
          {monthlyFuelExpense.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyFuelExpense} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={formatMonthTick}
                  tickMargin={6}
                />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}`} />
                <Tooltip
                  contentStyle={customTooltipStyle}
                  formatter={(value: any) => [`${currency}${value}`, 'Fuel Spend']}
                  labelFormatter={(l) => `Billing Month: ${formatMonthTick(l)}`}
                />
                <Bar
                  dataKey="amount"
                  fill="#eab308"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState
              icon={<DollarSign className="w-5 h-5 text-amber-400" />}
              title="No Expenditure Data"
              description="Record fuel purchase receipts to view monthly petrol expenses."
              actionLabel="Add Fuel Receipt"
              onAction={() => onAddLog?.('fuel')}
            />
          )}
        </div>
      </Card>

      {/* 5. Petrol Price Trend */}
      <Card className="hover:border-slate-800 transition-all duration-200">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              5. Petrol Price Trend
            </CardTitle>
            <span className="text-[11px] font-semibold text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
              {currency}/{fuelUnit}
            </span>
          </div>
          <CardDescription className="text-xs text-slate-400">
            Unit fuel rate changes over time across fueling stations
          </CardDescription>
        </CardHeader>
        <div className="p-4 sm:p-6 pt-0 h-64 w-full">
          {petrolPriceTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={petrolPriceTrend} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={formatDateTick}
                  tickMargin={6}
                />
                <YAxis stroke="#64748b" fontSize={11} domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip
                  contentStyle={customTooltipStyle}
                  formatter={(value: any, _: any, item: any) => [
                    `${currency}${value} / ${fuelUnit} • ${item.payload.station}`,
                    'Pump Price',
                  ]}
                  labelFormatter={(l) => `Date: ${l}`}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981', stroke: '#0f172a', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState
              icon={<BarChart2 className="w-5 h-5 text-emerald-400" />}
              title="No Petrol Price History"
              description="Price per liter telemetry will appear here when fuel refills are saved."
              actionLabel="Record Price per Liter"
              onAction={() => onAddLog?.('fuel')}
            />
          )}
        </div>
      </Card>

      {/* 6. Cost Per Kilometer */}
      <Card className="hover:border-slate-800 transition-all duration-200">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-pink-400" />
              6. Cost Per Kilometer
            </CardTitle>
            <span className="text-[11px] font-semibold text-pink-400/90 bg-pink-500/10 px-2 py-0.5 rounded-lg border border-pink-500/20">
              {currency}/{distanceUnit}
            </span>
          </div>
          <CardDescription className="text-xs text-slate-400">
            Running fuel expenditure per unit distance traveled
          </CardDescription>
        </CardHeader>
        <div className="p-4 sm:p-6 pt-0 h-64 w-full">
          {costPerKmTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={costPerKmTrend} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={formatDateTick}
                  tickMargin={6}
                />
                <YAxis stroke="#64748b" fontSize={11} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                <Tooltip
                  contentStyle={customTooltipStyle}
                  formatter={(value: any) => [`${currency}${value} / ${distanceUnit}`, 'Running Cost']}
                  labelFormatter={(l) => `Refill Date: ${l}`}
                />
                <Line
                  type="monotone"
                  dataKey="costPerKm"
                  stroke="#ec4899"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#ec4899', stroke: '#0f172a', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#f472b6', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState
              icon={<DollarSign className="w-5 h-5 text-pink-400" />}
              title="No Cost/KM Data"
              description="Calculated from distance covered and fuel cost between verified full-tank refills."
              actionLabel="Add Fuel Fill"
              onAction={() => onAddLog?.('fuel')}
            />
          )}
        </div>
      </Card>

      {/* 7. Maintenance Expenses */}
      <Card className="hover:border-slate-800 transition-all duration-200">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-purple-400" />
              7. Maintenance Expenses
            </CardTitle>
            <span className="text-[11px] font-semibold text-purple-400/90 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
              {currency}
            </span>
          </div>
          <CardDescription className="text-xs text-slate-400">
            Periodic servicing, oil changes, parts replacements, and workshop costs
          </CardDescription>
        </CardHeader>
        <div className="p-4 sm:p-6 pt-0 h-64 w-full">
          {maintenanceExpenses.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintenanceExpenses} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={formatMonthTick}
                  tickMargin={6}
                />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}`} />
                <Tooltip
                  contentStyle={customTooltipStyle}
                  formatter={(value: any) => [`${currency}${value}`, 'Service Spend']}
                  labelFormatter={(l) => `Period: ${formatMonthTick(l)}`}
                />
                <Bar
                  dataKey="amount"
                  fill="#a855f7"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartState
              icon={<Wrench className="w-5 h-5 text-purple-400" />}
              title="No Maintenance Costs"
              description="Track engine oil, brake pads, chain maintenance, and general workshop servicing costs."
              actionLabel="Add Service Record"
              onAction={() => onAddLog?.('maintenance')}
            />
          )}
        </div>
      </Card>

      {/* 8. Total Expenses By Category (Bonus Comprehensive Breakdown) */}
      <Card className="hover:border-slate-800 transition-all duration-200">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-400" />
              Total Bike Expenditure Breakdown
            </CardTitle>
            <span className="text-[11px] font-semibold text-indigo-400/90 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
              Distribution
            </span>
          </div>
          <CardDescription className="text-xs text-slate-400">
            Share of spend across fuel, maintenance, insurance, parts & accessories
          </CardDescription>
        </CardHeader>
        <div className="p-4 sm:p-6 pt-0 h-64 w-full flex items-center justify-center">
          {totalExpensesByCategory.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center w-full h-full">
              <div className="w-full sm:w-1/2 h-44 sm:h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={totalExpensesByCategory}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={68}
                      innerRadius={40}
                      paddingAngle={3}
                    >
                      {totalExpensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={customTooltipStyle}
                      formatter={(value: any) => [`${currency}${value}`, 'Spend']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full sm:w-1/2 flex flex-col justify-center space-y-1 px-2 sm:px-4 overflow-y-auto max-h-48 text-xs">
                {totalExpensesByCategory.map((item) => (
                  <div key={item.category} className="flex items-center justify-between py-0.5">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-300 font-medium truncate">{item.category}</span>
                    </div>
                    <span className="text-slate-100 font-bold shrink-0">{currency}{item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyChartState
              icon={<PieIcon className="w-5 h-5 text-indigo-400" />}
              title="No Expenses Logged"
              description="Add your first fuel, maintenance, or gear expense to visualize category distributions."
              actionLabel="Add Expense"
              onAction={() => onAddLog?.('expense')}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
