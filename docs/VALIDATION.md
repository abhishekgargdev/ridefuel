# Zod Validation Schemas

RideFuel enforces runtime schema validation on every API request using **Zod**.

---

## 1. Authentication Schemas (`lib/validations/auth.ts`)

- **`registerSchema`**:
  - `name`: String, minimum 2 characters, maximum 50.
  - `email`: Valid RFC 5322 email string.
  - `password`: String, minimum 6 characters.
- **`loginSchema`**:
  - `email`: Valid email.
  - `password`: String, minimum 1 character.
- **`forgotPasswordSchema`**:
  - `email`: Valid email.
- **`resetPasswordSchema`**:
  - `token`: Non-empty string.
  - `newPassword`: String, minimum 6 characters.

---

## 2. Motorcycle Schema (`lib/validations/bike.ts`)

- **`bikeSchema`**:
  - `name`: String, 2 to 60 characters.
  - `manufacturer`: Required string (e.g. `'Royal Enfield'`).
  - `model`: Required string (e.g. `'Classic 350'`).
  - `year`: Integer between 1950 and current year + 2.
  - `initialOdometer`: Number $\ge 0$.
  - `currentOdometer`: Number $\ge 0$.
  - `tankCapacity`: Positive number $> 0$, $\le 100$ L.
  - `reserveCapacity`: Number $\ge 0$, $\le 30$ L (defaults to 2.6 L).
  - `expectedMileage`: Positive number $> 0$, $\le 150$ km/L (defaults to 35.0 km/L).

---

## 3. Fuel Log Schema (`lib/validations/fuel.ts`)

- **`fuelLogSchema`**:
  - `bikeId`: Valid ID string.
  - `date`: Regex pattern `^\d{4}-\d{2}-\d{2}$`.
  - `odometer`: Strictly positive number $> 0$.
  - `fuelQuantity`: Strictly positive volume $> 0$.
  - `pricePerLiter`: Strictly positive price $> 0$.
  - `totalAmount`: Strictly positive cost $> 0$.
  - `isFullTank`: Boolean.

---

## 4. Daily Reading Schema (`lib/validations/reading.ts`)

- **`dailyReadingSchema`**:
  - `bikeId`: Valid ID string.
  - `date`: Regex pattern `^\d{4}-\d{2}-\d{2}$`.
  - `odometer`: Strictly positive number $> 0$.
  - `allowCorrection`: Optional boolean (defaults to `false`).

---

## 5. Expense Schema (`lib/validations/expense.ts`)

- **`expenseSchema`**:
  - `category`: Must match one of:
    `['Petrol', 'Maintenance', 'Repair', 'Insurance', 'Accessories', 'Cleaning', 'Parking', 'Toll', 'Other']`
  - `amount`: Number $> 0$.
  - `description`: String between 2 and 200 characters.

---

## 6. Maintenance Schema (`lib/validations/maintenance.ts`)

- **`maintenanceRecordSchema`**:
  - `serviceType`: Must match one of:
    `['Engine oil', 'Oil filter', 'Air filter', 'Chain cleaning', 'Chain lubrication', 'Brake inspection', 'Brake replacement', 'Tyres', 'Battery', 'General service', 'Insurance', 'PUC', 'Repair', 'Other']`
  - `odometer`: Number $\ge 0$.
  - `amount`: Number $\ge 0$.
  - `description`: String between 2 and 300 characters.
  - `status`: Enum `'completed' | 'upcoming' | 'overdue'`.
