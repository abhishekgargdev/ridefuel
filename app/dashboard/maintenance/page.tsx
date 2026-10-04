'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/context';
import type { MaintenanceRecord, MaintenanceServiceType } from '@/types';
import { maintenanceServiceTypes } from '@/lib/validations/maintenance';
import {
  Wrench,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export default function MaintenancePage() {
  const { activeBike, user } = useAuth();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const currency = user?.currency || '₹';
  const distanceUnit = user?.distanceUnit || 'km';

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    serviceType: 'Chain lubrication' as MaintenanceServiceType,
    odometer: 8450,
    amount: 300,
    workshop: 'Local Garage / DIY',
    description: '',
    nextDueDate: '',
    nextDueOdometer: 8950,
    notes: '',
    status: 'completed' as 'completed' | 'upcoming' | 'overdue',
  });

  const fetchRecords = useCallback(async () => {
    if (!activeBike) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/maintenance?bikeId=${activeBike.id}`);
      const json = await res.json();
      if (json.success) {
        setRecords(json.data || []);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, [activeBike]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const openAddModal = () => {
    setEditingRecord(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      serviceType: 'Chain lubrication',
      odometer: activeBike?.currentOdometer || 8450,
      amount: 250,
      workshop: '',
      description: '',
      nextDueDate: '',
      nextDueOdometer: (activeBike?.currentOdometer || 8450) + 500,
      notes: '',
      status: 'completed',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (rec: MaintenanceRecord) => {
    setEditingRecord(rec);
    setFormData({
      date: rec.date,
      serviceType: rec.serviceType,
      odometer: rec.odometer,
      amount: rec.amount,
      workshop: rec.workshop || '',
      description: rec.description,
      nextDueDate: rec.nextDueDate || '',
      nextDueOdometer: rec.nextDueOdometer || 0,
      notes: rec.notes || '',
      status: rec.status || 'completed',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBike) return;
    setFormError(null);

    try {
      const url = editingRecord ? `/api/maintenance/${editingRecord.id}` : '/api/maintenance';
      const method = editingRecord ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bikeId: activeBike.id,
          ...formData,
          amount: Number(formData.amount),
          odometer: Number(formData.odometer),
          nextDueOdometer: formData.nextDueOdometer ? Number(formData.nextDueOdometer) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save maintenance record');
      }

      await fetchRecords();
      setModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error submitting maintenance record');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maintenance record?')) return;
    try {
      const res = await fetch(`/api/maintenance/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchRecords();
      }
    } catch (e) {
      alert('Failed to delete record');
    }
  };

  // Group into upcoming, overdue, and completed
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentOdometer = activeBike?.currentOdometer || 0;

  const overdueList = records.filter(
    (r) =>
      (r.nextDueDate && r.nextDueDate < todayStr) ||
      (r.nextDueOdometer && r.nextDueOdometer <= currentOdometer)
  );

  const upcomingList = records.filter(
    (r) =>
      (r.nextDueDate && r.nextDueDate >= todayStr) ||
      (r.nextDueOdometer && r.nextDueOdometer > currentOdometer)
  );

  const completedList = records.filter((r) => r.status === 'completed');
  const totalMaintenanceCost = completedList.reduce((acc, r) => acc + r.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <Wrench className="w-7 h-7 text-amber-400" />
            Maintenance & Service Tracker
          </h1>
          <p className="text-xs text-slate-400">
            Monitor upcoming service schedules, chain lubing routines, and historical maintenance for {activeBike?.name}
          </p>
        </div>
        <Button onClick={openAddModal} variant="primary">
          <Plus className="w-4 h-4 mr-2" /> Log Maintenance Event
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 border-rose-500/30 bg-rose-500/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">
            Overdue Maintenance
          </span>
          <span className="text-2xl font-black text-rose-400">{overdueList.length}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Requires immediate service</span>
        </Card>

        <Card className="p-4 border-amber-500/30 bg-amber-500/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
            Upcoming Due
          </span>
          <span className="text-2xl font-black text-amber-400">{upcomingList.length}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Scheduled checkpoints</span>
        </Card>

        <Card className="p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Completed Services
          </span>
          <span className="text-2xl font-black text-emerald-400">{completedList.length}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Lifetime service jobs</span>
        </Card>

        <Card className="p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Maintenance Cost
          </span>
          <span className="text-2xl font-black text-slate-100">{currency}{totalMaintenanceCost.toLocaleString()}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Parts & labour spent</span>
        </Card>
      </div>

      {/* Overdue Alerts Section */}
      {overdueList.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Overdue Inspection / Service Required
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overdueList.map((item) => (
              <Card key={`overdue-${item.id}`} className="border-rose-500/50 bg-rose-500/10 p-4">
                <div className="flex items-center justify-between pb-1">
                  <span className="font-bold text-slate-100 text-sm">{item.serviceType}</span>
                  <Badge variant="danger">OVERDUE</Badge>
                </div>
                <p className="text-xs text-slate-300 mt-1">{item.description}</p>
                <div className="text-[11px] text-rose-300 font-semibold mt-2">
                  Due: {item.nextDueDate || `${item.nextDueOdometer} ${distanceUnit}`} (Current: {currentOdometer} {distanceUnit})
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Section */}
      {upcomingList.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Upcoming Maintenance Milestones
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcomingList.map((item) => (
              <Card key={`upcoming-${item.id}`} className="p-4">
                <div className="flex items-center justify-between pb-1">
                  <span className="font-bold text-slate-100 text-sm">{item.serviceType}</span>
                  <Badge variant="amber">UPCOMING</Badge>
                </div>
                <p className="text-xs text-slate-300 mt-1">{item.description}</p>
                <div className="text-[11px] text-amber-400 font-semibold mt-2">
                  Due: {item.nextDueDate ? `${item.nextDueDate}` : ''}
                  {item.nextDueOdometer ? ` @ ${item.nextDueOdometer.toLocaleString()} ${distanceUnit} (${item.nextDueOdometer - currentOdometer} ${distanceUnit} remaining)` : ''}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Maintenance History Log */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Historical Maintenance Log
        </h2>

        {records.length === 0 ? (
          <Card className="text-center py-12">
            <Wrench className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-200">No Maintenance Records</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Track oil changes, chain adjustments, and scheduled service appointments.
            </p>
            <Button onClick={openAddModal} variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Log First Service
            </Button>
          </Card>
        ) : (
          records.map((rec) => (
            <Card key={rec.id} className="hover:border-slate-700 transition">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 font-bold">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-slate-100">{rec.serviceType}</span>
                      <span className="text-xs text-slate-400">@ {rec.odometer.toLocaleString()} {distanceUnit}</span>
                      {rec.workshop && (
                        <Badge variant="outline">{rec.workshop}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{rec.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" /> {rec.date}
                      </span>
                      {rec.nextDueOdometer ? (
                        <span className="text-amber-400 font-medium">
                          Next due @ {rec.nextDueOdometer.toLocaleString()} {distanceUnit}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-slate-100">
                    {currency}{rec.amount.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(rec)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rec.id)}
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

      {/* Add / Edit Maintenance Dialog */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => setModalOpen(open)}
        title={editingRecord ? 'Edit Maintenance Record' : 'Log Maintenance Event'}
        description={`Track service for ${activeBike?.name}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Service Type</Label>
              <select
                value={formData.serviceType}
                onChange={(e) =>
                  setFormData({ ...formData, serviceType: e.target.value as MaintenanceServiceType })
                }
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
              <Label required>Cost ({currency})</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                required
              />
            </div>
          </div>

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
              <Label required>Odometer ({distanceUnit})</Label>
              <Input
                type="number"
                value={formData.odometer}
                onChange={(e) => setFormData({ ...formData, odometer: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div>
            <Label required>Description / Work Done</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Semi-synthetic Motul 15W50, oil filter, chain tension adjustment"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Workshop / Service Center</Label>
              <Input
                value={formData.workshop}
                onChange={(e) => setFormData({ ...formData, workshop: e.target.value })}
                placeholder="RE Authorized, Local Mechanic, DIY"
              />
            </div>
            <div>
              <Label>Next Due Odometer ({distanceUnit})</Label>
              <Input
                type="number"
                value={formData.nextDueOdometer}
                onChange={(e) => setFormData({ ...formData, nextDueOdometer: Number(e.target.value) })}
                placeholder="e.g. 10000"
              />
            </div>
          </div>

          <div>
            <Label>Next Due Date (Optional)</Label>
            <Input
              type="date"
              value={formData.nextDueDate}
              onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingRecord ? 'Update Record' : 'Save Maintenance'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
