# Cloud entitlements data model

Accounts use a **PoF user id** (`pof_accounts.id`) as the canonical key. Legacy Supabase UUIDs still work if Supabase service keys are configured on the server.

## Storage

| Layer | Location | Key |
|-------|----------|-----|
| Production (preferred) | Postgres `pof_entitlements.user_id` | PoF account id |
| Legacy / no Postgres | Redis `pof:entitlements:<userId>` | Same id |
| Local dev | In-memory `Map` | Same |

### Postgres tables

**`pof_accounts`**

| Column | Type |
|--------|------|
| `id` | TEXT PK |
| `email` | TEXT UNIQUE |
| `display_name` | TEXT |
| `password_hash` | TEXT (scrypt) |
| `created_at` | TIMESTAMPTZ |

**`pof_entitlements`**

| Column | Type |
|--------|------|
| `user_id` | TEXT PK → `pof_accounts.id` |
| `tier_id` | TEXT |
| `addon_twist_truth` | BOOLEAN |
| `unlocked_theme_pack_ids` | JSONB array of pack ids |
| `updated_at` | TIMESTAMPTZ |
| `source` | TEXT |

## Row shape (API / merge logic)

```json
{
  "tierId": "fibber | local_liar | suspect | host_most",
  "addonTwistTruth": false,
  "unlockedThemePackIds": ["ye-olde-baloney", "..."],
  "updatedAt": "ISO-8601",
  "source": "default | merged | revenuecat | stripe"
}
```

`mergeEntitlementsRow(prev, next)` in `server/entitlementsRoutes.js`:

- **tierId** — highest rank wins (Fibber &lt; Local Liar &lt; Suspect &lt; Host with the Most).
- **addonTwistTruth** — logical OR.
- **unlockedThemePackIds** — union of pack ids.

## Writers

| Source | Endpoint / trigger | Behaviour |
|--------|-------------------|-----------|
| **RevenueCat** (iOS/Android) | `POST /api/billing/revenuecat` | Replaces row from subscriber entitlements (mobile store purchases). `app_user_id` should be the PoF account id. |
| **Stripe** (web) | `POST /api/billing/stripe/webhook` (`checkout.session.completed`) | Merges tier / add-on / DLC pack from session metadata. |
| **E2E simulate** | `POST /api/billing/simulate-purchase` when `POF_BILLING_SIMULATE=1` | Merges same patches as Stripe (CI only). |

## Readers

| Client | Endpoint |
|--------|----------|
| Web / mobile (signed in) | `GET /api/me/entitlements` with `Authorization: Bearer <PoF JWT>` |

Response (public fields only):

```json
{
  "tierId": "suspect",
  "addonTwistTruth": false,
  "unlockedThemePackIds": []
}
```

The client builds `accountSession` via `buildSessionFromRemote()` in `src/account/remoteEntitlements.js` with `authProvider: 'pof'`.

## Web vs mobile

- **Web** (`www.pantsonfire.app`): join lobbies, buy via **Stripe Checkout**; entitlements sync to Postgres. Hosting games and using theme/persona **content** requires the native app.
- **Mobile**: purchases via **RevenueCat** → webhook updates the **same** entitlements row. Sign in with the same PoF cloud account to see web purchases on device.

## Stripe catalogue (Martin)

Set Price IDs (test or live) on the **lobby server**:

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_TIER_LOCAL_LIAR`, `STRIPE_PRICE_TIER_SUSPECT`, `STRIPE_PRICE_TIER_HOST_MOST`
- `STRIPE_PRICE_ADDON_TWIST_TRUTH`, `STRIPE_PRICE_DLC_PACK` (or per-pack / `STRIPE_CATALOG_JSON`)

Checkout success URL should include `?checkout=success` so the web client refreshes entitlements.

## Live Stripe checklist

1. Create live Products/Prices in Stripe Dashboard; map to env vars or `STRIPE_CATALOG_JSON`.
2. Set live `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` on Railway.
3. Register webhook URL: `https://api.pantsonfire.app/api/billing/stripe/webhook` (events: `checkout.session.completed`).
4. Set `STRIPE_CHECKOUT_SUCCESS_URL` / `STRIPE_CHECKOUT_CANCEL_URL` if not using defaults for `www.pantsonfire.app`.
