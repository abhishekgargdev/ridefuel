'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PWAInstallButton } from '@/components/pwa/pwa-install-button';
import { useAuth } from '@/lib/auth/context';
import { Settings, RefreshCw, Smartphone, Database, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
  const { refreshUserData } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const handleResetToDemo = async () => {
    if (!confirm('Reset motorcycle database to the default Royal Enfield Classic 350 (2022) demo dataset? This will recreate sample fuel logs and readings.')) {
      return;
    }

    setResetting(true);
    setResetMsg(null);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await refreshUserData();
        setResetMsg('Database successfully reset to Royal Enfield Classic 350 (2022) factory seed.');
      }
    } catch (e) {
      alert('Failed to reset demo dataset');
    } finally {
      setResetting(false);
    }
  };

  const handleClearCache = async () => {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      alert('PWA offline cache cleared. Reloading page...');
      window.location.reload();
    } else {
      alert('Cache storage not accessible');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
          <Settings className="w-7 h-7 text-amber-400" />
          System Settings & PWA
        </h1>
        <p className="text-xs text-slate-400">
          Configure application caching, PWA installation, and development seed states
        </p>
      </div>

      {resetMsg && (
        <div className="flex items-center gap-2 p-3 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{resetMsg}</span>
        </div>
      )}

      {/* PWA & Offline Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-400" />
            Progressive Web App (PWA)
          </CardTitle>
          <p className="text-xs text-slate-400">
            RideFuel is fully offline-capable and installable to your mobile home screen.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-slate-300">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <p className="font-semibold text-slate-100">Install to Mobile Device</p>
              <p className="text-slate-400 text-[11px]">Enables standalone full-screen experience and hardware caching</p>
            </div>
            <PWAInstallButton />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <p className="font-semibold text-slate-100">Offline Cache Storage</p>
              <p className="text-slate-400 text-[11px]">Clear cached service worker static files and reload</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleClearCache}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Purge Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Database & Seed Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-400" />
            Database & Seed Data
          </CardTitle>
          <p className="text-xs text-slate-400">
            Restore sample data for the Royal Enfield Classic 350 (2022) with authentic refills and service logs
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <p className="font-semibold text-slate-100 text-xs">Reset to Royal Enfield Demo Fleet</p>
              <p className="text-slate-400 text-[11px]">Re-initializes demo user (demo@ridefuel.com) and Classic 350 telemetry</p>
            </div>
            <Button
              size="sm"
              variant="amber"
              onClick={handleResetToDemo}
              loading={resetting}
            >
              Reset Demo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About App */}
      <Card className="text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-200">Application:</span>
          <span>RideFuel PWA v1.0.0</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-200">Primary Motorcycle:</span>
          <span>Royal Enfield Classic 350 (2022 J-Series)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-200">Architecture:</span>
          <span>Next.js App Router + Mongoose + Zod</span>
        </div>
      </Card>
    </div>
  );
}
