/**
 * Offline Queue & Synchronization Type Definitions
 * RideFuel Progressive Web App
 */

export type OfflineEntityType = 'fuel' | 'reading' | 'expense' | 'maintenance' | 'bike';
export type OfflineActionType = 'create' | 'update' | 'delete';
export type OfflineItemStatus = 'pending' | 'syncing' | 'failed' | 'synced';

export interface OfflineQueueItem {
  id: string; // Unique UUID
  entityType: OfflineEntityType;
  actionType: OfflineActionType;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload: Record<string, unknown>;
  timestamp: number; // Unix timestamp for FIFO ordering
  clientCreatedAt: string; // ISO date string
  status: OfflineItemStatus;
  retryCount: number;
  errorMessage?: string;
  description: string; // User-readable label, e.g. "Fuel Refill 10.0L @ ₹96.72"
  bikeId?: string;
}

export interface SyncResult {
  total: number;
  synced: number;
  failed: number;
  items: Array<{
    id: string;
    description: string;
    success: boolean;
    error?: string;
  }>;
}

export interface CachedDataEnvelope<T = unknown> {
  data: T;
  cachedAt: number;
  key: string;
  version: number;
}
