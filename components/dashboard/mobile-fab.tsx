'use client';

import React from 'react';
import { Fuel, Gauge, DollarSign, Wrench, X } from 'lucide-react';

interface MobileFabMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (type: 'fuel' | 'reading' | 'expense' | 'maintenance') => void;
}

export function MobileFabMenu({ isOpen, onClose, onSelectAction }: MobileFabMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-sm mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-100 space-y-3 animate-in slide-in-from-bottom-8">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-100">Quick Log Event</h3>
            <p className="text-xs text-slate-400">Tap an action to record while beside the motorcycle</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => {
              onSelectAction('fuel');
              onClose();
            }}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 active:scale-95 transition text-amber-400"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-2">
              <Fuel className="w-6 h-6 text-amber-400" />
            </div>
            <span className="font-bold text-sm text-slate-100">Add Fuel</span>
            <span className="text-[10px] text-slate-400">Petrol Refill</span>
          </button>

          <button
            onClick={() => {
              onSelectAction('reading');
              onClose();
            }}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500/20 active:scale-95 transition text-sky-400"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 flex items-center justify-center mb-2">
              <Gauge className="w-6 h-6 text-sky-400" />
            </div>
            <span className="font-bold text-sm text-slate-100">Add Reading</span>
            <span className="text-[10px] text-slate-400">Daily Odometer</span>
          </button>

          <button
            onClick={() => {
              onSelectAction('expense');
              onClose();
            }}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 active:scale-95 transition text-emerald-400"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="font-bold text-sm text-slate-100">Add Expense</span>
            <span className="text-[10px] text-slate-400">Tolls, Wash, Gear</span>
          </button>

          <button
            onClick={() => {
              onSelectAction('maintenance');
              onClose();
            }}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-violet-500/10 border border-violet-500/30 hover:bg-violet-500/20 active:scale-95 transition text-violet-400"
          >
            <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center mb-2">
              <Wrench className="w-6 h-6 text-violet-400" />
            </div>
            <span className="font-bold text-sm text-slate-100">Add Service</span>
            <span className="text-[10px] text-slate-400">Oil, Chain, Brakes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
