import React from 'react';
import Link from 'next/link';
import { Fuel, Heart } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950 py-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1 */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black">
                <Fuel className="w-4 h-4 fill-slate-950" />
              </div>
              <span className="font-black text-sm tracking-wider text-slate-100">
                RIDE<span className="text-amber-400">FUEL</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Algorithmic fuel estimation, true full-tank mileage calculations, and proactive maintenance logs engineered for the Royal Enfield Classic 350 (2022) and multi-bike fleets.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link href="/" className="hover:text-amber-400 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-amber-400 transition">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-amber-400 transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-amber-400 transition">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Modules</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link href="/dashboard/mileage" className="hover:text-amber-400 transition">
                  Mileage Analytics
                </Link>
              </li>
              <li>
                <Link href="/dashboard/range-calculator" className="hover:text-amber-400 transition">
                  Range Calculator
                </Link>
              </li>
              <li>
                <Link href="/dashboard/maintenance" className="hover:text-amber-400 transition">
                  Service Schedules
                </Link>
              </li>
              <li>
                <Link href="/dashboard/reports" className="hover:text-amber-400 transition">
                  Financial Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Legal & Contact</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link href="/about#privacy" className="hover:text-amber-400 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/about#terms" className="hover:text-amber-400 transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/about#contact" className="hover:text-amber-400 transition">
                  Contact Support
                </Link>
              </li>
              <li>
                <a href="mailto:support@ridefuel.app" className="text-amber-400 hover:underline">
                  support@ridefuel.app
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} RideFuel PWA. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for passionate motorcyclists.
          </p>
        </div>
      </div>
    </footer>
  );
}
