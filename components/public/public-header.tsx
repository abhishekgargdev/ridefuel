'use client';

import React from 'react';
import Link from 'next/link';
import { Fuel, ArrowRight, Smartphone } from 'lucide-react';
import { PWAInstallButton } from '@/components/pwa/pwa-install-button';
import { useAuth } from '@/lib/auth/context';

export function PublicHeader() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Fuel className="w-5 h-5 fill-slate-950" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base tracking-wider text-slate-100 flex items-center gap-1.5">
                RIDE<span className="text-amber-400">FUEL</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest hidden sm:inline">
                Motorcycle Telemetry
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <Link href="/" className="hover:text-amber-400 transition">
              Home
            </Link>
            <Link href="/features" className="hover:text-amber-400 transition">
              Features
            </Link>
            <Link href="/about" className="hover:text-amber-400 transition">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <PWAInstallButton />

            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition active:scale-95"
              >
                Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-900 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition active:scale-95"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
