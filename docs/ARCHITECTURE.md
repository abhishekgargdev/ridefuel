# Architecture Specification

## Overview

RideFuel is architected as a full-stack, mobile-first Progressive Web Application utilizing Next.js 15 App Router, TypeScript, and MongoDB. The system strictly separates business logic and mathematical calculations from React presentation components.

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│  - App Router Pages (app/dashboard/*, app/(auth)/*)         │
│  - Reusable UI Kit (components/ui/*)                        │
│  - Service Worker (public/sw.js)                            │
│  - Auth Context & Offline Storage (lib/auth/context.tsx)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / Fetch + Cookie
┌──────────────────────────────▼──────────────────────────────┐
│                    API / Route Handlers                     │
│  - Auth Handlers (/api/auth/*)                              │
│  - CRUD Handlers (/api/bikes, /api/fuel, /api/readings...)   │
│  - Analytics & Reports (/api/dashboard/*, /api/reports/*)   │
│  - Request Validation with Zod                              │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Service & Logic Layer                    │
│  - lib/services/mileage-calculator.ts                       │
│  - lib/services/range-calculator.ts                         │
│  - lib/services/fuel-calculator.ts                          │
│  - lib/services/dashboard-service.ts                        │
│  - lib/services/maintenance-service.ts                      │
│  - lib/services/expense-service.ts                          │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│               Repository & Data-Access Layer                │
│  - lib/db/repository.ts (Unified data access)               │
│  - lib/db/mongodb.ts (Connection caching)                   │
│  - models/* (Mongoose Schemas with Indexes)                 │
│  - In-Memory Fallback Store (Zero-configuration resilience) │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                  Persistent Database Store                  │
│                     MongoDB / Atlas                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Frontend Architecture

- **App Router Structure**: Uses Next.js App Router route groups (`app/` for public pages, `app/dashboard/` for authenticated dashboard, `app/api/` for REST route handlers).
- **Client vs Server Components**:
  - Interactive forms, sliders, and chart components use `'use client'`.
  - Layout wrappers and API handlers enforce strict separation.
- **Client-Side Auth Context (`lib/auth/context.tsx`)**:
  - Emits real-time state for `user`, `activeBike`, and `bikes`.
  - Caches user credentials to `localStorage` when offline so the rider can review fuel charts without active cellular coverage.
- **Mobile-First UX**:
  - Floating Quick Action Bar (FAB) providing 1-tap modals for "Add Fuel", "Add Reading", "Add Expense", "Add Maintenance".
  - Large touch targets for roadside use with riding gloves.

---

## 2. Service & Calculation Layer

Calculations are never embedded directly inside React views. They reside in deterministic, pure TypeScript service modules:

- **`lib/services/mileage-calculator.ts`**: Implements the full-tank-to-full-tank algorithm with division-by-zero checks and insufficient data detection.
- **`lib/services/range-calculator.ts`**: Pure function estimating remaining fuel volume and range using verified refills and odometer deltas.
- **`lib/services/dashboard-service.ts`**: Aggregates all 12 key telemetry indicators and formats 8 chart time-series datasets.
- **`lib/services/maintenance-service.ts`**: Compares target mileage against current odometer and target dates against system time to flag overdue maintenance.

---

## 3. Data Access & Repository Layer

- **`lib/db/repository.ts`**:
  - Abstracts database persistence.
  - Queries Mongoose models (`User`, `Bike`, `FuelLog`, `DailyReading`, `Expense`, `MaintenanceRecord`) when connected to MongoDB.
  - Automatically falls back to an in-memory database store (`lib/db/seed-data.ts`) if `MONGODB_URI` is not reachable, enabling seamless local preview and zero test failures.
  - Scopes all queries strictly by `userId` to enforce user isolation.

---

## 4. PWA & Offline Synchronization Architecture

- **Web App Manifest (`app/manifest.ts`)**: Defines standalone display mode, theme colors, icons, and categories.
- **Service Worker (`public/sw.js`)**:
  - Precaches the application shell, icons, and styling assets.
  - Network-first strategy for dynamic API requests, returning friendly 503 offline JSON payloads when disconnected.
- **Offline Indicator (`components/pwa/offline-indicator.tsx`)**: Subtly displays when `navigator.onLine === false`.
