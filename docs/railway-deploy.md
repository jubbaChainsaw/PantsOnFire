# Deploy the lobby server to Railway

This repo runs the **multiplayer lobby** as a Node process (`server/lobbyServer.js`). Railway hosts that process and gives you a public `https://…` URL for Socket.IO, REST `/api/lobbies/*`, `/health`, `/api/me/entitlements`, and `/api/billing/revenuecat`.

## What is already configured in the repository

- **`package.json`** — `"start": "node server/lobbyServer.js"` so Railway’s default `npm start` boots the lobby.
- **`railway.toml`** — Nixpacks build, `npm start`, `/health` deploy health check, restart on failure.
- **`src/lib/lobbyApiEnv.js`** — centralises `VITE_LOBBY_SERVER_URL` so production web builds can reach your Railway host (same base used by `lobbyTransport.js` and `fetchRemoteEntitlements`).
- **`.env.example`** — lists `VITE_LOBBY_SERVER_URL` and server secrets you will set in Railway.

---

## Your part — Railway (dashboard)

### 1. Create a Railway account and project

1. Sign up at [railway.app](https://railway.app).
2. Click **New Project**.
3. Choose **Deploy from GitHub repo** (recommended) and select **PantsOnFire** (or fork).
4. Railway will propose a **service** from that repo.

### 2. Point the service at the lobby (not Vite)

By default a Node repo might try to run the wrong command; this repo fixes that via `railway.toml` (`startCommand = "npm start"`).

1. Open your **service → Settings**.
2. Confirm **Root directory** is the **repository root** (where `package.json` lives).
3. Confirm **Start command** is `npm start` (or leave blank if config-as-code overrides it).
4. Trigger **Deploy** and wait for **Active**. Open **Deployments → Logs** if the build fails.

### 3. Assign a stable public URL

1. Service **Settings → Networking → Generate domain** (or attach a custom domain).
2. Copy the HTTPS origin, e.g. `https://pof-lobby-production.up.railway.app` (no trailing slash).
3. Test in a browser: `https://YOUR_DOMAIN/health` should return JSON with `"ok": true`.

### 4. Set environment variables on the Railway service

In **Variables**, add (names match `.env.example`):

| Variable | Purpose |
|----------|---------|
| `LOBBY_CLIENT_ORIGINS` | **Required in production.** Comma-separated exact origins for CORS + Socket.IO. Include your web app **and** the Android WebView origin used by bundled APKs: `https://appassets.androidplatform.net`. Example: `https://pantsonfire.app,https://www.pantsonfire.app,https://appassets.androidplatform.net`. For early testing you may use `*`; tighten before launch. |
| `SUPABASE_URL` | Same value as your Supabase project URL (server-side). |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service role** secret (server only). |
| `REVENUECAT_WEBHOOK_SECRET` | Long random string; RevenueCat webhook will send `Authorization: Bearer <this>`. |

Optional (see `server/lobbyServer.js`):

- `LIVEKIT_*` if you use voice rooms.
- `REDIS_URL` if you switch the lobby store to Redis later.
- `REVENUECAT_ENTITLEMENT_TIER_JSON` if your RC entitlement identifiers need mapping.

**Do not** set `VITE_*` variables on Railway for this service unless you also run a Vite build there; `VITE_*` belongs on whatever **hosts the static web UI** (Netlify, Cloudflare Pages, another Railway static site, etc.).

### 5. Point RevenueCat at Railway

1. In RevenueCat → Webhooks, set URL to:  
   `https://YOUR_RAILWAY_DOMAIN/api/billing/revenuecat`
2. Set the bearer / shared secret to match `REVENUECAT_WEBHOOK_SECRET` in Railway.
3. Send a test event (or complete a sandbox purchase) and check Railway logs for `200` on that route.

---

## Your part — Web / Vite (wherever you host the game UI)

Production builds do **not** use the dev proxy. Set:

```bash
VITE_LOBBY_SERVER_URL=https://YOUR_RAILWAY_DOMAIN
```

Rebuild the client (`npm run build`) and deploy `dist/` to your static host.

Without this, the browser only uses relative `/api` on localhost; on a real domain the app falls back to `VITE_LOBBY_SERVER_FALLBACK_URL` or the built-in default in `lobbyApiEnv.js` (change that default only if you control that hostname).

---

## Your part — Supabase

1. In Supabase **Authentication → URL configuration**, add your **production web origin** to allowed redirect / site URLs.
2. Keep **service role** only on Railway, never in the browser bundle.

---

## Troubleshooting

| Symptom | Likely fix |
|---------|------------|
| Browser CORS errors calling the API | Fix `LOBBY_CLIENT_ORIGINS` to include your exact web origin (scheme + host + port if any). |
| Socket connects then drops | Same CORS/origin issue, or wrong `VITE_LOBBY_SERVER_URL` (typo, `http` vs `https`). |
| `/api/me/entitlements` 503 | `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` missing or wrong on Railway. |
| Webhook 401 | `Authorization: Bearer` on RevenueCat does not match `REVENUECAT_WEBHOOK_SECRET`. |
| Deploy never goes healthy | Check `/health` returns 200; read deploy logs for crash on boot (missing env, port binding). |

Railway injects **`PORT`**; the server already uses `process.env.PORT` (see `server/lobbyServer.js`).

---

## Optional: second Railway service for static UI

You can add a **separate** Railway service that runs `npm run build` then `npm run preview -- --host 0.0.0.0 --port $PORT`, but many teams host the Vite static output on **Netlify / Cloudflare Pages** instead and only pay Railway for the lobby API.
