'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { useAuth } from '@/lib/auth/context';
import { User, Mail, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUserData } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || '₹');
  const [distanceUnit, setDistanceUnit] = useState(user?.distanceUnit || 'km');
  const [fuelUnit, setFuelUnit] = useState(user?.fuelUnit || 'liters');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          currency,
          distanceUnit,
          fuelUnit,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }
      await refreshUserData();
      setMessage('Profile preferences updated successfully.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
          <User className="w-7 h-7 text-amber-400" />
          Rider Profile & Telemetry Units
        </h1>
        <p className="text-xs text-slate-400">
          Manage your account credentials, regional currency, and measurement standards
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            {message && (
              <div className="flex items-center gap-2 p-3 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <Label>Email Address</Label>
              <Input value={user?.email || ''} disabled className="opacity-60 bg-slate-900 cursor-not-allowed" />
              <p className="text-[10px] text-slate-400 mt-1">Email is tied to your motorcycle telemetry vault.</p>
            </div>

            <div>
              <Label required>Rider Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Currency Symbol</Label>
                <Input
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="₹, $, €"
                  maxLength={5}
                />
              </div>

              <div>
                <Label>Distance Unit</Label>
                <select
                  value={distanceUnit}
                  onChange={(e) => setDistanceUnit(e.target.value as 'km' | 'miles')}
                  className="flex h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value="km">Kilometers (km)</option>
                  <option value="miles">Miles (mi)</option>
                </select>
              </div>

              <div>
                <Label>Fuel Unit</Label>
                <select
                  value={fuelUnit}
                  onChange={(e) => setFuelUnit(e.target.value as 'liters' | 'gallons')}
                  className="flex h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value="liters">Liters (L)</option>
                  <option value="gallons">US Gallons (gal)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button type="submit" loading={loading} variant="primary">
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
