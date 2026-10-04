'use client';

import React from 'react';
import Link from 'next/link';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Fuel,
  Gauge,
  TrendingUp,
  Wrench,
  DollarSign,
  FileText,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Calculator,
} from 'lucide-react';

export default function FeaturesPage() {
  const featuresList = [
    {
      title: 'Full-Tank to Full-Tank Mileage Algorithm',
      description:
        'Calculates real-world fuel economy strictly using full-tank refill intervals (Distance ÷ Liters Added), eliminating sensor slosh inaccuracies.',
      icon: Fuel,
      badge: 'Core Engine',
    },
    {
      title: 'Algorithmic Fuel & Range Estimation',
      description:
        'Never represents estimated fuel as an actual sensor reading. Clearly labels "Estimated Fuel" and "Estimated Range" calculated safely from known baseline refills.',
      icon: Gauge,
      badge: 'Safety Telemetry',
    },
    {
      title: 'Odometer Integrity & Rollback Protection',
      description:
        'Guarantees monotonically increasing daily readings. Requires explicit user acknowledgment for instrument cluster replacements or calibration.',
      icon: TrendingUp,
      badge: 'Data Integrity',
    },
    {
      title: 'Dual Schedule Maintenance Reminders',
      description:
        'Tracks engine oil, chain lubrication, brake pad inspections, and filter replacements with dual thresholds: target odometer km OR due calendar date.',
      icon: Wrench,
      badge: 'Preventive Care',
    },
    {
      title: 'Multi-Category Expense Book',
      description:
        'Comprehensive breakdown across Petrol, Maintenance, Repair, Insurance, Accessories, Cleaning, Parking, Tolls, and custom items with cost-per-km metrics.',
      icon: DollarSign,
      badge: 'Financials',
    },
    {
      title: 'Interactive Trip & Refill Simulator',
      description:
        'Simulate extra riding distances or gas station top-ups before heading onto the expressway to verify remaining range to empty.',
      icon: Calculator,
      badge: 'Trip Planner',
    },
    {
      title: 'Installable Offline Progressive Web App (PWA)',
      description:
        'Engineered with Service Worker offline shell and caching. Log refills beside the pump in mountain passes with zero cellular connection.',
      icon: Smartphone,
      badge: 'PWA Standard',
    },
    {
      title: 'Multi-Motorcycle Fleet Architecture',
      description:
        'Easily add your Royal Enfield Classic 350, Hunter 350, Himalayan, or companion sport bikes with independent tank sizes, reserve levels, and metrics.',
      icon: FileText,
      badge: 'Fleet Ready',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <PublicHeader />

      <main className="flex-1 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <Badge variant="amber">Capabilities & Architecture</Badge>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-100">
              Precision Telemetry Features
            </h1>
            <p className="text-sm text-slate-400">
              Explore the engineering and mathematical principles that power RideFuel
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuresList.map((f, i) => {
              const Icon = f.icon;
              return (
                <Card key={i} className="p-6 border-slate-800 bg-slate-900/50 hover:border-slate-700 transition">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 font-bold">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-100">{f.title}</h3>
                        <Badge variant="outline">{f.badge}</Badge>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="text-center pt-8">
            <Link href="/signup">
              <Button size="lg" variant="primary">
                Get Started with RideFuel <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
