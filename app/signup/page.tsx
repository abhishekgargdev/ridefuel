'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Fuel, AlertCircle, CheckCircle2 } from 'lucide-react';
import { RequireGuest } from '@/components/auth/require-guest';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await signup(name, email, password);
      if (res.success) {
        router.replace('/dashboard');
        router.refresh();
      } else {
        setError(res.error || 'Failed to create account');
      }
    } catch (err: unknown) {
      setError('An unexpected registration error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RequireGuest>
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
        <h2 className="text-xl font-bold tracking-tight text-slate-100">Create your rider account</h2>
        <p className="text-xs text-slate-400">
          Automatically configures an initial Royal Enfield Classic 350 ready to log
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <Label required>Rider Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                required
              />
            </div>

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
              <Label required>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" loading={loading} variant="primary" className="w-full">
              Register & Start Tracking
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-amber-400 font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
    </RequireGuest>
  );
}
