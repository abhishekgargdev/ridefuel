/**
 * Offline Data Caching Helper
 * Provides seamless fallback to previously fetched API responses when offline.
 * RideFuel Progressive Web App
 */

import { offlineStorage } from './offline-storage';

export interface CacheResult<T> {
  data: T | null;
  isCached: boolean;
  cachedAt?: number;
  error?: string;
}

export class OfflineDataCache {
  /**
   * Fetches data with automatic offline fallback:
   * 1. If online: attempts network fetch, saves to local cache on success.
   * 2. If offline or network fails: retrieves previously cached copy.
   */
  static async fetchWithCache<T>(
    url: string,
    cacheKey: string,
    options?: RequestInit
  ): Promise<CacheResult<T>> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (isOnline) {
      try {
        const res = await fetch(url, options);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            // Asynchronously persist to cache
            offlineStorage.setCache(cacheKey, json.data).catch(() => {});
            return {
              data: json.data as T,
              isCached: false,
            };
          }
        }
      } catch {
        // Fallback to cache below
      }
    }

    // Attempt cache retrieval
    const cached = await offlineStorage.getCache<T>(cacheKey);
    if (cached) {
      return {
        data: cached.data,
        isCached: true,
        cachedAt: cached.cachedAt,
      };
    }

    return {
      data: null,
      isCached: false,
      error: 'No offline cached data available. Please connect to the internet to load.',
    };
  }

  static async save<T>(cacheKey: string, data: T): Promise<void> {
    await offlineStorage.setCache(cacheKey, data);
  }

  static async get<T>(cacheKey: string): Promise<CacheResult<T>> {
    const cached = await offlineStorage.getCache<T>(cacheKey);
    if (cached) {
      return {
        data: cached.data,
        isCached: true,
        cachedAt: cached.cachedAt,
      };
    }
    return {
      data: null,
      isCached: false,
    };
  }
}
