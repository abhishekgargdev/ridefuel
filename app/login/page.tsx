'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Fuel, AlertCircle, Zap } from 'lucide-react';
import { RequireGuest } from '@/components/auth/require-guest';
import { getSafeRedirect } from '@/lib/auth/routes';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = getSafeRedirect(searchParams.get('redirect'));
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login(email, password);
      if (res.success) {
        router.replace(redirect);
        router.refresh();
      } else {
        setError(res.error || 'Invalid email or password');
      }
    } catch (err: unknown) {
      setError('An unexpected login error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setError(null);
    try {
      const res = await login('demo@ridefuel.com', 'Password123!');
      if (res.success) {
        router.replace(redirect);
        router.refresh();
      } else {
        await fetch('/api/seed', { method: 'POST' });
        const retryRes = await login('demo@ridefuel.com', 'Password123!');
        if (retryRes.success) {
          router.replace(redirect);
          router.refresh();
        } else {
          setError('Failed to auto-sign in to demo. Please try again.');
        }
      }
    } catch (err) {
      setError('Failed to connect to demo account');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Fuel className="w-6 h-6 fill-slate-950" />
          </div>
          <span className="font-black text-2xl tracking-wider text-slate-100">
            RIDE<span className="text-amber-400">FUEL</span>
          </span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-slate-100">Sign in to your motorcycle telemetry</h2>
        <p className="text-xs text-slate-400">Access your fuel logs, range predictions, and service records</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Quick Demo Test Drive Box */}
        {/* <div className="mb-4 p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-xs text-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Instant Test Drive (1-Click)</span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full">
              Demo Credentials
            </span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Pre-loaded with a <strong>Royal Enfield Classic 350 (2022)</strong>, realistic full-tank fuel history, and active maintenance milestones.
          </p>
          <Button
            type="button"
            variant="amber"
            size="sm"
            onClick={handleDemoLogin}
            loading={demoLoading}
            className="w-full text-xs"
          >
            Sign in as Demo User (demo@ridefuel.com)
          </Button>
        </div> */}

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <Label required>Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rider@example.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label required className="mb-0">Password</Label>
                <Link href="/forgot-password" className="text-xs text-amber-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" loading={loading} variant="primary" className="w-full">
              Sign In to RideFuel
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Don&apos;t have an account yet?{' '}
            <Link href="/signup" className="text-amber-400 font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <RequireGuest>
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
            Loading login form...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </RequireGuest>
  );
}
