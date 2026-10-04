# Authentication & Session Management

## 1. Authentication Strategy

RideFuel uses stateless **JSON Web Tokens (JWT)** signed via Web Crypto (`jose`) and transmitted in secure **HTTP-Only Cookies**.

- **Cookie Name**: `ridefuel_token`
- **Algorithm**: HMAC-SHA256 (`HS256`)
- **Expiration**: 30 days (`30d`)
- **Flags**: `httpOnly: true`, `sameSite: 'lax'`, `secure: process.env.NODE_ENV === 'production'`
- **Fallback**: Also accepts `Authorization: Bearer <token>` in API headers for native/CLI clients.

---

## 2. Password Security

- Plaintext passwords never enter the database or logs.
- Hashing is performed using **bcryptjs** with an adaptive salt work factor of 10 rounds (`bcrypt.genSalt(10)`).
- Verification uses constant-time string comparison (`bcrypt.compare`) to prevent timing side-channel attacks.

---

## 3. Session Flow

1. **Sign In / Registration**:
   - The user posts credentials to `/api/auth/login` or `/api/auth/register`.
   - On success, the Route Handler signs a JWT payload:
     ```typescript
     {
       userId: string,
       email: string,
       name: string
     }
     ```
   - Cookie is attached to the `NextResponse`.
2. **Middleware Protection (`middleware.ts`)**:
   - Protects `/dashboard/:path*`.
   - If the `ridefuel_token` cookie is absent, requests are redirected to `/login?redirect=<path>`.
   - If a signed-in rider visits `/login` or `/signup`, they are automatically routed to `/dashboard`.
3. **Route Handler Authorization (`lib/auth/session.ts`)**:
   - Every API handler invokes `requireAuthUser(req)`.
   - Validates the token and retrieves the rider profile.
   - Throws `UNAUTHORIZED` if absent or invalid.
4. **Sign Out (`/api/auth/logout`)**:
   - Expires the `ridefuel_token` cookie immediately (`expires: new Date(0)`).
   - Clears client session and cached offline profile.

---

## 4. Multi-Tenant User Isolation

Every MongoDB query across Bikes, FuelLogs, DailyReadings, Expenses, and MaintenanceRecords enforces:

```typescript
const query = { userId: sessionUser.userId };
```

A user can never read, modify, or delete another rider's motorcycles or telemetry.
