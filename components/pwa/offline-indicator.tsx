'use client';

import React, { useState } from 'react';
import { WifiOff, Wifi, RefreshCw, Clock, CheckCircle2, AlertTriangle, Trash2, X, ChevronUp, Database } from 'lucide-react';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { Button } from '@/components/ui/button';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, queue, pendingCount, isSyncing, syncNow, removeItem, clearSynced } = useOfflineSync();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // If online and nothing in queue or syncing, hide indicator
  if (isOnline && pendingCount === 0 && !isSyncing && queue.length === 0) {
    return null;
  }

  const handleSyncClick = async () => {
    setSyncFeedback(null);
    const res = await syncNow();
    if (res.synced > 0) {
      setSyncFeedback(`Successfully synchronized ${res.synced} item(s) to MongoDB.`);
      setTimeout(() => setSyncFeedback(null), 4000);
    } else if (res.failed > 0) {
      setSyncFeedback(`Sync completed with ${res.failed} error(s). Please review queue.`);
    }
  };

  return (
    <>
      {/* Floating Status Bar at bottom */}
      <aside
        aria-label="Offline Mode and Sync Status"
        className="fixed bottom-20 md:bottom-6 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center justify-between gap-3 rounded-2xl border border-slate-700/80 bg-slate-950/95 px-4 py-2.5 text-xs font-medium text-slate-100 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom duration-300"
      >
        <div className="flex items-center gap-2.5 truncate">
          {!isOnline ? (
            <>
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
              </span>
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="truncate">
                <p className="font-semibold text-amber-300">Offline Mode Active</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {pendingCount > 0 ? `${pendingCount} form(s) stored in Offline Queue` : 'Viewing cached telemetry'}
                </p>
              </div>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <p className="font-semibold text-emerald-400">Connection Restored</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {pendingCount} offline item(s) ready to sync to MongoDB
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isOnline && pendingCount > 0 && (
            <Button
              size="sm"
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="h-7 px-2.5 text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          )}

          {queue.length > 0 && (
            <button
              onClick={() => setDrawerOpen(true)}
              className="h-7 px-2 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition flex items-center gap-1"
              title="Inspect Offline Queue"
            >
              <span>Queue ({queue.length})</span>
              <ChevronUp className="w-3 h-3" />
            </button>
          )}
        </div>
      </aside>

      {/* Sync Feedback Toast */}
      {syncFeedback && (
        <div className="fixed bottom-36 md:bottom-20 left-4 z-50 p-3 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs shadow-xl flex items-center gap-2 animate-in fade-in">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Offline Queue Details Modal / Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-slate-100">RideFuel Offline Queue</h3>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Entries recorded offline are stored in your device&apos;s IndexedDB/LocalStorage. They will sync to MongoDB automatically once connectivity is restored.
            </p>

            {/* Queue items list */}
            <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
              {queue.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Offline queue is empty.
                </div>
              ) : (
                queue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{item.description}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            item.status === 'synced'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : item.status === 'syncing'
                              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                              : item.status === 'failed'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Recorded: {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Target: {item.endpoint}
                      </p>
                      {item.errorMessage && (
                        <p className="text-[11px] text-rose-400 font-medium">
                          Error: {item.errorMessage} (Retry #{item.retryCount})
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition"
                      title="Discard item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={clearSynced}
                className="text-xs h-8 bg-slate-800 text-slate-300"
              >
                Clear Synced
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSyncClick}
                  disabled={isSyncing || !isOnline || pendingCount === 0}
                  className="text-xs h-8 bg-amber-500 text-slate-950 font-bold"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : isOnline ? 'Sync All' : 'Offline'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setDrawerOpen(false)}
                  className="text-xs h-8"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
