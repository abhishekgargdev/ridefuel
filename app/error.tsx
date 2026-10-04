'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application Runtime Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-6">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-black text-slate-100 mb-2">Engine Sensor Glitch</h1>
      <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
        {error?.message || 'An unexpected telemetry exception occurred. Please try reloading the view.'}
      </p>
      <Button variant="primary" onClick={() => reset()}>
        <RefreshCw className="w-4 h-4 mr-1.5" /> Reconnect & Retry
      </Button>
    </div>
  );
}
