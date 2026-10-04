# REST API Architecture & Endpoint Reference

All API routes follow standard REST conventions and return structured JSON responses.

---

## 1. Response Envelope Standard

### Success Response `(200 OK / 201 Created)`
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response `(4xx / 5xx)`
```json
{
  "success": false,
  "error": "Human-readable explanation of error",
  "details": [ ... ]
}
```

### Standard Status Codes:
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Malformed JSON or invalid syntax.
- `401 Unauthorized`: Missing or expired JWT session token.
- `403 Forbidden`: Resource belongs to another rider.
- `404 Not Found`: Specified document does not exist.
- `409 Conflict`: Unique constraint violation (e.g. email already registered).
- `422 Unprocessable Entity`: Zod schema validation failed, or odometer decrease detected without correction flag.
- `500 Internal Server Error`: Unhandled server runtime error.

---

## 2. Authentication Endpoints

### `POST /api/auth/register`
Creates a new rider profile and automatically provisions a default Royal Enfield Classic 350.
- **Auth**: Public
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "Abhishek Garg",
    "email": "rider@example.com",
    "password": "Password123!"
  }
  ```
- **Response** `(201 Created)`: Sets `ridefuel_token` HTTP-only cookie.
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "654321000000000000000001",
        "name": "Abhishek Garg",
        "email": "rider@example.com",
        "currency": "₹",
        "distanceUnit": "km",
        "fuelUnit": "liters"
      },
      "bike": {
        "id": "654321000000000000000002",
        "name": "Royal Enfield Classic 350",
        "model": "Classic 350",
        "year": 2022
      },
      "message": "Account created successfully"
    }
  }
  ```

---

### `POST /api/auth/login`
Authenticates credentials and establishes session.
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "email": "demo@ridefuel.com",
    "password": "Password123!"
  }
  ```
- **Response** `(200 OK)`: Sets `ridefuel_token` cookie.
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "654321000000000000000001",
        "name": "Abhishek Garg",
        "email": "demo@ridefuel.com"
      },
      "token": "eyJhbGciOi...",
      "message": "Login successful"
    }
  }
  ```

---

### `POST /api/auth/logout`
Terminates user session.
- **Auth**: Public
- **Response** `(200 OK)`: Expire cookie `ridefuel_token=; Max-Age=0`.

---

### `GET /api/auth/me`
Fetches authenticated user profile and all owned motorcycles.
- **Auth**: Required (`ridefuel_token` cookie or `Authorization: Bearer <token>`)
- **Response** `(200 OK)`:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "654321000000000000000001",
        "name": "Abhishek Garg",
        "email": "demo@ridefuel.com",
        "currency": "₹",
        "distanceUnit": "km",
        "fuelUnit": "liters"
      },
      "bikes": [
        {
          "id": "654321000000000000000002",
          "name": "My Classic 350",
          "manufacturer": "Royal Enfield",
          "model": "Classic 350",
          "year": 2022,
          "currentOdometer": 8450,
          "tankCapacity": 13,
          "reserveCapacity": 2.6,
          "expectedMileage": 35.0,
          "isActive": true
        }
      ]
    }
  }
  ```

---

### `PUT /api/auth/me`
Updates user profile and measurement standards.
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "name": "Abhishek G.",
    "currency": "₹",
    "distanceUnit": "km",
    "fuelUnit": "liters"
  }
  ```

---

### `POST /api/auth/forgot-password`
Generates a time-limited password recovery token.
- **Auth**: Public
- **Request Body**: `{ "email": "demo@ridefuel.com" }`
- **Response** `(200 OK)`:
  ```json
  {
    "success": true,
    "data": {
      "message": "Password reset token generated successfully.",
      "demoResetToken": "reset_abc123...",
      "resetUrl": "/reset-password?token=reset_abc123..."
    }
  }
  ```

---

### `POST /api/auth/reset-password`
Applies new password using valid reset token.
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "token": "reset_abc123...",
    "newPassword": "NewPassword123!"
  }
  ```

---

## 3. Motorcycle Fleet Endpoints

### `GET /api/bikes`
List all motorcycles owned by authenticated rider.
- **Auth**: Required
- **Response** `(200 OK)`: Array of bike objects.

### `POST /api/bikes`
Register a new motorcycle.
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "name": "Himalayan 450",
    "manufacturer": "Royal Enfield",
    "model": "Himalayan 450",
    "year": 2024,
    "initialOdometer": 0,
    "currentOdometer": 150,
    "tankCapacity": 17,
    "reserveCapacity": 3.0,
    "expectedMileage": 30.0,
    "isActive": false
  }
  ```

### `GET /api/bikes/[id]`
Get specific motorcycle by ID (scoped to logged-in user).

### `PUT /api/bikes/[id]`
Update motorcycle specifications (scoped to logged-in user).

### `DELETE /api/bikes/[id]`
Deletes motorcycle and cascades deletion across all associated fuel logs, readings, and expenses.

### `POST /api/bikes/[id]/activate`
Switches the motorcycle to be the primary active vehicle for dashboard telemetry.

---

## 4. Fuel Refill Logs Endpoints

### `GET /api/fuel?bikeId=<id>`
List fuel logs chronologically (descending).
- **Query Parameters**:
  - `bikeId` (optional): Filter to a specific motorcycle owned by rider.
- **Response** `(200 OK)`:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "65432...",
        "bikeId": "65432...",
        "date": "2026-10-01",
        "time": "18:15",
        "odometer": 8295,
        "fuelQuantity": 10.2,
        "pricePerLiter": 97.10,
        "totalAmount": 990.42,
        "isFullTank": true,
        "fuelStation": "Shell",
        "paymentMethod": "UPI",
        "distanceSincePrevious": 365,
        "estimatedMileage": 35.78,
        "costPerKm": 2.71
      }
    ]
  }
  ```

### `POST /api/fuel`
Records a fuel purchase. Automatically calculates `distanceSincePrevious`, `estimatedMileage`, and `costPerKm`.
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "bikeId": "65432...",
    "date": "2026-10-02",
    "odometer": 8450,
    "fuelQuantity": 10.0,
    "pricePerLiter": 96.72,
    "totalAmount": 967.20,
    "isFullTank": true,
    "fuelStation": "Indian Oil",
    "paymentMethod": "UPI",
    "notes": "Smooth highway run"
  }
  ```

### `PUT /api/fuel/[id]`
Updates existing fuel log.

### `DELETE /api/fuel/[id]`
Deletes fuel log entry.

---

## 5. Daily Odometer Readings Endpoints

### `GET /api/readings?bikeId=<id>`
List daily readings (descending).

### `POST /api/readings`
Records an end-of-day speedometer reading.
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "bikeId": "65432...",
    "date": "2026-10-03",
    "odometer": 8485,
    "notes": "Evening city ride",
    "allowCorrection": false
  }
  ```
- **Error Behavior**: If `odometer < previousOdometer` and `allowCorrection` is `false`, returns `422 Unprocessable Entity`:
  ```json
  {
    "success": false,
    "error": "New odometer (8300 km) is lower than previous reading (8450 km). If this is an intentional calibration or cluster replacement, enable 'Odometer Correction Workflow'."
  }
  ```

---

## 6. Expenses Endpoints

### `GET /api/expenses?bikeId=<id>`
List recorded expenses.

### `POST /api/expenses`
Create expense record.
- **Request Body**:
  ```json
  {
    "bikeId": "65432...",
    "date": "2026-10-01",
    "category": "Cleaning",
    "amount": 350,
    "odometer": 8400,
    "description": "Foam wash and teflon polish"
  }
  ```

---

## 7. Maintenance Endpoints

### `GET /api/maintenance?bikeId=<id>`
List maintenance records.

### `POST /api/maintenance`
Create maintenance entry.
- **Request Body**:
  ```json
  {
    "bikeId": "65432...",
    "serviceType": "Chain lubrication",
    "date": "2026-10-01",
    "odometer": 8450,
    "amount": 250,
    "workshop": "Home DIY",
    "description": "Motul C1 clean and C2 chain lube applied",
    "nextDueOdometer": 8950,
    "status": "completed"
  }
  ```

---

## 8. Dashboard & Telemetry Aggregations

### `GET /api/dashboard/summary?bikeId=<id>`
Returns 12 key telemetry indicators for active motorcycle:
- `currentOdometer`
- `todaysDistance`
- `estimatedFuel`
- `estimatedRange`
- `averageMileage`
- `averageFuelPrice`
- `totalFuelCost`
- `monthlyFuelCost`
- `monthlyDistance`
- `costPerKm`
- `lastFuelFill`
- `nextMaintenance`

### `GET /api/dashboard/charts?bikeId=<id>&timeRange=<7d|30d|3m|6m|1y|custom>`
Returns chart datasets:
- `mileageOverTime`
- `monthlyDistance`
- `monthlyFuelConsumption`
- `monthlyFuelExpense`
- `petrolPriceTrend`
- `costPerKmTrend`
- `maintenanceExpenses`
- `totalExpensesByCategory`

### `GET /api/analytics/range?bikeId=<id>`
Real-time mathematical fuel volume and range payload.

### `GET /api/reports/monthly?bikeId=<id>`
Monthly financial and distance statements.

### `GET /api/reports/yearly?bikeId=<id>`
Yearly operational summaries.

---

## 9. Seed & Demo Utility

### `POST /api/seed`
Resets the application database to the Royal Enfield Classic 350 (2022) demo fleet.
