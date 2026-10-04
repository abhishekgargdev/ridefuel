# RideFuel - Motorcycle Telemetry, Fuel, Mileage & Maintenance PWA

**RideFuel** is a production-grade Progressive Web Application (PWA) built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **MongoDB with Mongoose**.

The application is engineered primarily around the **Royal Enfield Classic 350 (2022 model, J-series engine)** to solve the infamous erratic motorcycle fuel float gauge issue, with native architectural support for multi-motorcycle fleets.

---

## Key Highlights

- **Algorithmic Fuel & Range Telemetry**: Never represents estimated fuel as a raw hardware sensor reading. Explicitly computes and labels **"Estimated Fuel"** and **"Estimated Range"** derived from full-tank refills, daily odometer increments, and engine displacement efficiency.
- **Full-Tank-to-Full-Tank Mileage**: Implements the authentic calculation standard (`Distance ÷ Refilled Volume`), handling partial refills without corrupting mileage averages. Shows `"Not enough data to calculate mileage."` when fewer than two consecutive full-tank events exist.
- **Reserve Threshold Alerts**: Automatically warns riders when estimated fuel approaches or enters the physical reserve capacity (2.6 L for the 13 L Royal Enfield Classic 350 tank).
- **Rollback Protection**: Prevents accidental odometer decreases on daily readings unless an explicit calibration/cluster replacement workflow is engaged.
- **Dual-Threshold Maintenance Reminders**: Schedules and tracks service jobs (oil changes, chain lubrication, brake inspections) based on whichever milestone comes first: target odometer km OR due date.
- **100% Offline-Capable PWA**: Service Worker caching, install prompts for iOS Safari & Android Chromium, offline status indicators, and background resilience.
- **Pre-Seeded 1-Click Demo**: Out-of-the-box demo credentials (`demo@ridefuel.com` / `Password123!`) populated with genuine Classic 350 history.

---

## Technology Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS v4, Lucide React icons
- **Charts**: Recharts (8 distinct analytics graphs)
- **Database**: MongoDB with Mongoose ORM + Resilient Failover Repository
- **Validation**: Zod
- **Auth**: JWT (Web Crypto via `jose`) with HTTP-Only secure cookies and bcrypt password hashing
- **Deployment**: Vercel / Cloud Run / Node.js standalone

---

## Documentation Index

Explore the comprehensive system documentation in `/docs/`:

1. [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture, data flow, layers
2. [MODULES.md](./MODULES.md) - Detailed catalog of all 20 modules
3. [DATABASE.md](./DATABASE.md) - MongoDB schemas, indexes, collections
4. [API.md](./API.md) - Full REST API endpoint reference and payloads
5. [AUTHENTICATION.md](./AUTHENTICATION.md) - Session handling, tokens, cookies
6. [CALCULATIONS.md](./CALCULATIONS.md) - Mathematical formulas and edge cases
7. [PWA.md](./PWA.md) - Service worker, manifest, offline sync architecture
8. [UI.md](./UI.md) - Component design, mobile-first pump UX
9. [VALIDATION.md](./VALIDATION.md) - Zod schemas and validation rules
10. [SECURITY.md](./SECURITY.md) - Authorization, RBAC, password security
11. [DEPLOYMENT.md](./DEPLOYMENT.md) - Vercel and MongoDB Atlas deployment guide
12. [ENVIRONMENT.md](./ENVIRONMENT.md) - Environment variables reference
13. [TESTING.md](./TESTING.md) - Automated unit tests and manual test cases
14. [ROADMAP.md](./ROADMAP.md) - Future enhancements & features

---

## Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local

# 3. Run development server
npm run dev

# 4. Run calculations & validation unit tests
npx tsx tests/calculations.test.ts
npx tsx tests/validations.test.ts
```

Visit [http://localhost:3000](http://localhost:3000) and click **"Explore Demo with Classic 350"** to test drive.
