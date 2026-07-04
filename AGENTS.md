# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Pants on Fire: Find the Liar — a React + Vite party/social-deduction game with an Express/Socket.IO lobby server for online multiplayer. See `README.md` for full details.

### Running services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Vite dev server (frontend) | `npm run dev` | 5173 | Hot-reloads; proxies `/api` and `/socket.io` to lobby server |
| Lobby server (backend) | `npm run lobby:server` | 8787 | In-memory store by default; no Redis required for local dev |

### Key commands

- **Install deps:** `npm install --legacy-peer-deps`
- **Dev server:** `npm run dev`
- **Build:** `npm run build`
- **Lobby server:** `npm run lobby:server`
- **Preview prod build:** `npm run preview`
- **Lint:** `npm run lint`
- **Format:** `npm run format`
- **Test:** `npm run test`
- **Test (watch):** `npm run test:watch`
- **Full CI check:** `npm run check` (lint + test + build)

### Dev mode vs production mode

In **dev mode** (default), all security guards are relaxed:
- Local account auth (base64 in localStorage) is allowed.
- Demo purchase functions work.
- CORS allows all origins.

In **production** (`NODE_ENV=production`):
- Local auth is blocked unless `VITE_ENABLE_LOCAL_AUTH=true`.
- Demo purchases are blocked unless `VITE_ENABLE_DEMO_BILLING=true`.
- CORS requires `LOBBY_CLIENT_ORIGINS` — server exits on startup if not set.
- Frontend requires `VITE_LOBBY_SERVER_URL` — shows error UI if missing.

> **Warning:** Local auth stores passwords as base64 in localStorage. This is NOT secure and is only for offline/demo testing. Never use in a live storefront.

> **Warning:** Demo purchase functions are for offline/local testing only. They must never be enabled in a production app store build.

### Required production env vars

See `README.md` → "Required production environment variables" for the full table.

Key variables:
- **Frontend:** `VITE_LOBBY_SERVER_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Backend:** `NODE_ENV=production`, `LOBBY_CLIENT_ORIGINS`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

### Platform split (product decision)

Web is join/play only. Account creation prompts, purchases, and game hosting are
app-based (Expo shell + RevenueCat). Demo billing stays dev-only.

### Analytics & error monitoring

- Client: `src/lib/monitoring.js` — global error capture + `trackEvent()`. Initialised in `src/main.jsx`.
- Server: `server/telemetryRoutes.js` — rate-limited `/api/telemetry/*` endpoints logging structured JSON to stdout (`[telemetry]` prefix).
- Optional Sentry via `VITE_SENTRY_DSN` (dynamically imported, zero cost unused).
- Event props must never contain personal data (names, emails, chat text).

### Legal pages

`public/legal/privacy.html` and `public/legal/terms.html`, linked from the Settings
screen. Placeholders (`[COMPANY NAME]`, `[CONTACT EMAIL]`, etc.) must be filled in
before launch.

### Supabase entitlement migration

Before deploying in production, run the migration in `docs/supabase-entitlements-migration.sql`.
This creates the `user_entitlements` table used to persist RevenueCat webhook entitlements.
Without it, entitlements reset on server restart.

### Caveats

- The Vite proxy config (`vite.config.js`) forwards `/api` and `/socket.io` to `localhost:8787`. Start the lobby server first if testing online multiplayer features.
- `npm install` requires `--legacy-peer-deps` because `eslint-plugin-react` 7.x has a peer dep conflict with ESLint 10. This is handled automatically in the CI workflow.
- Redis, LiveKit, and Expo are optional — only needed for advanced features (persistent lobbies, voice chat, mobile shell).
- The `sharp` native module is a dependency; `npm install` handles it automatically on supported platforms.
- ESLint covers all of `src/` and `server/` with zero errors. Remaining warnings (unused vars, `console` statements, `react-hooks/set-state-in-effect`) are tracked as non-blocking tech debt; `react-hooks/set-state-in-effect` is downgraded to warn because fixing the ~25 pre-existing call sites requires an invasive `App.jsx` refactor.
