'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/context';
import type { FuelLog } from '@/types';
import { Fuel, Plus, Edit2, Trash2, MapPin, CreditCard, AlertCircle, Info, TrendingUp, Database, WifiOff } from 'lucide-react';
import { ListSkeleton } from '@/components/ui/page-skeleton';
import { EmptyBikeState } from '@/components/dashboard/empty-bike-state';
import { syncManager } from '@/lib/offline/sync-manager';
import { OfflineDataCache } from '@/lib/offline/offline-cache';

export default function FuelLogsPage() {
  const { activeBike, user } = useAuth();
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCachedData, setIsCachedData] = useState(false);
  const [cachedTime, setCachedTime] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<FuelLog | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  const currency = user?.currency || '₹';
  const distanceUnit = user?.distanceUnit || 'km';
  const fuelUnit = user?.fuelUnit === 'gallons' ? 'gal' : 'L';

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    odometer: 8500,
    fuelQuantity: 10.0,
    pricePerLiter: 96.72,
    totalAmount: 967.2,
    isFullTank: true,
    fuelStation: 'Indian Oil',
    location: '',
    paymentMethod: 'UPI',
    notes: '',
  });

  const fetchLogs = useCallback(async () => {
    if (!activeBike) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await OfflineDataCache.fetchWithCache<FuelLog[]>(
        `/api/fuel?bikeId=${activeBike.id}`,
        `fuel_logs_${activeBike.id}`
      );
      if (result.data) {
        setLogs(result.data);
        setIsCachedData(result.isCached);
        if (result.cachedAt) {
          setCachedTime(new Date(result.cachedAt).toLocaleTimeString());
        } else {
          setCachedTime(null);
        }
      }
    } catch (e) {
      console.warn('Error fetching fuel logs:', e);
    } finally {
      setLoading(false);
    }
  }, [activeBike]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const openAddModal = () => {
    setEditingLog(null);
    const lastOdo = logs.length > 0 ? logs[0].odometer + 300 : activeBike?.currentOdometer || 8450;
    setFormData({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().substring(0, 5),
      odometer: lastOdo,
      fuelQuantity: 10.0,
      pricePerLiter: 96.72,
      totalAmount: 967.2,
      isFullTank: true,
      fuelStation: 'Indian Oil',
      location: '',
      paymentMethod: 'UPI',
      notes: '',
    });
    setFormError(null);
    setOfflineNotice(null);
    setModalOpen(true);
  };

  const openEditModal = (log: FuelLog) => {
    setEditingLog(log);
    setFormData({
      date: log.date,
      time: log.time || '10:00',
      odometer: log.odometer,
      fuelQuantity: log.fuelQuantity,
      pricePerLiter: log.pricePerLiter,
      totalAmount: log.totalAmount,
      isFullTank: log.isFullTank,
      fuelStation: log.fuelStation || '',
      location: log.location || '',
      paymentMethod: log.paymentMethod || 'UPI',
      notes: log.notes || '',
    });
    setFormError(null);
    setOfflineNotice(null);
    setModalOpen(true);
  };

  const handleQuantityChange = (qty: number) => {
    const total = Number((qty * formData.pricePerLiter).toFixed(2));
    setFormData((prev) => ({ ...prev, fuelQuantity: qty, totalAmount: total }));
  };

  const handlePriceChange = (price: number) => {
    const total = Number((formData.fuelQuantity * price).toFixed(2));
    setFormData((prev) => ({ ...prev, pricePerLiter: price, totalAmount: total }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBike) return;
    setFormError(null);
    setOfflineNotice(null);

    try {
      const url = editingLog ? `/api/fuel/${editingLog.id}` : '/api/fuel';
      const method = editingLog ? 'PUT' : 'POST';

      const res = await syncManager.submitAction({
        entityType: 'fuel',
        actionType: editingLog ? 'update' : 'create',
        endpoint: url,
        method,
        payload: {
          bikeId: activeBike.id,
          ...formData,
          odometer: Number(formData.odometer),
          fuelQuantity: Number(formData.fuelQuantity),
          pricePerLiter: Number(formData.pricePerLiter),
          totalAmount: Number(formData.totalAmount),
        },
        description: `Fuel refill: ${formData.fuelQuantity}L (${formData.isFullTank ? 'Full Tank' : 'Partial'})`,
        bikeId: activeBike.id,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to save fuel log');
      }

      if (res.offlineQueued) {
        setOfflineNotice(res.message);
        setTimeout(() => {
          setOfflineNotice(null);
          setModalOpen(false);
        }, 1500);
      } else {
        await fetchLogs();
        setModalOpen(false);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error submitting fuel log');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fuel refill record?')) return;
    try {
      const res = await fetch(`/api/fuel/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchLogs();
      }
    } catch (e) {
      alert('Failed to delete fuel log');
    }
  };

  // Summary figures
  const totalLiters = logs.reduce((acc, l) => acc + l.fuelQuantity, 0);
  const totalSpend = logs.reduce((acc, l) => acc + l.totalAmount, 0);
  const fullTanksCount = logs.filter((l) => l.isFullTank).length;

  if (!activeBike) {
    return <EmptyBikeState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <Fuel className="w-7 h-7 text-amber-400" />
            Fuel Refill Logs
          </h1>
          <p className="text-xs text-slate-400">
            Track fill-ups, petrol expenses, and full-tank mileage calculations for {activeBike?.name}
          </p>
        </div>
        <Button onClick={openAddModal} variant="primary">
          <Plus className="w-4 h-4 mr-2" /> Record Fuel Refill
        </Button>
      </div>

      {/* Offline Cached Data Banner */}
      {isCachedData && (
        <div className="flex items-center gap-2 p-3 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Showing cached fuel logs {cachedTime ? `(saved at ${cachedTime})` : ''}. Connect to the internet for live sync.</span>
        </div>
      )}

      {/* Metric Quick Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Refills</span>
          <span className="text-xl font-bold text-slate-100">{logs.length}</span>
          <span className="text-[11px] text-amber-400 block mt-0.5">{fullTanksCount} Full Tanks</span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Volume</span>
          <span className="text-xl font-bold text-amber-400">{totalLiters.toFixed(1)} {fuelUnit}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Refilled to date</span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Fuel Spend</span>
          <span className="text-xl font-bold text-slate-100">{currency}{totalSpend.toLocaleString()}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Petrol expense</span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Average Refill</span>
          <span className="text-xl font-bold text-emerald-400">
            {logs.length > 0 ? (totalLiters / logs.length).toFixed(1) : 0} {fuelUnit}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Per station visit</span>
        </Card>
      </div>

      {/* Fuel Logs List */}
      <div className="space-y-3">
        {loading ? (
          <ListSkeleton count={3} height="h-28" />
        ) : logs.length === 0 ? (
          <Card className="text-center py-12">
            <Fuel className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-200">No Fuel Logs Recorded Yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Add your first fuel fill-up to begin calculating fuel consumption, range, and mileage.
            </p>
            <Button onClick={openAddModal} variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add First Refill
            </Button>
          </Card>
        ) : (
          logs.map((log) => (
            <Card key={log.id} className="hover:border-slate-700 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left: Refill details */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 font-bold">
                    <Fuel className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-slate-100">{log.fuelQuantity} {fuelUnit}</span>
                      <span className="text-xs text-slate-400">@ {currency}{log.pricePerLiter}/{fuelUnit}</span>
                      {log.isFullTank ? (
                        <Badge variant="amber">FULL TANK</Badge>
                      ) : (
                        <Badge variant="outline">PARTIAL FILL</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <span>{log.date} {log.time && `• ${log.time}`}</span>
                      <span>Odometer: <strong className="text-slate-200">{log.odometer.toLocaleString()} {distanceUnit}</strong></span>
                      {log.fuelStation && (
                        <span className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3 h-3 text-amber-400" /> {log.fuelStation}
                        </span>
                      )}
                    </div>

                    {log.notes && (
                      <p className="text-[11px] text-slate-400 italic">&ldquo;{log.notes}&rdquo;</p>
                    )}
                  </div>
                </div>

                {/* Right: Calculated Metrics & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                  <div className="text-left sm:text-right">
                    <div className="text-lg font-black text-slate-100">
                      {currency}{log.totalAmount.toLocaleString()}
                    </div>
                    {/* Calculated Mileage or Insufficient Data */}
                    <div className="text-xs mt-0.5">
                      {log.estimatedMileage ? (
                        <span className="font-bold text-emerald-400 flex items-center sm:justify-end gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {log.estimatedMileage} {distanceUnit}/{fuelUnit}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic" title="Full-tank to full-tank records needed">
                          Not enough data to calculate mileage.
                        </span>
                      )}
                    </div>
                    {log.costPerKm && (
                      <div className="text-[10px] text-slate-400">
                        {currency}{log.costPerKm} / {distanceUnit}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(log)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add / Edit Fuel Log Dialog */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => setModalOpen(open)}
        title={editingLog ? 'Edit Fuel Refill' : 'Record Fuel Refill'}
        description={`Logging fuel for ${activeBike?.name}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {offlineNotice && (
            <div className="flex items-center gap-2 p-3 text-xs bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-xl">
              <Database className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{offlineNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Time</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label required>Odometer Reading (KM)</Label>
            <Input
              type="number"
              value={formData.odometer}
              onChange={(e) => setFormData({ ...formData, odometer: Number(e.target.value) })}
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Current bike odometer: <strong className="text-amber-400">{activeBike?.currentOdometer || 0} km</strong>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Fuel Quantity ({fuelUnit})</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.fuelQuantity}
                onChange={(e) => handleQuantityChange(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <Label required>Price / {fuelUnit} ({currency})</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.pricePerLiter}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div>
            <Label required>Total Amount ({currency})</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.totalAmount}
              onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
              required
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <input
              type="checkbox"
              id="page-fulltank"
              checked={formData.isFullTank}
              onChange={(e) => setFormData({ ...formData, isFullTank: e.target.checked })}
              className="w-4 h-4 text-amber-500 rounded border-slate-700 bg-slate-900 focus:ring-amber-500"
            />
            <label htmlFor="page-fulltank" className="text-xs font-semibold text-slate-200 cursor-pointer">
              Full Tank Fill (Enables accurate mileage calculation between full tanks)
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fuel Station</Label>
              <Input
                value={formData.fuelStation}
                onChange={(e) => setFormData({ ...formData, fuelStation: e.target.value })}
                placeholder="Indian Oil, BPCL, Shell"
              />
            </div>
            <div>
              <Label>Payment Method</Label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
              >
                <option value="UPI">UPI / GPay</option>
                <option value="Card">Card</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Highway cruise fill, XP95 high octane"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingLog ? 'Update Refill Log' : 'Save Refill Log'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
