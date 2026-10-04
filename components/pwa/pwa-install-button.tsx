'use client';

import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '@/hooks/use-pwa-install';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    setInstalling(true);
    await install();
    setInstalling(false);
  };

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={handleInstall}
        disabled={installing}
        className={`inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-3.5 py-1.5 text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 ${className}`}
        title="Install RideFuel App for offline access"
      >
        <Download className="w-3.5 h-3.5" />
        <span>{variant === 'full' ? 'Install RideFuel App' : 'Install App'}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Add to Home Screen</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-slate-100">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px]">
                    1
                  </span>
                  <p>
                    Tap the <strong className="text-amber-300">Share</strong> icon (square with arrow up) at the bottom toolbar of Safari.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px]">
                    2
                  </span>
                  <p>
                    Scroll down and select <strong className="text-amber-300">Add to Home Screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px]">
                    3
                  </span>
                  <p>Tap <strong className="text-amber-300">Add</strong> in the top-right corner to enjoy full screen RideFuel.</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
