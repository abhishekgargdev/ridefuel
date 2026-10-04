# Deployment Guide: Vercel & MongoDB

This guide walks through deploying RideFuel to **Vercel** with a managed **MongoDB Atlas** database.

---

## 1. MongoDB Atlas Setup

1. Create a free or dedicated cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Database Access**, create a database user (e.g. `ridefuel_admin`) with a secure password.
3. Under **Network Access**, add IP `0.0.0.0/0` (allow access from anywhere) so Vercel's serverless functions can connect.
4. Go to **Clusters** → **Connect** → **Drivers** and copy your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/ridefuel?retryWrites=true&w=majority
   ```

---

## 2. Deploying to Vercel

### Option A: Via Vercel Web Dashboard
1. Push this repository to GitHub or GitLab.
2. In Vercel, click **"Add New Project"** and import the repository.
3. In the **Environment Variables** section, configure:
   - `MONGODB_URI`: Your MongoDB Atlas connection URI string.
   - `JWT_SECRET`: A secure random 32+ character string (e.g. generated via `openssl rand -hex 32`).
4. Click **Deploy**. Vercel will run `npm run build` and output the production build.

### Option B: Via Vercel CLI
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Link & Deploy
vercel

# 3. Add Environment Variables
vercel env add MONGODB_URI
vercel env add JWT_SECRET

# 4. Deploy to Production
vercel --prod
```

---

## 3. Initializing Production Database

Once deployed, visit your live URL:
1. Navigate to `/login`.
2. Click **"Sign in as Demo User"** or click **"Settings" → "Reset to Royal Enfield Demo Fleet"**.
3. The application will initialize the demo user (`demo@ridefuel.com` / `Password123!`) and default Royal Enfield Classic 350 telemetry records.
4. You can also sign up with your personal rider email address at `/signup`.
