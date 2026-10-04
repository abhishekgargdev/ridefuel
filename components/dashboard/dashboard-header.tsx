'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { PWAInstallButton } from '@/components/pwa/pwa-install-button';
import {
  Bike as BikeIcon,
  Fuel,
  Gauge,
  TrendingUp,
  DollarSign,
  Wrench,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  Plus,
  Compass,
  Menu,
  X,
  User as UserIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DASHBOARD_ACCOUNT_NAV,
  DASHBOARD_MORE_NAV,
  DASHBOARD_PRIMARY_NAV,
  isNavActive,
} from '@/lib/navigation';

export function DashboardHeader({
  onOpenQuickModal,
}: {
  onOpenQuickModal: (type: 'fuel' | 'reading' | 'expense' | 'maintenance') => void;
}) {
  const { user, bikes, activeBike, switchActiveBike, logout } = useAuth();
  const pathname = usePathname();
  const [bikeDropdownOpen, setBikeDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const iconByHref: Record<string, React.ComponentType<{ className?: string }>> = {
    '/dashboard': Compass,
    '/dashboard/fuel': Fuel,
    '/dashboard/readings': Gauge,
    '/dashboard/mileage': TrendingUp,
    '/dashboard/range-calculator': Gauge,
    '/dashboard/fuel-analytics': Fuel,
    '/dashboard/expenses': DollarSign,
    '/dashboard/maintenance': Wrench,
    '/dashboard/reports': FileText,
    '/dashboard/service-history': Wrench,
    '/dashboard/bikes': BikeIcon,
    '/dashboard/profile': UserIcon,
    '/dashboard/settings': Settings,
  };

  const navLinks = [...DASHBOARD_PRIMARY_NAV, ...DASHBOARD_MORE_NAV];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Active Bike Selector */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
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

            {/* Active Bike Dropdown Badge */}
            {activeBike && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBikeDropdownOpen(!bikeDropdownOpen)}
                  className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
                >
                  <BikeIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span className="max-w-[120px] sm:max-w-[160px] truncate">{activeBike.name}</span>
                  <ChevronDown className="w-3 h-3 text-amber-400/80" />
                </button>

                {bikeDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setBikeDropdownOpen(false)}
                    />
                    <div className="absolute left-0 mt-2 w-64 rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                      <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                        Switch Active Motorcycle
                      </div>
                      <div className="space-y-1">
                        {bikes.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              switchActiveBike(b.id);
                              setBikeDropdownOpen(false);
                            }}
                            className={cn(
                              'w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-xl text-left transition',
                              b.id === activeBike.id
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'text-slate-300 hover:bg-slate-800'
                            )}
                          >
                            <div className="truncate">
                              <p className="truncate font-semibold">{b.name}</p>
                              <p className="text-[10px] opacity-75">{b.model} ({b.year})</p>
                            </div>
                            {b.id === activeBike.id && (
                              <span className="text-[10px] bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded-full font-bold">
                                ACTIVE
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="border-t border-slate-800 mt-2 pt-1.5">
                        <Link
                          href="/dashboard/bikes"
                          onClick={() => setBikeDropdownOpen(false)}
                          className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-amber-400 hover:bg-slate-800 rounded-xl font-medium"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Manage / Add Motorcycle</span>
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {DASHBOARD_PRIMARY_NAV.map((link) => {
              const Icon = iconByHref[link.href];
              const isActive = isNavActive(pathname, link.href, link.match);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition',
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  )}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((open) => !open)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition',
                  DASHBOARD_MORE_NAV.some((link) => isNavActive(pathname, link.href, link.match))
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                )}
              >
                More
                <ChevronDown className="w-3 h-3" />
              </button>
              {moreOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50">
                    {DASHBOARD_MORE_NAV.map((link) => {
                      const Icon = iconByHref[link.href];
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMoreOpen(false)}
                          className={cn(
                            'flex items-center gap-2 px-2.5 py-2 text-xs rounded-xl',
                            isNavActive(pathname, link.href, link.match)
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'text-slate-300 hover:bg-slate-800'
                          )}
                        >
                          {Icon && <Icon className="w-3.5 h-3.5" />}
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </nav>

          {/* Header Right Actions */}
          <div className="flex items-center gap-2.5">
            <PWAInstallButton />

            {/* Quick Action Trigger (Desktop) */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={() => onOpenQuickModal('fuel')}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Refill</span>
              </button>
            </div>

            {/* User Profile / Settings Menu */}
            <Link
              href="/dashboard/profile"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white p-2 rounded-xl hover:bg-slate-900"
              title="Profile & Preferences"
            >
              <UserIcon className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href="/dashboard/settings"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white p-2 rounded-xl hover:bg-slate-900"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-slate-400" />
            </Link>

            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 p-2 rounded-xl hover:bg-slate-900 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:bg-slate-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950 p-4 space-y-2 animate-in slide-in-from-top-4">
          <div className="grid grid-cols-2 gap-2 pb-2">
            <button
              onClick={() => {
                onOpenQuickModal('fuel');
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              <Fuel className="w-4 h-4" /> Add Refill
            </button>
            <button
              onClick={() => {
                onOpenQuickModal('reading');
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-800 text-slate-100 font-bold text-xs"
            >
              <Gauge className="w-4 h-4" /> Add Reading
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {navLinks.map((link) => {
              const Icon = iconByHref[link.href];
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium',
                    isNavActive(pathname, link.href, link.match)
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'text-slate-300 hover:bg-slate-900'
                  )}
                >
                  {Icon && <Icon className="w-4 h-4 text-amber-400" />}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-3">
              {DASHBOARD_ACCOUNT_NAV.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-amber-400 font-semibold"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="text-rose-400 font-semibold flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
