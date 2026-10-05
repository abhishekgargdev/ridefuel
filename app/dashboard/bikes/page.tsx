'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Input, Label } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/context';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import type { Bike } from '@/types';
import { Bike as BikeIcon, Plus, Check, Edit2, Trash2, Fuel, Gauge, AlertCircle } from 'lucide-react';

export default function BikesPage() {
  const { bikes, activeBike, switchActiveBike, refreshUserData, user, loading: authLoading } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBike, setEditingBike] = useState<Bike | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    model: '',
    variant: '',
    year: '' as string | number,
    registrationNumber: '',
    initialOdometer: '' as string | number,
    currentOdometer: '' as string | number,
    tankCapacity: '' as string | number,
    reserveCapacity: '' as string | number,
    expectedMileage: '' as string | number,
    isActive: true,
    notes: '',
  });

  const openAddModal = () => {
    setEditingBike(null);
    setFormData({
      name: '',
      manufacturer: '',
      model: '',
      variant: '',
      year: '',
      registrationNumber: '',
      initialOdometer: '',
      currentOdometer: '',
      tankCapacity: '',
      reserveCapacity: '',
      expectedMileage: '',
      isActive: bikes.length === 0,
      notes: '',
    });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (bike: Bike) => {
    setEditingBike(bike);
    setFormData({
      name: bike.name,
      manufacturer: bike.manufacturer,
      model: bike.model,
      variant: bike.variant || '',
      year: bike.year,
      registrationNumber: bike.registrationNumber || '',
      initialOdometer: bike.initialOdometer,
      currentOdometer: bike.currentOdometer,
      tankCapacity: bike.tankCapacity,
      reserveCapacity: bike.reserveCapacity || '',
      expectedMileage: bike.expectedMileage,
      isActive: bike.isActive,
      notes: bike.notes || '',
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = editingBike ? `/api/bikes/${editingBike.id}` : '/api/bikes';
      const method = editingBike ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          year: Number(formData.year) || new Date().getFullYear(),
          initialOdometer: Number(formData.initialOdometer) || 0,
          currentOdometer: Number(formData.currentOdometer) || 0,
          tankCapacity: Number(formData.tankCapacity),
          reserveCapacity: formData.reserveCapacity !== '' ? Number(formData.reserveCapacity) : undefined,
          expectedMileage: Number(formData.expectedMileage),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save motorcycle');
      }

      await refreshUserData();
      setModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving motorcycle');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bikeId: string) => {
    if (bikes.length <= 1) {
      alert('You must have at least one motorcycle.');
      return;
    }
    if (!confirm('Are you sure you want to delete this bike? This will remove associated fuel logs and readings.')) {
      return;
    }

    try {
      const res = await fetch(`/api/bikes/${bikeId}`, { method: 'DELETE' });
      if (res.ok) {
        await refreshUserData();
      }
    } catch (e) {
      alert('Failed to delete bike');
    }
  };

  if (authLoading) {
    return <PageSkeleton variant="list" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <BikeIcon className="w-7 h-7 text-amber-400" />
            Motorcycle Garage
          </h1>
          <p className="text-xs text-slate-400">
            Manage your motorcycles, fuel tank parameters, and activate the primary ride
          </p>
        </div>
        <Button onClick={openAddModal} variant="primary">
          <Plus className="w-4 h-4 mr-2" /> Add Motorcycle
        </Button>
      </div>

      {/* Bikes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bikes.map((bike) => {
          const isCurrentActive = activeBike?.id === bike.id;
          return (
            <Card
              key={bike.id}
              className={`relative overflow-hidden transition-all border ${
                isCurrentActive ? 'border-amber-500/50 bg-slate-900/90 shadow-amber-500/10' : 'border-slate-800'
              }`}
            >
              {isCurrentActive && (
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow">
                  ACTIVE BIKE
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                    <BikeIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-100">{bike.name}</CardTitle>
                    <p className="text-xs text-slate-400 font-medium">
                      {bike.manufacturer} {bike.model} ({bike.year})
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-xs pt-1">
                {bike.registrationNumber && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400 font-semibold uppercase">Registration:</span>
                    <span className="font-mono font-bold text-slate-200 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {bike.registrationNumber}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-800/80">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Odometer</span>
                    <span className="font-bold text-sm text-slate-100">{bike.currentOdometer.toLocaleString()} km</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Tank Size</span>
                    <span className="font-bold text-sm text-amber-400">{bike.tankCapacity} Liters</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-800/80">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Reserve Fuel</span>
                    <span className="font-semibold text-slate-300">{bike.reserveCapacity || 2.6} Liters</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Rated Mileage</span>
                    <span className="font-semibold text-emerald-400">{bike.expectedMileage} km/L</span>
                  </div>
                </div>

                {bike.notes && (
                  <p className="text-[11px] text-slate-400 italic line-clamp-2">
                    &ldquo;{bike.notes}&rdquo;
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  {!isCurrentActive ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => switchActiveBike(bike.id)}
                      className="text-xs"
                    >
                      <Check className="w-3.5 h-3.5 mr-1 text-amber-400" /> Set as Active
                    </Button>
                  ) : (
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Primary Telemetry Bike
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(bike)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                      title="Edit Motorcycle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {bikes.length > 1 && (
                      <button
                        onClick={() => handleDelete(bike.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Delete Motorcycle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Motorcycle Dialog */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => setModalOpen(open)}
        title={editingBike ? 'Edit Motorcycle' : 'Add New Motorcycle'}
        description="Configure bike specifications for telemetry and fuel range estimations"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Nickname / Label</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. My Daily Cruiser"
                required
              />
            </div>
            <div>
              <Label required>Manufacturer</Label>
              <Input
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="e.g. Honda, Yamaha, BMW"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label required>Model</Label>
              <Input
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="e.g. CB350, Ninja 400"
                required
              />
            </div>
            <div>
              <Label>Variant</Label>
              <Input
                value={formData.variant}
                onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                placeholder="e.g. ABS Edition"
              />
            </div>
            <div>
              <Label required>Year</Label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="e.g. 2024"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Registration Number</Label>
              <Input
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                placeholder="e.g. AB 01 CD 1234"
              />
            </div>
            <div>
              <Label required>Current Odometer (KM)</Label>
              <Input
                type="number"
                value={formData.currentOdometer}
                onChange={(e) => setFormData({ ...formData, currentOdometer: e.target.value })}
                placeholder="e.g. 0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label required>Tank Capacity (L)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.tankCapacity}
                onChange={(e) => setFormData({ ...formData, tankCapacity: e.target.value })}
                placeholder="e.g. 13"
                required
              />
            </div>
            <div>
              <Label>Reserve Level (L)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.reserveCapacity}
                onChange={(e) => setFormData({ ...formData, reserveCapacity: e.target.value })}
                placeholder="e.g. 2.6"
              />
            </div>
            <div>
              <Label required>Rated Mileage (km/L)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.expectedMileage}
                onChange={(e) => setFormData({ ...formData, expectedMileage: e.target.value })}
                placeholder="e.g. 35"
                required
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Custom exhaust, alloy wheels"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} variant="primary">
              {editingBike ? 'Update Motorcycle' : 'Save Motorcycle'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
