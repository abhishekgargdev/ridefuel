# Security & Data Isolation Architecture

## 1. Threat Model & Mitigations

| Threat | Mitigation Mechanism |
|---|---|
| **Unauthorized Data Access** | All MongoDB queries are scoped to `userId` from the verified JWT session. Users can never query another rider's documents. |
| **Password Leaks / Rainbow Tables** | Passwords are salted with bcrypt (10 rounds). Password hashes are excluded from all client API responses. |
| **Cross-Site Scripting (XSS)** | React JSX escapes output automatically. Sensitive JWT tokens are stored in `httpOnly` cookies inaccessible to JavaScript. |
| **Cross-Site Request Forgery (CSRF)** | Cookies are set with `SameSite: 'lax'`. JSON API endpoints reject unexpected content-types. |
| **NoSQL Injection** | Input parameters pass strict Zod type constraints before querying Mongoose models. |
| **Odometer Tampering / Error** | Decreasing odometer values are rejected unless the explicit `allowCorrection` workflow is approved. |

---

## 2. API Authorization Layer

Every Route Handler executes an authorization check prior to executing database operations:

```typescript
const { user } = await requireAuthUser(req);
// All repository methods enforce:
const bike = await Repository.getBikeById(bikeId, user.userId);
if (!bike) {
  return errorResponse('Motorcycle not found or unauthorized', 404);
}
```

---

## 3. Cookie Configuration

The `ridefuel_token` cookie is provisioned with:
- `httpOnly: true` (prevents malicious scripts from reading token)
- `secure: true` in production environments
- `sameSite: 'lax'`
- `maxAge: 30 * 24 * 60 * 60` (30 days)
