'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/context';
import { Fuel, Gauge, DollarSign, Wrench, AlertCircle, CheckCircle2, Database } from 'lucide-react';
import { expenseCategories } from '@/lib/validations/expense';
import { maintenanceServiceTypes } from '@/lib/validations/maintenance';
import { syncManager } from '@/lib/offline/sync-manager';

interface QuickActionModalsProps {
  activeModal: 'fuel' | 'reading' | 'expense' | 'maintenance' | 'bike_wash' | 'chain_lube' | 'service' | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function QuickActionModals({ activeModal, onClose, onSuccess }: QuickActionModalsProps) {
  const { activeBike, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  // Today string YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  // ================= FUEL FORM STATE =================
  const [fuelData, setFuelData] = useState({
    date: today,
    time: new Date().toTimeString().substring(0, 5),
    odometer: activeBike?.currentOdometer || 0,
    fuelQuantity: 0,
    pricePerLiter: 0,
    totalAmount: 0,
    isFullTank: true,
    fuelStation: '',
    location: '',
    paymentMethod: 'UPI',
    notes: '',
  });

  // Calculate total amount on price/quantity change
  const handleFuelQuantityChange = (qty: number) => {
    const total = Number((qty * fuelData.pricePerLiter).toFixed(2));
    setFuelData((prev) => ({ ...prev, fuelQuantity: qty, totalAmount: total }));
  };

  const handlePricePerLiterChange = (price: number) => {
    const total = Number((fuelData.fuelQuantity * price).toFixed(2));
    setFuelData((prev) => ({ ...prev, pricePerLiter: price, totalAmount: total }));
  };

  const handleFuelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBike) return;
    setLoading(true);
    setError(null);
    setOfflineNotice(null);
    try {
      const res = await syncManager.submitAction({
        entityType: 'fuel',
        actionType: 'create',
        endpoint: '/api/fuel',
        method: 'POST',
        payload: {
          bikeId: activeBike.id,
          ...fuelData,
          odometer: Number(fuelData.odometer),
          fuelQuantity: Number(fuelData.fuelQuantity),
          pricePerLiter: Number(fuelData.pricePerLiter),
          totalAmount: Number(fuelData.totalAmount),
        },
        description: `Fuel Refill: ${fuelData.fuelQuantity}L @ ${user?.currency || '₹'}${fuelData.pricePerLiter}`,
        bikeId: activeBike.id,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to record fuel log');
      }

      onSuccess();
      if (res.offlineQueued) {
        setOfflineNotice(res.message);
        setTimeout(() => {
          setOfflineNotice(null);
          onClose();
        }, 1500);
      } else {
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving fuel refill');
    } finally {
      setLoading(false);
    }
  };

  // ================= READING FORM STATE =================
  const [readingData, setReadingData] = useState({
    date: today,
    odometer: activeBike?.currentOdometer || 0,
    notes: '',
    allowCorrection: false,
  });

  const handleReadingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBike) return;
    setLoading(true);
    setError(null);
    setOfflineNotice(null);
    try {
      const res = await syncManager.submitAction({
        entityType: 'reading',
        actionType: 'create',
        endpoint: '/api/readings',
        method: 'POST',
        payload: {
          bikeId: activeBike.id,
          ...readingData,
          odometer: Number(readingData.odometer),
        },
        description: `Odometer Reading: ${readingData.odometer} km`,
        bikeId: activeBike.id,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to record odometer reading');
      }

      onSuccess();
      if (res.offlineQueued) {
        setOfflineNotice(res.message);
        setTimeout(() => {
          setOfflineNotice(null);
          onClose();
        }, 1500);
      } else {
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving daily reading');
    } finally {
      setLoading(false);
    }
  };

  // ================= EXPENSE FORM STATE =================
  const [expenseData, setExpenseData] = useState({
    date: today,
    category: 'Cleaning',
    amount: 0,
    odometer: activeBike?.currentOdometer || 0,
    description: '',
    notes: '',
  });

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBike) return;
    setLoading(true);
    setError(null);
    setOfflineNotice(null);
    try {
      const res = await syncManager.submitAction({
        entityType: 'expense',
        actionType: 'create',
        endpoint: '/api/expenses',
        method: 'POST',
        payload: {
          bikeId: activeBike.id,
          ...expenseData,
          amount: Number(expenseData.amount),
          odometer: expenseData.odometer ? Number(expenseData.odometer) : undefined,
        },
        description: `Expense: ${expenseData.category} (${user?.currency || '₹'}${expenseData.amount})`,
        bikeId: activeBike.id,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to record expense');
      }

      onSuccess();
      if (res.offlineQueued) {
        setOfflineNotice(res.message);
        setTimeout(() => {
          setOfflineNotice(null);
          onClose();
        }, 1500);
      } else {
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving expense');
    } finally {
      setLoading(false);
    }
  };

  // ================= MAINTENANCE FORM STATE =================
  const [maintenanceData, setMaintenanceData] = useState({
    date: today,
    serviceType: 'Chain lubrication',
    odometer: activeBike?.currentOdometer || 0,
    amount: 0,
    workshop: '',
    description: '',
    nextDueDate: '',
    nextDueOdometer: activeBike?.currentOdometer || 0,
    notes: '',
    status: 'completed' as const,
  });

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBike) return;
    setLoading(true);
    setError(null);
    setOfflineNotice(null);
    try {
      const res = await syncManager.submitAction({
        entityType: 'maintenance',
        actionType: 'create',
        endpoint: '/api/maintenance',
        method: 'POST',
        payload: {
          bikeId: activeBike.id,
          ...maintenanceData,
          odometer: Number(maintenanceData.odometer),
          amount: Number(maintenanceData.amount),
          nextDueOdometer: maintenanceData.nextDueOdometer ? Number(maintenanceData.nextDueOdometer) : undefined,
        },
        description: `Maintenance: ${maintenanceData.serviceType} (${user?.currency || '₹'}${maintenanceData.amount})`,
        bikeId: activeBike.id,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to record maintenance');
      }

      onSuccess();
      if (res.offlineQueued) {
        setOfflineNotice(res.message);
        setTimeout(() => {
          setOfflineNotice(null);
          onClose();
        }, 1500);
      } else {
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving maintenance record');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeModal === 'bike_wash') {
      setExpenseData((prev) => ({
        ...prev,
        category: 'Cleaning',
        amount: 0,
        description: 'Bike Wash',
        odometer: activeBike?.currentOdometer || 0,
      }));
    } else if (activeModal === 'chain_lube') {
      setMaintenanceData((prev) => ({
        ...prev,
        serviceType: 'Chain lubrication',
        amount: 0,
        workshop: '',
        description: 'Chain lubrication',
        odometer: activeBike?.currentOdometer || 0,
        nextDueOdometer: activeBike?.currentOdometer || 0,
      }));
    } else if (activeModal === 'service') {
      setMaintenanceData((prev) => ({
        ...prev,
        serviceType: 'General service',
        amount: 0,
        workshop: '',
        description: 'General service',
        odometer: activeBike?.currentOdometer || 0,
        nextDueOdometer: activeBike?.currentOdometer || 0,
      }));
    }
  }, [activeModal, activeBike]);

  return (
    <>
      {/* 1. ADD FUEL MODAL */}
      <Dialog
        open={activeModal === 'fuel'}
        onOpenChange={(open) => !open && onClose()}
        title="Add Fuel Refill"
        description={`Record petrol fill for ${activeBike?.name || 'Motorcycle'}`}
      >
        <form onSubmit={handleFuelSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
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
                value={fuelData.date}
                onChange={(e) => setFuelData({ ...fuelData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Time</Label>
              <Input
                type="time"
                value={fuelData.time}
                onChange={(e) => setFuelData({ ...fuelData, time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label required>Odometer (KM)</Label>
            <Input
              type="number"
              value={fuelData.odometer}
              onChange={(e) => setFuelData({ ...fuelData, odometer: Number(e.target.value) })}
              placeholder="e.g. 8450"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Current bike odometer: <strong className="text-amber-400">{activeBike?.currentOdometer || 0} km</strong>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Fuel Quantity (L)</Label>
              <Input
                type="number"
                step="0.01"
                value={fuelData.fuelQuantity}
                onChange={(e) => handleFuelQuantityChange(Number(e.target.value))}
                placeholder="e.g. 10.5"
                required
              />
            </div>
            <div>
              <Label required>Price / Liter ({user?.currency || '₹'})</Label>
              <Input
                type="number"
                step="0.01"
                value={fuelData.pricePerLiter}
                onChange={(e) => handlePricePerLiterChange(Number(e.target.value))}
                placeholder="e.g. 96.72"
                required
              />
            </div>
          </div>

          <div>
            <Label required>Total Amount ({user?.currency || '₹'})</Label>
            <Input
              type="number"
              step="0.01"
              value={fuelData.totalAmount}
              onChange={(e) => setFuelData({ ...fuelData, totalAmount: Number(e.target.value) })}
              required
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <input
              type="checkbox"
              id="modal-fulltank"
              checked={fuelData.isFullTank}
              onChange={(e) => setFuelData({ ...fuelData, isFullTank: e.target.checked })}
              className="w-4 h-4 text-amber-500 rounded border-slate-700 bg-slate-900 focus:ring-amber-500"
            />
            <label htmlFor="modal-fulltank" className="text-xs font-semibold text-slate-200 cursor-pointer">
              Full Tank Refill (Recommended for accurate mileage calculation)
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fuel Station</Label>
              <Input
                value={fuelData.fuelStation}
                onChange={(e) => setFuelData({ ...fuelData, fuelStation: e.target.value })}
                placeholder="e.g. Indian Oil, Shell"
              />
            </div>
            <div>
              <Label>Payment Method</Label>
              <select
                value={fuelData.paymentMethod}
                onChange={(e) => setFuelData({ ...fuelData, paymentMethod: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
              >
                <option value="UPI">UPI / GPay / Paytm</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Input
              value={fuelData.notes}
              onChange={(e) => setFuelData({ ...fuelData, notes: e.target.value })}
              placeholder="e.g. Smooth engine idling, highway fuel"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} variant="primary">
              <Fuel className="w-4 h-4 mr-1.5" /> Save Fuel Log
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 2. ADD DAILY READING MODAL */}
      <Dialog
        open={activeModal === 'reading'}
        onOpenChange={(open) => !open && onClose()}
        title="Add Daily Reading"
        description="Quick odometer entry to track distance and remaining fuel"
      >
        <form onSubmit={handleReadingSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {offlineNotice && (
            <div className="flex items-center gap-2 p-3 text-xs bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-xl">
              <Database className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{offlineNotice}</span>
            </div>
          )}

          <div>
            <Label required>Date</Label>
            <Input
              type="date"
              value={readingData.date}
              onChange={(e) => setReadingData({ ...readingData, date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label required>Current Odometer (KM)</Label>
            <Input
              type="number"
              value={readingData.odometer}
              onChange={(e) => setReadingData({ ...readingData, odometer: Number(e.target.value) })}
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Previous odometer: <strong className="text-amber-400">{activeBike?.currentOdometer || 0} km</strong>
            </p>
          </div>

          <div>
            <Label>Riding Notes</Label>
            <Input
              value={readingData.notes}
              onChange={(e) => setReadingData({ ...readingData, notes: e.target.value })}
              placeholder="e.g. Daily commute, city traffic"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="reading-correction"
              checked={readingData.allowCorrection}
              onChange={(e) => setReadingData({ ...readingData, allowCorrection: e.target.checked })}
              className="w-4 h-4 text-amber-500 rounded border-slate-700 bg-slate-900"
            />
            <label htmlFor="reading-correction" className="text-xs text-slate-400 cursor-pointer">
              Enable Odometer Correction Workflow (allows decreasing odometer if cluster replaced)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} variant="primary">
              <Gauge className="w-4 h-4 mr-1.5" /> Save Reading
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 3. ADD EXPENSE / BIKE WASH MODAL */}
      <Dialog
        open={activeModal === 'expense' || activeModal === 'bike_wash'}
        onOpenChange={(open) => !open && onClose()}
        title={activeModal === 'bike_wash' ? 'Record Bike Wash' : 'Add Expense'}
        description={
          activeModal === 'bike_wash'
            ? 'Log motorcycle water/foam wash, detailing, or polishing'
            : 'Record motorcycle expenses like insurance, accessories, cleaning'
        }
      >
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
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
              <Label required>Category</Label>
              <select
                value={expenseData.category}
                onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
              >
                {expenseCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label required>Amount ({user?.currency || '₹'})</Label>
              <Input
                type="number"
                step="0.01"
                value={expenseData.amount}
                onChange={(e) => setExpenseData({ ...expenseData, amount: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Date</Label>
              <Input
                type="date"
                value={expenseData.date}
                onChange={(e) => setExpenseData({ ...expenseData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Odometer (KM)</Label>
              <Input
                type="number"
                value={expenseData.odometer}
                onChange={(e) => setExpenseData({ ...expenseData, odometer: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label required>Description</Label>
            <Input
              value={expenseData.description}
              onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
              placeholder="e.g. Teflon polish, crash guard rope"
              required
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Input
              value={expenseData.notes}
              onChange={(e) => setExpenseData({ ...expenseData, notes: e.target.value })}
              placeholder="Additional notes"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} variant="primary">
              <DollarSign className="w-4 h-4 mr-1.5" /> Save Expense
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 4. ADD MAINTENANCE / CHAIN LUBE / SERVICE MODAL */}
      <Dialog
        open={activeModal === 'maintenance' || activeModal === 'chain_lube' || activeModal === 'service'}
        onOpenChange={(open) => !open && onClose()}
        title={
          activeModal === 'chain_lube'
            ? 'Record Chain Lubrication'
            : activeModal === 'service'
            ? 'Record Motorcycle Service'
            : 'Add Maintenance Record'
        }
        description={
          activeModal === 'chain_lube'
            ? 'Track chain degreasing, cleaning, and lubrication interval'
            : activeModal === 'service'
            ? 'Record periodic general service or oil & filter maintenance'
            : 'Track engine oil, chain maintenance, brake services'
        }
      >
        <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
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
              <Label required>Service Type</Label>
              <select
                value={maintenanceData.serviceType}
                onChange={(e) => setMaintenanceData({ ...maintenanceData, serviceType: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
              >
                {maintenanceServiceTypes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label required>Cost ({user?.currency || '₹'})</Label>
              <Input
                type="number"
                value={maintenanceData.amount}
                onChange={(e) => setMaintenanceData({ ...maintenanceData, amount: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Date</Label>
              <Input
                type="date"
                value={maintenanceData.date}
                onChange={(e) => setMaintenanceData({ ...maintenanceData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label required>Odometer (KM)</Label>
              <Input
                type="number"
                value={maintenanceData.odometer}
                onChange={(e) => setMaintenanceData({ ...maintenanceData, odometer: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div>
            <Label required>Description / Parts Replaced</Label>
            <Input
              value={maintenanceData.description}
              onChange={(e) => setMaintenanceData({ ...maintenanceData, description: e.target.value })}
              placeholder="e.g. Motul 7100 15W50 synthetic oil, genuine oil filter"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Workshop / Mechanic</Label>
              <Input
                value={maintenanceData.workshop}
                onChange={(e) => setMaintenanceData({ ...maintenanceData, workshop: e.target.value })}
                placeholder="e.g. RE Authorized Service"
              />
            </div>
            <div>
              <Label>Next Due Odometer (KM)</Label>
              <Input
                type="number"
                value={maintenanceData.nextDueOdometer || ''}
                onChange={(e) =>
                  setMaintenanceData({ ...maintenanceData, nextDueOdometer: Number(e.target.value) })
                }
                placeholder="e.g. 10000"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} variant="primary">
              <Wrench className="w-4 h-4 mr-1.5" /> Save Maintenance
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
