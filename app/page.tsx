'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/context';
import {
  Fuel,
  Gauge,
  TrendingUp,
  Wrench,
  DollarSign,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  const { login } = useAuth();
  const router = useRouter();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      const res = await login('demo@ridefuel.com', 'Password123!');
      if (res.success) {
        router.push('/dashboard');
      } else {
        // Fallback: seed database first if not already initialized
        await fetch('/api/seed', { method: 'POST' });
        await login('demo@ridefuel.com', 'Password123!');
        router.push('/dashboard');
      }
    } catch (e) {
      router.push('/login');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      <PublicHeader />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-800/60 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.15),rgba(255,255,255,0))]" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tailored for Royal Enfield Classic 350 (2022) & Multi-Bike Fleets</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-100 max-w-4xl mx-auto leading-[1.1]">
              Never Trust a Faulty Fuel Gauge Again. <br />
              <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
                Track by Mathematics.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Motorcycle fuel gauges fluctuate wildly around turns and inclines. RideFuel estimates your
              <strong className="text-amber-300 ml-1 font-semibold">Estimated Fuel</strong> and{' '}
              <strong className="text-amber-300 font-semibold">Estimated Range</strong> mathematically from full-tank refills,
              odometer deltas, and real-world J-series engine mileage.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button
                size="lg"
                variant="primary"
                onClick={handleDemoLogin}
                loading={demoLoading}
                className="w-full sm:w-auto text-sm px-6"
              >
                <Zap className="w-4 h-4 mr-2 fill-slate-950" /> Explore Demo with Classic 350
              </Button>

              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto text-sm px-6">
                  Create Free Account <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Quick Feature Badges */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Full-Tank Calculation Method
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Offline Progressive Web App
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Reserve Fuel Warning Thresholds
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Multi-Bike Support
              </span>
            </div>
          </div>
        </section>

        {/* PROBLEM & SOLUTION SECTION */}
        <section className="py-16 md:py-24 border-b border-slate-800/60 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <h2 className="text-2xl sm:text-4xl font-black text-slate-100">
                The Real Challenge of the Royal Enfield Classic 350
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                The 2022 Classic 350 is a modern classic masterpiece, but its analog/digital fuel bar gauge is notorious among riders for showing reserve after 120 km, only to show half-tank after a coffee stop.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 border-slate-800 bg-slate-900/40">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 font-bold">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <CardTitle className="text-base font-bold mb-2">Unreliable Float Sensor</CardTitle>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The curved 13-liter teardrop tank sloshes fuel away from the internal float during acceleration and braking, triggering premature low-fuel panic.
                </p>
              </Card>

              <Card className="p-6 border-amber-500/30 bg-amber-500/5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4 font-bold">
                  <Fuel className="w-6 h-6" />
                </div>
                <CardTitle className="text-base font-bold mb-2">Mathematical Estimation</CardTitle>
                <p className="text-xs text-slate-400 leading-relaxed">
                  RideFuel calculates your true reserve threshold (~2.6 L) by combining consecutive full-tank refills and verified daily odometer logs.
                </p>
              </Card>

              <Card className="p-6 border-slate-800 bg-slate-900/40">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 font-bold">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <CardTitle className="text-base font-bold mb-2">Confidence on the Highway</CardTitle>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Know exactly how many kilometers you have left before hitting reserve, eliminating range anxiety on remote mountain passes and highways.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* CORE MODULES SHOWCASE */}
        <section className="py-16 md:py-24 border-b border-slate-800/60 bg-gradient-to-b from-slate-950 via-slate-900/20 to-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <Badge variant="amber">Complete Ecosystem</Badge>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-100">
                Engineered for Every Aspect of Motorcycle Ownership
              </h2>
              <p className="text-sm text-slate-400">
                From daily commutes to cross-country road trips, every event is tracked seamlessly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
                  <Fuel className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-100">Full-Tank Fuel Logs</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Record liters, fuel station, price, and payment method. Automatically computes distance run, cost per km, and true engine fuel economy.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-400">
                  <Gauge className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-100">Daily Odometer Readings</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter speedometer checkpoints with built-in validation preventing invalid rollback errors unless an explicit cluster correction is performed.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-100">Mileage Analytics</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real efficiency analytics highlighting min, max, recent, and overall average mileage. Strict warnings when data is insufficient.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-100">Maintenance & Service Schedules</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Never miss an oil change or chain lubrication routine. Proactive countdowns based on both calendar dates and target odometer readings.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/15 flex items-center justify-center text-pink-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-100">Comprehensive Expense Book</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Categorize insurance renewals, helmet & riding gear, foam washing, toll charges, and emergency repairs into clear financial summaries.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-100">Installable Mobile PWA</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Works offline in rural mountain zones without cell reception. Large touch targets designed for gloved or single-handed pump-side entries.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="py-16 md:py-20 bg-slate-950 text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-100">
              Ready to Upgrade Your Motorcycle Dashboard?
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Test drive RideFuel in 1 second using the pre-seeded Royal Enfield Classic 350 (2022) demo account.
            </p>
            <div className="pt-2">
              <Button size="lg" variant="primary" onClick={handleDemoLogin} loading={demoLoading}>
                <Zap className="w-4 h-4 mr-2" /> Launch Instant Demo
              </Button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
