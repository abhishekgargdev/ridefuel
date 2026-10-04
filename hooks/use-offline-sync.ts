'use client';

import { useState, useEffect, useCallback } from 'react';
import { syncManager } from '@/lib/offline/sync-manager';
import { OfflineQueueItem, SyncResult } from '@/lib/offline/types';
import { useOnlineStatus } from './use-online-status';

export function useOfflineSync() {
  const isOnline = useOnlineStatus();
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const refreshQueue = useCallback(async () => {
    try {
      const items = await syncManager.getQueue();
      setQueue(items);
      setIsSyncing(syncManager.getIsSyncing());
    } catch {
      // Ignore during unmount
    }
  }, []);

  useEffect(() => {
    refreshQueue();
    const unsubscribe = syncManager.subscribe(() => {
      refreshQueue();
    });
    return () => {
      unsubscribe();
    };
  }, [refreshQueue]);

  const syncNow = async (): Promise<SyncResult> => {
    setIsSyncing(true);
    try {
      const result = await syncManager.syncAll();
      setLastSyncResult(result);
      await refreshQueue();
      return result;
    } finally {
      setIsSyncing(false);
    }
  };

  const removeItem = async (id: string) => {
    await syncManager.removeQueueItem(id);
    await refreshQueue();
  };

  const clearSynced = async () => {
    await syncManager.clearSynced();
    await refreshQueue();
  };

  const pendingCount = queue.filter(
    (item) => item.status === 'pending' || item.status === 'syncing'
  ).length;

  return {
    isOnline,
    queue,
    pendingCount,
    isSyncing,
    lastSyncResult,
    syncNow,
    removeItem,
    clearSynced,
    refreshQueue,
  };
}
