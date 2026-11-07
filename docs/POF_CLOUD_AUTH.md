# PoF cloud accounts (lobby server)

Martin does **not** need Supabase. Cloud sign-in uses the **lobby server** (`api.pantsonfire.app`) with email + password and JWT sessions.

## How it fits together

| Piece | Role |
|-------|------|
| **IONOS** (`www.pantsonfire.app`) | Static Vite build: join lobbies, shop UI, calls lobby API |
| **Railway lobby server** | Auth (`/api/auth/*`), entitlements (`/api/me/entitlements`), Stripe, RevenueCat, lobbies |
| **Railway Postgres** | `pof_accounts` + `pof_entitlements` when `DATABASE_URL` is set |
| **Railway Redis** (optional) | Lobby state; entitlements use Postgres when `DATABASE_URL` is set |

Legacy **Supabase** env vars are optional only if you still have old clients using Supabase JWTs.

## Railway env (lobby service)

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | **Yes** (production) | Railway Postgres plugin connection string |
| `POF_AUTH_JWT_SECRET` | **Yes** | Long random secret (e.g. 32+ bytes); signs access tokens |
| `LOBBY_CLIENT_ORIGINS` | **Yes** | Include `https://www.pantsonfire.app`, `https://pantsonfire.app` |
| `STRIPE_SECRET_KEY` | For web shop | Test `sk_test_…` or live `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | For web shop | From Stripe Dashboard → webhook endpoint |
| `STRIPE_PRICE_*` / `STRIPE_CATALOG_JSON` | For web shop | Price IDs per tier / add-on / DLC |
| `REVENUECAT_WEBHOOK_SECRET` | For mobile IAP | Bearer token RevenueCat sends |
| `REDIS_URL` | Recommended | Lobby persistence (separate from Postgres) |

Do **not** set `POF_BILLING_SIMULATE=1` in production.

### Optional legacy Supabase

Only if migrating old installs: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and client `VITE_SUPABASE_*`.

## API (client)

| Method | Path | Body |
|--------|------|------|
| GET | `/api/auth/status` | `{ configured, provider: "pof" }` |
| POST | `/api/auth/register` | `{ email, password, displayName? }` → `{ access_token, user }` |
| POST | `/api/auth/login` | `{ email, password }` → `{ access_token, user }` |
| GET | `/api/auth/me` | `Authorization: Bearer <token>` |
| GET | `/api/me/entitlements` | Same bearer token |

Mobile apps should log the user in with the same API (or set RevenueCat `app_user_id` to the PoF `user.id` after login).

## Local dev

```bash
POF_AUTH_JWT_SECRET=dev-secret npm run lobby:server
```

Without `DATABASE_URL`, accounts and entitlements use in-memory stores (fine for E2E simulate billing).

## IONOS / GitHub Actions

The deploy workflow only needs the Vite vars baked in the workflow file (`VITE_LOBBY_SERVER_URL`, `VITE_WEB_JOIN_ONLY`). No `VITE_SUPABASE_*` secrets.
