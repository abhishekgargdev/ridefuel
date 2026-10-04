'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth/context';
import { FileText, Calendar, DollarSign, Fuel, Wrench, Download, Printer } from 'lucide-react';

interface ReportRow {
  month?: string;
  year?: string;
  distance: number;
  fuelLiters: number;
  fuelCost: number;
  maintenanceCost: number;
  otherExpenses: number;
  totalCost: number;
  refillCount: number;
  costPerKm: number | null;
}

export default function ReportsPage() {
  const { activeBike, user } = useAuth();
  const [tab, setTab] = useState<'monthly' | 'yearly'>('monthly');
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const currency = user?.currency || '₹';
  const distanceUnit = user?.distanceUnit || 'km';
  const fuelUnit = user?.fuelUnit === 'gallons' ? 'gal' : 'L';

  useEffect(() => {
    if (!activeBike) return;
    setLoading(true);
    const endpoint = tab === 'monthly' ? '/api/reports/monthly' : '/api/reports/yearly';
    fetch(`${endpoint}?bikeId=${activeBike.id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setReports(json.data.reports || []);
        }
      })
      .finally(() => setLoading(false));
  }, [activeBike, tab]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <FileText className="w-7 h-7 text-amber-400" />
            Executive Telemetry & Financial Reports
          </h1>
          <p className="text-xs text-slate-400">
            Consolidated statements of fuel, distance, maintenance, and running cost for {activeBike?.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'monthly' | 'yearly')}>
            <TabsList>
              <TabsTrigger value="monthly" activeValue={tab} onClick={() => setTab('monthly')}>
                Monthly Summary
              </TabsTrigger>
              <TabsTrigger value="yearly" activeValue={tab} onClick={() => setTab('yearly')}>
                Yearly Summary
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button size="sm" variant="secondary" onClick={handlePrint} className="hidden sm:inline-flex">
            <Printer className="w-3.5 h-3.5 mr-1" /> Print Report
          </Button>
        </div>
      </div>

      {/* Reports Table Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-800 flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">
              {tab === 'monthly' ? 'Monthly Operational Statement' : 'Yearly Consolidated Statement'}
            </CardTitle>
            <p className="text-xs text-slate-400">
              Complete cost-per-kilometer breakdown and expense distribution
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {reports.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No report statements generated yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">{tab === 'monthly' ? 'Month' : 'Year'}</th>
                  <th className="p-3.5">Distance</th>
                  <th className="p-3.5">Fuel Volume</th>
                  <th className="p-3.5">Fuel Spend</th>
                  <th className="p-3.5">Service Spend</th>
                  <th className="p-3.5">Other Expenses</th>
                  <th className="p-3.5">Total Cost</th>
                  <th className="p-3.5">Cost / {distanceUnit}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {reports.map((row) => (
                  <tr key={row.month || row.year} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-slate-100">{row.month || row.year}</td>
                    <td className="p-3.5 font-semibold text-slate-200">
                      {row.distance.toLocaleString()} {distanceUnit}
                    </td>
                    <td className="p-3.5 text-amber-400 font-medium">
                      {row.fuelLiters} {fuelUnit} ({row.refillCount} fills)
                    </td>
                    <td className="p-3.5 font-semibold text-slate-200">{currency}{row.fuelCost.toLocaleString()}</td>
                    <td className="p-3.5 text-slate-300">{currency}{row.maintenanceCost.toLocaleString()}</td>
                    <td className="p-3.5 text-slate-400">{currency}{row.otherExpenses.toLocaleString()}</td>
                    <td className="p-3.5 font-black text-slate-100 text-sm">
                      {currency}{row.totalCost.toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      {row.costPerKm ? (
                        <span className="font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                          {currency}{row.costPerKm} / {distanceUnit}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
