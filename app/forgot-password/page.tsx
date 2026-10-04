'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Fuel, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.data.message);
        if (data.data.resetUrl) {
          setResetUrl(data.data.resetUrl);
        }
      } else {
        setError(data.error || 'Failed to request password reset');
      }
    } catch (e) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
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
        <h2 className="text-xl font-bold tracking-tight text-slate-100">Reset your password</h2>
        <p className="text-xs text-slate-400">Enter your email address to receive password reset instructions</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="p-6 sm:p-8 space-y-4">
          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Reset Token Generated</span>
              </div>
              <p>{successMsg}</p>
              {resetUrl && (
                <div className="pt-2">
                  <Link href={resetUrl}>
                    <Button size="sm" variant="primary" className="w-full text-xs">
                      Proceed to Reset Password Screen →
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Button type="submit" loading={loading} variant="primary" className="w-full">
              Send Password Reset
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            <Link href="/login" className="text-amber-400 hover:underline flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
