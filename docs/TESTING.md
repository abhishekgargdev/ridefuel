# Testing Specification

RideFuel includes automated unit tests for all mathematical calculations and Zod validation schemas, along with manual test protocols.

---

## 1. Automated Test Suite

RideFuel includes two standalone TypeScript test runners located in `tests/`:

### A. Business Logic & Calculations (`tests/calculations.test.ts`)
Executes 20 assertion checkpoints covering:
1. **Insufficient Data Detection**: Confirms that empty or single-fill histories return `hasEnoughData: false` and the exact warning `"Not enough data to calculate mileage."`.
2. **Full-Tank Mileage**: Verifies `(Odometer₂ - Odometer₁) ÷ Liters` across multiple intervals, verifying min, max, recent, and overall averages.
3. **Estimated Fuel & Range**: Validates fuel remaining and distance-to-empty calculations for a 13-liter tank.
4. **Reserve Warning Flag**: Asserts that `isReserveLevel: true` is triggered whenever estimated fuel drops below 2.6 Liters.
5. **Fuel Cost & Average Price**: Tests cumulative volume and weighted fuel prices.
6. **Maintenance Overdue Logic**: Tests odometer-based and date-based overdue flagging.

Run the calculations test suite:
```bash
npx tsx tests/calculations.test.ts
```

### B. Zod Input Validations (`tests/validations.test.ts`)
Executes 7 assertion checkpoints covering:
1. Bike schema boundaries (tank capacities, year limits).
2. Fuel log data types and strict date formatting (`YYYY-MM-DD`).
3. Daily reading odometer validation.
4. Expense category enum restrictions.

Run the validation test suite:
```bash
npx tsx tests/validations.test.ts
```

---

## 2. Manual Verification Checklist

- [x] **Authentication**:
  - Sign in with demo account (`demo@ridefuel.com` / `Password123!`).
  - Sign out and confirm redirect away from `/dashboard`.
- [x] **Fuel Refill**:
  - Record a new full-tank refill.
  - Verify that distance since previous refill and estimated mileage update instantly.
- [x] **Odometer Rollback Guard**:
  - Attempt to enter a daily reading lower than current odometer.
  - Verify error message prompting for correction workflow.
  - Check "Enable Odometer Correction" and verify successful submission.
- [x] **PWA Installability**:
  - Open in desktop Chrome or Android: verify install button appears in header.
  - Open in iOS Safari: verify guided iOS install sheet triggers.
