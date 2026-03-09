# Deployment Strategy: Render + Neon

Target architecture:

| Component | Provider |
|---|---|
| Frontend | Render |
| Backend | Render |
| Database | Neon |

This repo uses one Render Node service (`server`) that serves both:

- API routes (`/api/...`)
- built frontend assets from `server/public`

So frontend and backend are both on Render, while data lives in Neon.

## 1. Prerequisites

1. Push this repository to GitHub.
2. Create accounts:
   - Render
   - Neon
3. Connect Render to your GitHub account.

## 2. Create a Neon Project + Database

1. In Neon, create a new project.
2. Keep the default database, or create one (for example `travelplanner`).
3. Copy the Neon connection string.
4. Ensure it includes SSL, for example:

```txt
postgresql://<user>:<password>@<host>/<db>?sslmode=require
```

## 3. Create the Render Web Service (Backend + Frontend)

1. In Render, click **New** -> **Web Service**.
2. Select this GitHub repository.
3. Use these settings:
   - Runtime: `Node`
   - Branch: `main`
   - Root Directory: `server`
   - Region: your preference

4. Build Command:

```bash
npm ci
npx prisma generate --no-engine
npx prisma migrate deploy
cd ../client
npm ci
npm run build
mkdir -p ../server/public
rm -rf ../server/public/*
cp -r dist/* ../server/public
```

5. Start Command:

```bash
npm run start:production
```

## 4. Set Render Environment Variables

In your Render web service, set:

1. `DATABASE_URL` = Neon connection string
2. `JWT_SECRET` = random secure secret
3. `NODE_ENV` = `production`
4. Optional:
   - `NOMINATIM_USER_AGENT`
   - `NOMINATIM_REFERER`

Generate `JWT_SECRET` locally:

```bash
openssl rand -hex 32
```

## 5. Deploy

1. Trigger first deploy in Render.
2. Watch logs for:
   - `prisma generate`
   - `prisma migrate deploy`
   - client build copy into `server/public`
   - app startup

3. Open the Render service URL and verify the app loads.

## 6. Seed Initial Data (One Time)

After first successful deploy, open Render Shell and run:

```bash
npx tsx prisma/seed.ts
```

This seed script uses upserts, so reruns are safe.

## 7. Verify End-to-End

1. Sign up a user.
2. Log in.
3. Create/read data-backed entities (experiences, trips, interests).
4. Confirm DB data persists across redeploys/restarts.

## 8. Blueprint Deploy (`render.yaml`)

This repo includes a `render.yaml` already updated for Neon:

- no Render-managed database resource
- `DATABASE_URL` and `JWT_SECRET` are required env vars
- migrations use `prisma migrate deploy`

If using Blueprint in Render:

1. Click **New** -> **Blueprint**.
2. Select this repo.
3. After service creation, set `DATABASE_URL` to your Neon URL.

## 9. Troubleshooting

1. Migration errors during build:
   - Verify `DATABASE_URL` points to Neon and includes `sslmode=require`.

2. App boots but API fails with DB connection errors:
   - Re-check the Neon credentials/host/database in `DATABASE_URL`.

3. Blank frontend:
   - Confirm build copied `client/dist` into `server/public`.

4. Port/listen issue on Render:
   - The server now uses `process.env.PORT` with a fallback, so redeploy after pulling latest changes.
