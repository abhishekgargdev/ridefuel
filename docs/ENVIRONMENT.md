# Environment Variables Specification

RideFuel requires the following environment variables configured in `.env.local` (local development) or the Vercel / Cloud Run Secrets dashboard (production).

| Variable Name | Required | Default / Example | Purpose |
|---|---|---|---|
| `MONGODB_URI` | Yes | `mongodb+srv://user:pass@cluster0.mongodb.net/ridefuel` | MongoDB Atlas or local MongoDB connection URI string used by Mongoose. |
| `JWT_SECRET` | Yes | `min-32-character-secret-key-for-session-signing` | Secret key used by `jose` to sign and verify user authentication cookies. |
| `APP_URL` | No | `https://ridefuel.app` | Base application URL used for links and absolute redirection. |
| `GEMINI_API_KEY` | Optional | `AIzaSy...` | Server-only key used for optional AI telemetry diagnostics. |

---

## Local Development Configuration (`.env.local`)

```env
# MongoDB Connection String: Set to MongoDB Atlas or local MongoDB instance URI
MONGODB_URI="mongodb://localhost:27017/ridefuel"

# JWT Secret for Session Authentication & Token Signing (Min 32 characters)
JWT_SECRET="super-secret-jwt-token-key-change-in-production-min-32-chars"

# App URL
APP_URL="http://localhost:3000"
```

> **Note**: If `MONGODB_URI` is omitted or temporarily unreachable during local testing, RideFuel automatically utilizes its in-memory repository store (`lib/db/seed-data.ts`), allowing full local preview and test passes without requiring a running MongoDB server!
