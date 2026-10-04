'use client';

import React from 'react';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Fuel, ShieldCheck, Mail, FileText, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <PublicHeader />

      <main className="flex-1 py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center space-y-3">
            <Badge variant="amber">The Story & Mission</Badge>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-100">
              Why We Built RideFuel
            </h1>
            <p className="text-sm text-slate-400">
              Born out of highway range anxiety on a Royal Enfield Classic 350 (2022)
            </p>
          </div>

          {/* Story Body */}
          <Card className="p-6 md:p-8 space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-100">The Teardrop Tank Dilemma</h2>
            <p>
              When Royal Enfield launched the revolutionary J-series engine in the 2022 Classic 350, it brought unparalleled smoothness, fuel injection, and refined cruising dynamics. However, riders quickly realized a persistent dilemma: the digital instrument cluster’s fuel indicator could never be trusted.
            </p>
            <p>
              On a winding ghat road or highway incline, the 13-liter teardrop petrol tank sloshes fuel away from the internal float mechanism. The cluster would aggressively flash low-fuel reserve after just 150 km, even when 8 liters remained in the tank. Conversely, parking on a side-stand would make the gauge read nearly full.
            </p>
            <h2 className="text-lg font-bold text-slate-100 pt-2">The Mathematical Solution</h2>
            <p>
              Rather than guessing or risking running dry, we engineered <strong>RideFuel</strong>. By treating the odometer as the single source of truth and recording full-tank refills, RideFuel calculates true mileage (~34–38 km/L) and estimates remaining fuel and range with algorithmic precision.
            </p>
            <p>
              While designed with the 2022 Classic 350 as the primary benchmark, the architecture is completely modular to support any motorcycle fleet.
            </p>
          </Card>

          {/* Privacy Section */}
          <div id="privacy" className="space-y-3 pt-6 border-t border-slate-800">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Privacy Policy
            </h2>
            <Card className="p-6 text-xs text-slate-400 space-y-2 leading-relaxed">
              <p>
                RideFuel respects your privacy. All user data, including motorcycle odometer logs, GPS locations (if entered optionally), fuel costs, and workshop invoices, is strictly isolated to your authenticated account.
              </p>
              <p>
                Passwords are never stored in plaintext and are salted using industry-standard bcrypt. Session tokens are transmitted exclusively over encrypted HTTP-only cookies.
              </p>
            </Card>
          </div>

          {/* Terms Section */}
          <div id="terms" className="space-y-3 pt-6 border-t border-slate-800">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" /> Terms of Service
            </h2>
            <Card className="p-6 text-xs text-slate-400 space-y-2 leading-relaxed">
              <p>
                Calculations provided by RideFuel—including &ldquo;Estimated Fuel&rdquo; and &ldquo;Estimated Range&rdquo;—are algorithmic estimations based on past user logs and theoretical consumption models. They do not constitute certified hardware sensor readouts.
              </p>
              <p>
                Riders should always exercise safe riding habits, monitor their physical reserve petcocks or fuel gauges, and avoid riding on extreme reserve levels.
              </p>
            </Card>
          </div>

          {/* Contact Section */}
          <div id="contact" className="space-y-3 pt-6 border-t border-slate-800">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Mail className="w-5 h-5 text-sky-400" /> Contact & Rider Community
            </h2>
            <Card className="p-6 text-xs text-slate-400 space-y-3 leading-relaxed">
              <p>
                Have questions, feature requests for specific bike models, or telemetry feedback?
              </p>
              <p>
                Reach our team directly at:{' '}
                <a href="mailto:support@ridefuel.app" className="text-amber-400 font-semibold hover:underline">
                  support@ridefuel.app
                </a>
              </p>
            </Card>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
