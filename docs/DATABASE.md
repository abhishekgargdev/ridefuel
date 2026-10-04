# MongoDB Database Architecture & Schema Specification

## 1. Architectural Overview

RideFuel utilizes MongoDB with Mongoose ODM for persistence, structured under a multi-tenant, user-isolated entity-relationship architecture:

```
                  ┌─────────────────┐
                  │      User       │
                  │   (_id, email)  │
                  └────────┬────────┘
                           │ 1:N
                           ▼
                  ┌─────────────────┐
                  │      Bike       │
                  │  (_id, userId)  │
                  └──┬───┬───┬───┬──┘
         ┌───────────┘   │   │   └───────────┐
     1:N │           1:N │   │ 1:N       1:N │
         ▼               ▼   ▼               ▼
  ┌─────────────┐ ┌───────────────┐ ┌─────────────┐ ┌────────────────────┐
  │   FuelLog   │ │ DailyReading  │ │   Expense   │ │ MaintenanceRecord  │
  │ (date, odo, │ │ (date, odo,   │ │ (date, cat, │ │ (date, serviceType,│
  │  qty, price)│ │  trip dist)   │ │  amt, desc) │ │  cost, due date)   │
  └─────────────┘ └───────────────┘ └─────────────┘ └────────────────────┘
```

All non-user collections embed both `userId` and `bikeId` as indexed foreign references. This ensures every query can filter directly on `{ userId, bikeId }` without expensive cross-collection joins.

---

## 2. Collection Schemas & Field Catalog

### A. `users` Collection
Stores rider credentials, profile settings, and measurement standards.

| Field | BSON / Mongoose Type | Required | Default | Index | Description / Constraints |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Yes | Auto | Primary | Unique document identifier. |
| `name` | `String` | Yes | — | None | Full display name (trimmed, 2–50 chars). |
| `email` | `String` | Yes | — | Unique, Sparse | Lowercase, RFC 5322 formatted email. |
| `passwordHash` | `String` | Yes | — | None | Salted bcrypt hash (10 work factor rounds). |
| `currency` | `String` | No | `'₹'` | None | Currency symbol (e.g. `₹`, `$`, `€`). |
| `distanceUnit` | `String` | No | `'km'` | None | Enum constraint: `['km', 'miles']`. |
| `fuelUnit` | `String` | No | `'liters'` | None | Enum constraint: `['liters', 'gallons']`. |
| `resetToken` | `String` | No | — | None | High-entropy single-use password reset token. |
| `resetTokenExpiry`| `Date` | No | — | None | Timestamp after which `resetToken` is void. |
| `createdAt` | `Date` | Yes | `Date.now` | None | Document insertion timestamp (Mongoose). |
| `updatedAt` | `Date` | Yes | `Date.now` | None | Last mutation timestamp (Mongoose). |

**Indexes**:
- `{ email: 1 }` (unique, lowercase)

---

### B. `bikes` Collection
Stores motorcycle hardware specifications, tank metrics, and running odometers.

| Field | BSON / Mongoose Type | Required | Default | Index | Description / Constraints |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Yes | Auto | Primary | Unique bike identifier. |
| `userId` | `ObjectId` | Yes | — | Compound | Foreign key reference to `User._id`. |
| `name` | `String` | Yes | — | None | Rider nickname (e.g. "My Classic 350"). |
| `manufacturer` | `String` | Yes | `'Royal Enfield'` | None | Brand manufacturer. |
| `model` | `String` | Yes | `'Classic 350'` | None | Motorcycle model name. |
| `variant` | `String` | No | `'Dark Edition'` | None | Specific edition or colorway. |
| `year` | `Number` | Yes | `2022` | None | Manufacturing year ($1950 \le \text{year} \le \text{current} + 2$). |
| `registrationNumber` | `String` | No | — | None | RTO license plate number. |
| `purchaseDate` | `Date` | No | — | None | Acquisition date. |
| `initialOdometer` | `Number` | Yes | `0` | None | Starting mileage at onboarding. |
| `currentOdometer` | `Number` | Yes | `0` | None | Latest verified speedometer reading. |
| `tankCapacity` | `Number` | Yes | `13` | None | Total fuel volume in Liters ($> 0$). |
| `reserveCapacity` | `Number` | No | `2.6` | None | Low-fuel reserve trigger threshold ($> 0$). |
| `expectedMileage` | `Number` | Yes | `35` | None | Factory rated fuel economy in km/L ($> 0$). |
| `isActive` | `Boolean` | Yes | `true` | Compound | Active dashboard selection flag. |
| `notes` | `String` | No | — | None | Custom motorcycle notes & modifications. |
| `createdAt` | `Date` | Yes | `Date.now` | Compound | Document creation timestamp. |
| `updatedAt` | `Date` | Yes | `Date.now` | None | Last update timestamp. |

**Indexes**:
- `{ userId: 1, isActive: 1 }` — Fast lookup for rider's currently active bike.
- `{ userId: 1, createdAt: -1 }` — Fleet listing sorted by registration date.

---

### C. `fuellogs` Collection
Stores individual petrol pump refills and calculated efficiency metadata.

| Field | BSON / Mongoose Type | Required | Default | Index | Description / Constraints |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Yes | Auto | Primary | Unique fuel log entry identifier. |
| `userId` | `ObjectId` | Yes | — | Compound | Foreign key reference to `User._id`. |
| `bikeId` | `ObjectId` | Yes | — | Compound | Foreign key reference to `Bike._id`. |
| `date` | `Date` | Yes | — | Compound | Purchase date. |
| `time` | `String` | No | — | None | 24-hour time of refill (`HH:mm`). |
| `odometer` | `Number` | Yes | — | Compound | Speedometer reading at pump ($> 0$). |
| `fuelQuantity` | `Number` | Yes | — | None | Liters pumped ($> 0$). |
| `pricePerLiter` | `Number` | Yes | — | None | Unit cost ($> 0$). |
| `totalAmount` | `Number` | Yes | — | None | Total financial transaction value ($> 0$). |
| `isFullTank` | `Boolean` | Yes | `false` | None | Filled to auto-cutoff (essential for mileage). |
| `fuelStation` | `String` | No | — | None | Station chain (Indian Oil, Shell, HPCL, BPCL). |
| `location` | `String` | No | — | None | Pump address or city. |
| `paymentMethod` | `String` | No | `'UPI'` | None | UPI, Credit Card, Debit Card, Cash. |
| `notes` | `String` | No | — | None | Road condition or highway notes. |
| `distanceSincePrevious` | `Number` | No | `null` | None | Computed delta km since prior fill. |
| `estimatedMileage` | `Number` | No | `null` | None | Full-tank computed mileage ($\text{km/L}$). |
| `costPerKm` | `Number` | No | `null` | None | Run cost ($\text{currency/km}$). |
| `createdAt` | `Date` | Yes | `Date.now` | None | Record timestamp. |
| `updatedAt` | `Date` | Yes | `Date.now` | None | Last update timestamp. |

**Indexes**:
- `{ userId: 1, bikeId: 1, date: -1, odometer: -1 }` — Primary query path for chronological vehicle history and consecutive full-tank interval detection.
- `{ userId: 1, date: -1 }` — High-speed cross-bike expense rollups.

---

### D. `dailyreadings` Collection
Daily odometer checkpoints for trip distance calculation and fuel burn tracking.

| Field | BSON / Mongoose Type | Required | Default | Index | Description / Constraints |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Yes | Auto | Primary | Unique reading identifier. |
| `userId` | `ObjectId` | Yes | — | Compound | Foreign key reference to `User._id`. |
| `bikeId` | `ObjectId` | Yes | — | Compound | Foreign key reference to `Bike._id`. |
| `date` | `Date` | Yes | — | Compound | Reading date. |
| `odometer` | `Number` | Yes | — | Compound | Speedometer reading ($> 0$). |
| `distance` | `Number` | No | `0` | None | Calculated distance traveled on this date. |
| `notes` | `String` | No | — | None | Trip purpose or route details. |
| `createdAt` | `Date` | Yes | `Date.now` | None | Creation timestamp. |
| `updatedAt` | `Date` | Yes | `Date.now` | None | Last update timestamp. |

**Indexes**:
- `{ userId: 1, bikeId: 1, date: -1, odometer: -1 }` — Chronological odometer traversal and rollback validation.
- `{ userId: 1, date: -1 }` — Date range distance aggregation.

---

### E. `expenses` Collection
Non-fuel and general operational expenditures.

| Field | BSON / Mongoose Type | Required | Default | Index | Description / Constraints |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Yes | Auto | Primary | Unique expense identifier. |
| `userId` | `ObjectId` | Yes | — | Compound | Foreign key reference to `User._id`. |
| `bikeId` | `ObjectId` | Yes | — | Compound | Foreign key reference to `Bike._id`. |
| `date` | `Date` | Yes | — | Compound | Expense date. |
| `category` | `String` | Yes | `'Other'` | Compound | Enum: `['Petrol', 'Maintenance', 'Repair', 'Insurance', 'Accessories', 'Cleaning', 'Parking', 'Toll', 'Other']`. |
| `amount` | `Number` | Yes | — | None | Transaction amount ($> 0$). |
| `odometer` | `Number` | No | — | None | Speedometer reading when expense incurred. |
| `description` | `String` | Yes | — | None | Item description (e.g. "Teflon polish"). |
| `notes` | `String` | No | — | None | Additional notes. |
| `receiptUrl` | `String` | No | — | None | Optional receipt or invoice URL. |
| `createdAt` | `Date` | Yes | `Date.now` | None | Creation timestamp. |
| `updatedAt` | `Date` | Yes | `Date.now` | None | Last update timestamp. |

**Indexes**:
- `{ userId: 1, bikeId: 1, date: -1 }` — Motorcycle-specific expense logs.
- `{ userId: 1, category: 1 }` — Fast aggregation by category for pie charts.

---

### F. `maintenancerecords` Collection
Logs completed garage jobs and tracks forward-looking preventive service schedules.

| Field | BSON / Mongoose Type | Required | Default | Index | Description / Constraints |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | Yes | Auto | Primary | Unique maintenance identifier. |
| `userId` | `ObjectId` | Yes | — | Compound | Foreign key reference to `User._id`. |
| `bikeId` | `ObjectId` | Yes | — | Compound | Foreign key reference to `Bike._id`. |
| `serviceType` | `String` | Yes | `'General service'` | None | Enum: `['Engine oil', 'Oil filter', 'Air filter', 'Chain cleaning', 'Chain lubrication', 'Brake inspection', 'Brake replacement', 'Tyres', 'Battery', 'General service', 'Insurance', 'PUC', 'Repair', 'Other']`. |
| `date` | `Date` | Yes | — | Compound | Service completion date. |
| `odometer` | `Number` | Yes | — | None | Speedometer reading at workshop. |
| `amount` | `Number` | Yes | `0` | None | Invoice amount ($\ge 0$). |
| `workshop` | `String` | No | — | None | Garage or mechanic name. |
| `description` | `String` | Yes | — | None | Work details and replaced parts. |
| `nextDueDate` | `Date` | No | — | None | Calendar date threshold for next service. |
| `nextDueOdometer`| `Number` | No | — | None | Target odometer threshold for next service. |
| `status` | `String` | Yes | `'completed'` | Compound | Enum: `['completed', 'upcoming', 'overdue']`. |
| `notes` | `String` | No | — | None | Technician remarks. |
| `createdAt` | `Date` | Yes | `Date.now` | None | Creation timestamp. |
| `updatedAt` | `Date` | Yes | `Date.now` | None | Last update timestamp. |

**Indexes**:
- `{ userId: 1, bikeId: 1, date: -1 }` — Historical service ledger.
- `{ userId: 1, status: 1 }` — Quick filtering for upcoming and overdue alerts.
