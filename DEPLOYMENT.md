# Deployment Guide - Turso + Vercel

This guide walks you through deploying your ticket management app to Vercel with Turso as the database.

## Prerequisites

- [Turso CLI](https://docs.turso.tech/cli/installation) installed
- [Vercel CLI](https://vercel.com/docs/cli) installed (optional, can use web UI)
- GitHub account (for Vercel deployment)

---

## Step 1: Install Dependencies

```bash
pnpm install
```

This will install `@libsql/client` (Turso's SQLite client) instead of `better-sqlite3`.

---

## Step 2: Create Turso Database

### 2.1 Sign up for Turso

```bash
turso auth signup
```

Or login if you already have an account:

```bash
turso auth login
```

### 2.2 Create a new database

```bash
turso db create bnf-tickets
```

### 2.3 Get your database URL

```bash
turso db show bnf-tickets --url
```

Copy the URL (format: `libsql://bnf-tickets-[your-org].turso.io`)

### 2.4 Create an authentication token

```bash
turso db tokens create bnf-tickets
```

Copy the token (starts with `eyJ...`)

---

## Step 3: Configure Environment Variables

### Local Development

Create a `.env.local` file in the project root:

```bash
TURSO_DATABASE_URL=libsql://bnf-tickets-[your-org].turso.io
TURSO_AUTH_TOKEN=eyJ...your-token-here
```

### Initialize the Database Schema

The database schema will be created automatically on first connection. To manually initialize:

```typescript
// You can run this in a Node script or add to your app startup
import { initializeDatabase } from './lib/db';
await initializeDatabase();
```

---

## Step 4: Test Locally

```bash
pnpm dev
```

Visit `http://localhost:3000` and verify the app works with Turso.

---

## Step 5: Deploy to Vercel

### Option A: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy
vercel

# Add environment variables
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN

# Deploy to production
vercel --prod
```

### Option B: Using Vercel Dashboard (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Migrate to Turso database"
   git push
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables**
   - In the "Configure Project" step, add:
     - `TURSO_DATABASE_URL` = your Turso database URL
     - `TURSO_AUTH_TOKEN` = your Turso auth token
   - Click "Deploy"

4. **Initialize Database Schema**
   - After first deployment, visit your app URL
   - The schema will auto-create on first database access
   - Or use Turso CLI to run migrations:
     ```bash
     turso db shell bnf-tickets < schema.sql
     ```

---

## Step 6: Verify Deployment

1. Visit your Vercel deployment URL
2. Create a test user
3. Create a test ticket
4. Verify data persists across page refreshes

---

## Turso Free Tier Limits

- **Storage:** 9 GB
- **Row reads:** 1 billion/month
- **Row writes:** 25 million/month
- **Databases:** 500

More than enough for your ticket management app!

---

## Troubleshooting

### Error: "TURSO_DATABASE_URL environment variable is required"

Make sure you've added the environment variables to Vercel:
- Go to Project Settings → Environment Variables
- Add both `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
- Redeploy the project

### Database connection timeout

Check your Turso database is active:
```bash
turso db list
```

### Schema not created

Manually initialize:
```bash
turso db shell bnf-tickets
```

Then paste the CREATE TABLE statements from `lib/db.ts`.

---

## Migration from Local SQLite (Optional)

If you have existing data in `db/tickets.db`, you can migrate it:

1. **Export data from local SQLite:**
   ```bash
   sqlite3 db/tickets.db .dump > backup.sql
   ```

2. **Import to Turso:**
   ```bash
   turso db shell bnf-tickets < backup.sql
   ```

---

## Cost Estimate

- **Turso:** Free (within limits)
- **Vercel:** Free for hobby projects
- **Total:** $0/month 🎉

---

## Next Steps

- Set up custom domain in Vercel
- Enable Vercel Analytics
- Set up Turso database replicas for lower latency (optional)
