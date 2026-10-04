/**
 * Two-tier Offline Storage Engine (IndexedDB with LocalStorage Fallback)
 * RideFuel Progressive Web App
 */

import { OfflineQueueItem, CachedDataEnvelope } from './types';

const DB_NAME = 'ridefuel_pwa';
const DB_VERSION = 1;
const STORE_QUEUE = 'offline_queue';
const STORE_CACHE = 'cached_data';

const LS_QUEUE_KEY = 'ridefuel_offline_queue_v1';
const LS_CACHE_PREFIX = 'ridefuel_offline_cache_';

class OfflineStorageEngine {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private isIDBAvailable: boolean | null = null;

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private async getDB(): Promise<IDBDatabase | null> {
    if (!this.isBrowser()) return null;
    if (this.isIDBAvailable === false) return null;

    if (!('indexedDB' in window)) {
      this.isIDBAvailable = false;
      return null;
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve) => {
        try {
          const request = window.indexedDB.open(DB_NAME, DB_VERSION);

          request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_QUEUE)) {
              const queueStore = db.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
              queueStore.createIndex('status', 'status', { unique: false });
              queueStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
            if (!db.objectStoreNames.contains(STORE_CACHE)) {
              db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
            }
          };

          request.onsuccess = () => {
            this.isIDBAvailable = true;
            resolve(request.result);
          };

          request.onerror = () => {
            this.isIDBAvailable = false;
            resolve(null);
          };

          request.onblocked = () => {
            this.isIDBAvailable = false;
            resolve(null);
          };
        } catch {
          this.isIDBAvailable = false;
          resolve(null);
        }
      });
    }

    return this.dbPromise;
  }

  // ================= QUEUE OPERATIONS =================

  async getQueue(): Promise<OfflineQueueItem[]> {
    if (!this.isBrowser()) return [];

    const db = await this.getDB();
    if (db) {
      return new Promise((resolve) => {
        try {
          const transaction = db.transaction([STORE_QUEUE], 'readonly');
          const store = transaction.objectStore(STORE_QUEUE);
          const request = store.getAll();

          request.onsuccess = () => {
            const items = (request.result || []) as OfflineQueueItem[];
            // Sort FIFO
            items.sort((a, b) => a.timestamp - b.timestamp);
            resolve(items);
          };

          request.onerror = () => {
            resolve(this.getQueueFromLocalStorage());
          };
        } catch {
          resolve(this.getQueueFromLocalStorage());
        }
      });
    }

    return this.getQueueFromLocalStorage();
  }

  async saveQueueItem(item: OfflineQueueItem): Promise<void> {
    if (!this.isBrowser()) return;

    const db = await this.getDB();
    if (db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction([STORE_QUEUE], 'readwrite');
          const store = transaction.objectStore(STORE_QUEUE);
          const request = store.put(item);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } catch {
        this.saveQueueItemToLocalStorage(item);
        return;
      }
    }

    this.saveQueueItemToLocalStorage(item);
  }

  async removeQueueItem(id: string): Promise<void> {
    if (!this.isBrowser()) return;

    const db = await this.getDB();
    if (db) {
      try {
        await new Promise<void>((resolve) => {
          const transaction = db.transaction([STORE_QUEUE], 'readwrite');
          const store = transaction.objectStore(STORE_QUEUE);
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => resolve();
        });
      } catch {
        // Fallback continues below
      }
    }

    this.removeQueueItemFromLocalStorage(id);
  }

  async clearSyncedQueue(): Promise<void> {
    const queue = await this.getQueue();
    const remaining = queue.filter((i) => i.status !== 'synced');

    const db = await this.getDB();
    if (db) {
      try {
        const transaction = db.transaction([STORE_QUEUE], 'readwrite');
        const store = transaction.objectStore(STORE_QUEUE);
        for (const item of queue) {
          if (item.status === 'synced') {
            store.delete(item.id);
          }
        }
      } catch {
        // Ignored
      }
    }

    this.writeQueueToLocalStorage(remaining);
  }

  // ================= LOCALSTORAGE FALLBACK FOR QUEUE =================

  private getQueueFromLocalStorage(): OfflineQueueItem[] {
    try {
      const raw = localStorage.getItem(LS_QUEUE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.sort((a, b) => a.timestamp - b.timestamp);
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  }

  private writeQueueToLocalStorage(items: OfflineQueueItem[]): void {
    try {
      localStorage.setItem(LS_QUEUE_KEY, JSON.stringify(items));
    } catch {
      // Storage quota exceeded or disabled
    }
  }

  private saveQueueItemToLocalStorage(item: OfflineQueueItem): void {
    const queue = this.getQueueFromLocalStorage();
    const index = queue.findIndex((i) => i.id === item.id);
    if (index >= 0) {
      queue[index] = item;
    } else {
      queue.push(item);
    }
    this.writeQueueToLocalStorage(queue);
  }

  private removeQueueItemFromLocalStorage(id: string): void {
    const queue = this.getQueueFromLocalStorage();
    const filtered = queue.filter((i) => i.id !== id);
    this.writeQueueToLocalStorage(filtered);
  }

  // ================= DATA CACHE OPERATIONS =================

  async setCache<T>(key: string, data: T): Promise<void> {
    if (!this.isBrowser()) return;

    const envelope: CachedDataEnvelope<T> = {
      key,
      data,
      cachedAt: Date.now(),
      version: 1,
    };

    const db = await this.getDB();
    if (db) {
      try {
        await new Promise<void>((resolve) => {
          const transaction = db.transaction([STORE_CACHE], 'readwrite');
          const store = transaction.objectStore(STORE_CACHE);
          const request = store.put(envelope);
          request.onsuccess = () => resolve();
          request.onerror = () => resolve();
        });
      } catch {
        // Fallback continues below
      }
    }

    try {
      localStorage.setItem(LS_CACHE_PREFIX + key, JSON.stringify(envelope));
    } catch {
      // Storage quota or private mode
    }
  }

  async getCache<T>(key: string): Promise<CachedDataEnvelope<T> | null> {
    if (!this.isBrowser()) return null;

    const db = await this.getDB();
    if (db) {
      try {
        const result = await new Promise<CachedDataEnvelope<T> | null>((resolve) => {
          const transaction = db.transaction([STORE_CACHE], 'readonly');
          const store = transaction.objectStore(STORE_CACHE);
          const request = store.get(key);
          request.onsuccess = () => {
            resolve((request.result as CachedDataEnvelope<T>) || null);
          };
          request.onerror = () => resolve(null);
        });

        if (result) return result;
      } catch {
        // Fallback continues
      }
    }

    try {
      const raw = localStorage.getItem(LS_CACHE_PREFIX + key);
      if (!raw) return null;
      return JSON.parse(raw) as CachedDataEnvelope<T>;
    } catch {
      return null;
    }
  }
}

export const offlineStorage = new OfflineStorageEngine();
