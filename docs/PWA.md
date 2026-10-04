# RideFuel Progressive Web App (PWA) Architecture & Offline Sync Specification

This document details the production-ready Progressive Web App (PWA) architecture, service worker caching strategies, offline persistence layer, honest synchronization pipeline, and the roadmap for advanced multi-device conflict resolution in **RideFuel**.

---

## 1. Architectural Overview

RideFuel is engineered as an offline-first, mobile-optimized Progressive Web App adhering to modern Chromium, WebKit (iOS Safari), and Gecko installability standards.

```
+-----------------------------------------------------------------------------------+
|                                  USER INTERFACE                                   |
|   +---------------------+   +---------------------+   +-----------------------+   |
|   |  PWA Install Button |   |   Offline Indicator |   |  Quick Action Modals  |   |
|   +---------------------+   +---------------------+   +-----------------------+   |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        OFFLINE ABSTRACTION & SYNC PIPELINE                        |
|                                                                                   |
|   [Form Entry]                                                                    |
|        |                                                                          |
|        v                                                                          |
|   [syncManager.submitAction()]                                                    |
|        |                                                                          |
|   +----+--------------------------+                                               |
|   | Online?                       | Offline / Network Failure                     |
|   v                               v                                               |
|  [Direct API Call]          [Offline Queue]                                       |
|   |                               |                                               |
|   v                               v                                               |
|  [MongoDB Persistence]      [Two-Tier Storage: IndexedDB -> LocalStorage]         |
|   |                               |                                               |
|   v                               | (Reconnection: 'online' event or 'Sync Now')  |
|  [Instant Confirmed Success]      v                                               |
|                             [Sync Engine (FIFO Replay)]                           |
|                                   |                                               |
|                                   v                                               |
|                             [API Endpoints: /api/fuel, /api/readings, ...]        |
|                                   |                                               |
|                                   v                                               |
|                             [MongoDB Persistent Database]                         |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                         SERVICE WORKER & CACHE ENGINE                             |
|                                                                                   |
|  * Static Assets & Shell    -> Cache-First (icons, fonts, scripts, styles)        |
|  * HTML Navigation          -> Network-First with Cache / /offline.html Fallback  |
|  * API Routes (/api/*)      -> Network-First with Structured 503 JSON Offline     |
+-----------------------------------------------------------------------------------+
```

---

## 2. Web App Manifest Standards (`app/manifest.ts`)

The manifest is dynamically generated via Next.js App Router metadata conventions at `/manifest.webmanifest`.

| Field | Configuration | Standard / Constraint |
|---|---|---|
| `id` | `'/'` | Unique application identifier for Chromium origin tracking |
| `start_url` | `'/'` | Entry route when launched from mobile home screen |
| `scope` | `'/'` | Restricts navigation scope to application boundaries |
| `name` | `'RideFuel - Motorcycle Fuel & Maintenance'` | Full application name displayed in app stores and install dialogs |
| `short_name` | `'RideFuel'` | **8 characters (<= 12 characters)** to prevent ellipsis truncation on iOS/Android home screens |
| `display` | `'standalone'` | Removes browser URL bars and navigation chrome for native application feel |
| `background_color` | `'#090d16'` | Splash screen background matching dark theme palette |
| `theme_color` | `'#0f172a'` | System status bar and app header tint |
| `orientation` | `'portrait'` | Primary single-hand mobile riding telemetry view |
| `icons` | 192x192 (`any`), 512x512 (`any`), 512x512 (`maskable`) | Fully compliant icon suite with safe-zone padding (Android squircle/circle masks) |

---

## 3. Service Worker & Cache Strategy (`public/sw.js`)

The service worker runs on the client origin, isolated from the UI thread. Cache versioning is tagged `ridefuel-v2`.

### Pre-Cached Static Shell
During the `install` event, the service worker pre-caches critical assets:
- `/` (Home shell)
- `/offline.html` (Dedicated standalone offline shell fallback)
- `/manifest.webmanifest`
- `/icon.svg`
- `/pwa-192x192.png`
- `/pwa-512x512.png`
- `/pwa-maskable-512x512.png`
- `/apple-touch-icon.png`
- `/favicon.ico`

### Cache Routing Rules

1. **Static Assets (`/_next/static/*`, `.png`, `.svg`, `.ico`, `.woff2`, `.css`, `.js`)**:
   - **Strategy**: **Cache-First** with network fallback and dynamic runtime caching.
   - Fast, instant rendering of fonts, icons, and Next.js bundled chunks.
2. **HTML Page Navigation**:
   - **Strategy**: **Network-First** with cache fallback.
   - If user navigates while offline, previously viewed pages load from the cache.
   - If an unvisited page is requested while offline, the service worker seamlessly serves `/offline.html` instead of a browser network error.
3. **API Endpoints (`/api/*`)**:
   - **Strategy**: **Network-First**, never polluting the service worker cache with stale unauthorized credentials or transient states.
   - On network failure, returns an explicit JSON HTTP 503 response:
     ```json
     {
       "success": false,
       "error": "Offline mode active. Real-time server sync unavailable.",
       "offline": true
     }
     ```

---

## 4. Offline Shell (`public/offline.html`)

When an uncached route is requested while offline, `public/offline.html` renders:
- High-contrast dark theme UI styled in pure CSS (no external CDN dependencies).
- Visual status indicator showing *"Offline Shell Active"*.
- Single-tap **"Retry Connection"** action triggering `window.location.reload()`.
- Single-tap **"Go to Cached Dashboard"** link pointing to previously precached `/dashboard`.

---

## 5. Offline Queue & Storage Abstraction

The core requirement of RideFuel's offline engine is an honest abstraction:

$$\text{Offline Queue} \longrightarrow \text{Local Storage / IndexedDB} \longrightarrow \text{Sync} \longrightarrow \text{API} \longrightarrow \text{MongoDB}$$

### Two-Tier Storage Engine (`lib/offline/offline-storage.ts`)

1. **Tier 1 (Primary): IndexedDB (`ridefuel_pwa`)**
   - Object Store 1: `offline_queue` (KeyPath: `id`, Indexes: `status`, `timestamp`)
   - Object Store 2: `cached_data` (KeyPath: `key`)
   - Supports large payloads, non-blocking asynchronous I/O, and structured cloning.
2. **Tier 2 (Fallback): LocalStorage**
   - Key: `ridefuel_offline_queue_v1`
   - Key: `ridefuel_offline_cache_*`
   - Activates automatically in private/incognito browsing or environments where IndexedDB is blocked.

### Offline Queue Item Schema (`lib/offline/types.ts`)

```typescript
export interface OfflineQueueItem {
  id: string; // Unique UUID
  entityType: 'fuel' | 'reading' | 'expense' | 'maintenance' | 'bike';
  actionType: 'create' | 'update' | 'delete';
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload: Record<string, unknown>;
  timestamp: number; // Unix timestamp for FIFO ordering
  clientCreatedAt: string; // ISO 8601 string
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  retryCount: number;
  errorMessage?: string;
  description: string; // e.g. "Fuel Refill: 10.0L @ ₹96.72"
  bikeId?: string;
}
```

---

## 6. Non-Fabrication Policy for Offline Forms

> **Crucial Rule**: When a user submits a form while offline, the application **MUST NEVER** report:
> *"Saved successfully to MongoDB."*

### Honesty Mechanism:
- If `!navigator.onLine` or if the network request fails:
  1. The payload is stored in the **Offline Queue**.
  2. The submission returns:
     ```typescript
     {
       success: true,
       isOffline: true,
       offlineQueued: true,
       message: "Saved to Offline Queue (pending MongoDB sync). Will sync when connection is restored."
     }
     ```
  3. The UI presents an **Amber Offline Badge**:
     `"Saved to Offline Queue (pending MongoDB sync). Will sync when connection is restored."`
  4. The persistent bottom status bar increments the pending queue badge:
     `"Offline Mode Active — 1 form(s) stored in Offline Queue"`
- When online and the request succeeds:
  1. The response returns `isOffline: false`.
  2. The UI reports:
     `"Successfully saved to MongoDB."`

---

## 7. Synchronization Engine (`lib/offline/sync-manager.ts`)

### Replay Lifecycle
1. **FIFO Order Execution**:
   Items are processed in strict ascending chronological order based on `timestamp`. This preserves causal ordering (e.g. an odometer reading of 8500 km logged before a refill at 8535 km is processed first).
2. **State Transition**:
   `pending` $\longrightarrow$ `syncing` $\longrightarrow$ `synced` (or `failed`).
3. **Network Interruption Handling**:
   If connectivity drops during batch synchronization, the currently active item reverts to `pending`, and the queue pauses without dropping data.
4. **Validation Failures (4xx)**:
   If the server rejects a payload due to invalid constraints, the item transitions to `failed`, records the error message, increments `retryCount`, and remains in the user's Queue Drawer for manual review.
5. **Auto-Cleanup**:
   Once items achieve `status: 'synced'`, they are purged from the queue via `clearSyncedQueue()`.

### Automatic & Manual Triggers
- **Automatic**: Subscribes to `window.addEventListener('online')` with a 1.5-second socket stabilization delay.
- **Manual**: User can tap **"Sync Now"** in the `OfflineIndicator` or inspect queued items via the Queue Drawer.

---

## 8. In-App Install Experience (`components/pwa/pwa-install-button.tsx`)

RideFuel provides in-app installation controls across devices:

1. **Chromium (Android / Desktop Chrome / Edge)**:
   - Captures `beforeinstallprompt` event.
   - Renders an **"Install App"** button with download icon.
   - Calls `deferredPrompt.prompt()` and tracks user acceptance (`outcome === 'accepted'`).
2. **iOS Safari (iPhone / iPad)**:
   - Apple WebKit does not implement `beforeinstallprompt`.
   - The button detects iOS via user-agent sniffing and renders **"Add to Home Screen"**.
   - Opens a step-by-step native instruction modal:
     - Step 1: Tap the Safari **Share** icon.
     - Step 2: Scroll down and select **Add to Home Screen**.
     - Step 3: Tap **Add** in the top corner.
3. **Installed State Detection**:
   - Evaluates `window.matchMedia('(display-mode: standalone)').matches` and `navigator.standalone`.
   - When running in standalone mode, the install button automatically unmounts.

---

## 9. Future Synchronization Architecture Roadmap

For multi-device fleets, concurrent riders, and high-latency edge scenarios, RideFuel's sync architecture will evolve across these phases:

### Phase A: Background Sync API Integration
- Utilize `self.registration.sync.register('ridefuel-sync')`.
- Enables the browser to replay the offline queue in the background even if the user closes the PWA tab before reconnecting.

### Phase B: Vector Clocks & Optimistic Concurrency Control (OCC)
- Add `version` and `updatedAt` timestamps to MongoDB schemas.
- If two devices update the motorcycle's odometer concurrently, the server compares version tags:
  - If identical: transaction succeeds, version increments.
  - If mismatched: server applies a domain-specific merge strategy (e.g. `Math.max(serverOdometer, clientOdometer)` with trip distance adjustment).

### Phase C: Delta Sync Protocol
- Instead of re-fetching the entire dataset on reconnection, clients send their `lastSyncedAt` timestamp.
- The server responds with only modified, created, or deleted records (`/api/sync/delta?since=...`), drastically reducing mobile cellular data usage.

---

## 10. Testing & Verification

The PWA test suite (`tests/pwa-offline.test.ts`) verifies:
1. **Manifest Validation**: Evaluates `name`, `short_name <= 12`, `start_url`, `display: standalone`, and icons.
2. **FIFO Queue Ordering**: Validates chronological sorting and item retrieval.
3. **Non-Fabrication Policy**: Verifies that offline submissions strictly flag `isOffline: true`, `offlineQueued: true`, and never claim MongoDB persistence.
4. **Sync State Transitions**: Simulates network interruption, retry counting, and multi-item sync completion.
5. **Storage Fallback**: Validates JSON serialization and two-tier envelope persistence.
