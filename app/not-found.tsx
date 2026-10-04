import React from 'react';
import Link from 'next/link';
import { Fuel, ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6">
        <Compass className="w-8 h-8 animate-spin" />
      </div>
      <h1 className="text-5xl font-black text-slate-100 mb-2">404</h1>
      <h2 className="text-xl font-bold text-slate-200 mb-2">Off the Beaten Trail</h2>
      <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
        The motorcycle telemetry route or resource you are seeking does not exist or has been relocated.
      </p>
      <div className="flex gap-3">
        <Link href="/dashboard">
          <Button variant="primary" size="md">
            Go to Dashboard
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="md">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
