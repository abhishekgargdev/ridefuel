# Project Roadmap

The future evolution of RideFuel focuses on connected motorcycle IoT and enhanced offline synchronization.

---

## Phase 1: Core Foundation (Current v1.0.0 Release) ✅
- [x] Full-tank-to-full-tank mileage algorithm.
- [x] Algorithmic Estimated Fuel and Estimated Range telemetry.
- [x] Royal Enfield Classic 350 (2022) baseline configuration with multi-bike garage.
- [x] 12 Dashboard KPI telemetry cards and 8 Recharts analytics graphs.
- [x] Daily odometer reading log with rollback protection.
- [x] Dual-threshold maintenance tracking (odometer km + date).
- [x] Expense book with cost-per-km metrics.
- [x] PWA offline shell with Service Worker caching and install prompts.
- [x] Comprehensive documentation (14 Markdown specifications).

---

## Phase 2: Offline Background Sync & IndexedDB 🔄
- [ ] Implement browser `IndexedDB` caching for pending fuel refill queues.
- [ ] Integrate Service Worker Background Sync API (`sync` event) to replay pump logs automatically when returning to cellular coverage.
- [ ] Export reports to formatted CSV and PDF downloads.

---

## Phase 3: Hardware & OBD-II Integration 🚀
- [ ] Optional Bluetooth OBD-II adapter connection (ELM327) to read real engine RPM, coolant temperature, and battery voltage.
- [ ] Tripper Navigation GPX route export and elevation-adjusted fuel consumption models.
- [ ] Multi-currency fuel logs for international cross-border expeditions.
