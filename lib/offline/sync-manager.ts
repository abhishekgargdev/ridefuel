/**
 * Offline Queue & Synchronization Manager
 * Abstraction: Offline Queue → Local Storage/IndexedDB → Sync → API → MongoDB
 * RideFuel Progressive Web App
 */

import { offlineStorage } from './offline-storage';
import { OfflineQueueItem, OfflineEntityType, OfflineActionType, SyncResult } from './types';

type SyncListener = () => void;

class SyncManager {
  private isSyncing = false;
  private listeners: Set<SyncListener> = new Set();
  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initNetworkListeners();
    }
  }

  private initNetworkListeners() {
    if (this.initialized) return;
    this.initialized = true;

    window.addEventListener('online', () => {
      // Small debounce delay before auto-sync to let socket settle
      setTimeout(() => {
        this.syncAll().catch((err) => {
          console.warn('[RideFuel PWA] Automatic online sync encountered issue:', err);
        });
      }, 1500);
    });
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // Safe notification
      }
    }
  }

  /**
   * Generates a unique ID for queue items
   */
  private generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Enqueues an action directly to local storage / IndexedDB
   */
  async enqueueAction(params: {
    entityType: OfflineEntityType;
    actionType: OfflineActionType;
    endpoint: string;
    method?: 'POST' | 'PUT' | 'DELETE';
    payload: Record<string, unknown>;
    description: string;
    bikeId?: string;
  }): Promise<OfflineQueueItem> {
    const item: OfflineQueueItem = {
      id: this.generateId(),
      entityType: params.entityType,
      actionType: params.actionType,
      endpoint: params.endpoint,
      method: params.method || 'POST',
      payload: params.payload,
      timestamp: Date.now(),
      clientCreatedAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
      description: params.description,
      bikeId: params.bikeId,
    };

    await offlineStorage.saveQueueItem(item);
    this.notify();
    return item;
  }

  /**
   * Unified submit action for forms:
   * If online -> Sends to API -> Persists in MongoDB.
   * If offline or network unavailable -> Enqueues into Offline Queue -> Local Storage/IndexedDB.
   * STRICT GUARANTEE: Never claims successful MongoDB persistence when offline.
   */
  async submitAction(params: {
    entityType: OfflineEntityType;
    actionType: OfflineActionType;
    endpoint: string;
    method?: 'POST' | 'PUT' | 'DELETE';
    payload: Record<string, unknown>;
    description: string;
    bikeId?: string;
  }): Promise<{
    success: boolean;
    isOffline: boolean;
    offlineQueued: boolean;
    message: string;
    data?: unknown;
    error?: string;
    queuedItem?: OfflineQueueItem;
  }> {
    const method = params.method || 'POST';
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // If device reports offline upfront, immediately queue locally
    if (!isOnline) {
      const queuedItem = await this.enqueueAction(params);
      return {
        success: true,
        isOffline: true,
        offlineQueued: true,
        message: 'Saved to Offline Queue (pending MongoDB sync). Will sync when connection is restored.',
        queuedItem,
      };
    }

    // Attempt online API call
    try {
      const res = await fetch(params.endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params.payload),
      });

      // Handle Service Worker offline 503 response or network disconnect during request
      if (res.status === 503) {
        const text = await res.text();
        if (text.includes('offline') || text.includes('Offline')) {
          const queuedItem = await this.enqueueAction(params);
          return {
            success: true,
            isOffline: true,
            offlineQueued: true,
            message: 'Network offline. Saved to Offline Queue (pending MongoDB sync).',
            queuedItem,
          };
        }
      }

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        // If HTTP 4xx validation error, do not queue - notify user of invalid form values
        if (res.status >= 400 && res.status < 500) {
          return {
            success: false,
            isOffline: false,
            offlineQueued: false,
            error: json?.error || `Request failed with status ${res.status}`,
            message: json?.error || 'Validation failed. Please verify input data.',
          };
        }

        // Server 5xx or connection drop: fallback to offline queue
        const queuedItem = await this.enqueueAction(params);
        return {
          success: true,
          isOffline: true,
          offlineQueued: true,
          message: 'Server temporarily unavailable. Saved to Offline Queue (pending MongoDB sync).',
          queuedItem,
        };
      }

      // Successful online MongoDB persistence!
      return {
        success: true,
        isOffline: false,
        offlineQueued: false,
        message: 'Successfully saved to MongoDB.',
        data: json.data,
      };
    } catch (err: unknown) {
      // Network throw (DNS failure, offline, connection aborted)
      const queuedItem = await this.enqueueAction(params);
      return {
        success: true,
        isOffline: true,
        offlineQueued: true,
        message: 'Network connection lost. Saved to Offline Queue (pending MongoDB sync).',
        queuedItem,
      };
    }
  }

  /**
   * Replays and synchronizes all pending offline items to the API and MongoDB
   */
  async syncAll(): Promise<SyncResult> {
    if (this.isSyncing) {
      const currentQueue = await offlineStorage.getQueue();
      return {
        total: currentQueue.length,
        synced: 0,
        failed: 0,
        items: [],
      };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const currentQueue = await offlineStorage.getQueue();
      return {
        total: currentQueue.filter((i) => i.status === 'pending').length,
        synced: 0,
        failed: 0,
        items: [],
      };
    }

    this.isSyncing = true;
    this.notify();

    const result: SyncResult = {
      total: 0,
      synced: 0,
      failed: 0,
      items: [],
    };

    try {
      const queue = await offlineStorage.getQueue();
      const eligibleItems = queue.filter(
        (item) => item.status === 'pending' || item.status === 'failed'
      );

      result.total = eligibleItems.length;

      for (const item of eligibleItems) {
        // Update status to syncing
        item.status = 'syncing';
        await offlineStorage.saveQueueItem(item);
        this.notify();

        try {
          const res = await fetch(item.endpoint, {
            method: item.method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          });

          const json = await res.json().catch(() => null);

          if (res.ok && json?.success) {
            item.status = 'synced';
            delete item.errorMessage;
            await offlineStorage.saveQueueItem(item);
            result.synced += 1;
            result.items.push({ id: item.id, description: item.description, success: true });
          } else {
            item.status = 'failed';
            item.retryCount += 1;
            item.errorMessage = json?.error || `Failed with HTTP ${res.status}`;
            await offlineStorage.saveQueueItem(item);
            result.failed += 1;
            result.items.push({
              id: item.id,
              description: item.description,
              success: false,
              error: item.errorMessage,
            });
          }
        } catch (fetchErr: unknown) {
          // If network aborted mid-sync, keep as pending and stop syncing remaining
          item.status = 'pending';
          item.retryCount += 1;
          await offlineStorage.saveQueueItem(item);
          break;
        }

        this.notify();
      }

      // Automatically clean up items marked synced
      if (result.synced > 0) {
        await offlineStorage.clearSyncedQueue();
      }
    } finally {
      this.isSyncing = false;
      this.notify();
    }

    return result;
  }

  async getQueue(): Promise<OfflineQueueItem[]> {
    return offlineStorage.getQueue();
  }

  async getPendingCount(): Promise<number> {
    const queue = await offlineStorage.getQueue();
    return queue.filter((i) => i.status === 'pending' || i.status === 'syncing').length;
  }

  async removeQueueItem(id: string): Promise<void> {
    await offlineStorage.removeQueueItem(id);
    this.notify();
  }

  async clearSynced(): Promise<void> {
    await offlineStorage.clearSyncedQueue();
    this.notify();
  }

  getIsSyncing(): boolean {
    return this.isSyncing;
  }
}

export const syncManager = new SyncManager();
