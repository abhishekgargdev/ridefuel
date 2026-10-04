'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/context';
import type { DailyReading } from '@/types';
import { Gauge, Plus, Edit2, Trash2, AlertCircle, Compass, Calendar } from 'lucide-react';

export default function DailyReadingsPage() {
  const { activeBike, user } = useAuth();
  const [readings, setReadings] = useState<DailyReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<DailyReading | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const distanceUnit = user?.distanceUnit || 'km';

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    odometer: 8485,
    notes: 'End of day riding reading',
    allowCorrection: false,
  });

  const fetchReadings = useCallback(async () => {
    if (!activeBike) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/readings?bikeId=${activeBike.id}`);
      const json = await res.json();
      if (json.success) {
        setReadings(json.data || []);
      }
    } catch (e) {
      console.warn('Error fetching daily readings:', e);
    } finally {
      setLoading(false);
    }
  }, [activeBike]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  const openAddModal = () => {
    setEditingReading(null);
    const lastOdo = readings.length > 0 ? readings[0].odometer + 35 : activeBike?.currentOdometer || 8450;
    setFormData({
      date: new Date().toISOString().split('T')[0],
      odometer: lastOdo,
      notes: '',
      allowCorrection: false,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (reading: DailyReading) => {
    setEditingReading(reading);
    setFormData({
      date: reading.date,
      odometer: reading.odometer,
      notes: reading.notes || '',
      allowCorrection: true,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBike) return;
    setFormError(null);

    try {
      const url = editingReading ? `/api/readings/${editingReading.id}` : '/api/readings';
      const method = editingReading ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bikeId: activeBike.id,
          ...formData,
          odometer: Number(formData.odometer),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save daily reading');
      }

      await fetchReadings();
      setModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error submitting reading');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this odometer reading?')) return;
    try {
      const res = await fetch(`/api/readings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchReadings();
      }
    } catch (e) {
      alert('Failed to delete reading');
    }
  };

  const totalLoggedDistance = readings.reduce((acc, r) => acc + (r.distance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <Gauge className="w-7 h-7 text-sky-400" />
            Daily Odometer Readings
          </h1>
          <p className="text-xs text-slate-400">
            Log your daily speedometer reading to track trip distances and remaining fuel consumption
          </p>
        </div>
        <Button onClick={openAddModal} variant="primary">
          <Plus className="w-4 h-4 mr-2" /> Log Daily Reading
        </Button>
      </div>

      {/* Metrics Quick Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Logs</span>
          <span className="text-xl font-bold text-slate-100">{readings.length}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Daily checkpoints</span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Logged Distance</span>
          <span className="text-xl font-bold text-sky-400">+{totalLoggedDistance.toLocaleString()} {distanceUnit}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Sum of daily rides</span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Current Odometer</span>
          <span className="text-xl font-bold text-amber-400">
            {readings.length > 0 ? readings[0].odometer.toLocaleString() : activeBike?.currentOdometer.toLocaleString()}{' '}
            {distanceUnit}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Latest verified reading</span>
        </Card>
      </div>

      {/* Readings List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            <Card className="h-20 animate-pulse" />
            <Card className="h-20 animate-pulse" />
          </div>
        ) : readings.length === 0 ? (
          <Card className="text-center py-12">
            <Gauge className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-200">No Daily Readings Yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Enter your odometer reading at the end of each ride to calculate daily trip distances accurately.
            </p>
            <Button onClick={openAddModal} variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Log First Reading
            </Button>
          </Card>
        ) : (
          readings.map((reading) => (
            <Card key={reading.id} className="hover:border-slate-700 transition">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 font-bold">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-100">
                        {reading.odometer.toLocaleString()} {distanceUnit}
                      </span>
                      {reading.distance !== undefined && reading.distance > 0 && (
                        <Badge variant="success">+{reading.distance} {distanceUnit}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" /> {reading.date}
                      </span>
                      {reading.notes && (
                        <span className="italic text-slate-400">&ldquo;{reading.notes}&rdquo;</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(reading)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(reading.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add / Edit Daily Reading Dialog */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => setModalOpen(open)}
        title={editingReading ? 'Edit Reading' : 'Log Daily Odometer Reading'}
        description={`Record distance for ${activeBike?.name}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

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
            <Label required>Odometer Reading ({distanceUnit})</Label>
            <Input
              type="number"
              value={formData.odometer}
              onChange={(e) => setFormData({ ...formData, odometer: Number(e.target.value) })}
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Previous odometer: <strong className="text-amber-400">{readings.length > 0 ? readings[0].odometer : activeBike?.currentOdometer} {distanceUnit}</strong>
            </p>
          </div>

          <div>
            <Label>Riding Notes</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Highway cruise, heavy rain ride"
            />
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl border border-slate-800 bg-slate-950">
            <input
              type="checkbox"
              id="dialog-correction"
              checked={formData.allowCorrection}
              onChange={(e) => setFormData({ ...formData, allowCorrection: e.target.checked })}
              className="w-4 h-4 text-amber-500 rounded border-slate-700 bg-slate-900"
            />
            <label htmlFor="dialog-correction" className="text-xs text-slate-300 cursor-pointer">
              Enable Odometer Correction Workflow (permits decreasing odometer in case of cluster replacement or error correction)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingReading ? 'Update Reading' : 'Save Reading'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
