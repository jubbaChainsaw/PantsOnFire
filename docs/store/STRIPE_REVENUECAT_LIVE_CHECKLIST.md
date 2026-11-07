# Stripe live mode + RevenueCat production checklist (research only)

**No live changes from the repo.** Jubba performs these steps in Stripe Dashboard, Google Play Console, RevenueCat, and Railway. Match **sandbox/test** amounts already used in code and UI.

## Price reference (GBP, from product copy)

| SKU | Display | Stripe kind | Play / RC kind |
|-----|---------|-------------|----------------|
| Local Liar | £2.99/mo | Subscription Price | Subscription `local_liar` + base plan `monthly` |
| Suspect | £4.99/mo | Subscription Price | Subscription `suspect` + base plan `monthly` |
| Host with the Most | £9.99/mo | Subscription Price | Subscription `host_most` + base plan `monthly` |
| Twist the Truth | £1.99 one-time | One-time Price | One-time `twist_truth` |
| Each DLC theme pack | £0.99 one-time | One-time Price | One-time `dlc_pack_<slug>` (see `src/billing/googlePlayProductCatalog.js`) |

---

## A. Stripe Dashboard (live mode)

1. Toggle Stripe account to **Live** (top-left test/live switch).
2. **Products →** for each tier, add-on, and DLC pack:
   - Create **live Product** (or duplicate from test) with the same internal naming you use in env vars.
   - Create **live Price** objects at the GBP amounts above (subscriptions = recurring monthly).
   - For DLC: **£0.99** one-time per pack (replace any legacy **£2.99** test prices — see `artifacts/stripe-dlc-pricing.md`).
3. **Developers → Webhooks →** Add endpoint:
   - URL: `https://<production-lobby-host>/api/billing/stripe/webhook`
   - Events: at minimum `checkout.session.completed`
   - Copy **Signing secret** → Railway `STRIPE_WEBHOOK_SECRET` (live value).
4. **Developers → API keys →** reveal **live** secret key → Railway `STRIPE_SECRET_KEY` (`sk_live_…` — never commit).
5. Optional: **Customer portal** / branding — not required for Checkout-only flow.
6. Verify **Checkout success/cancel URLs** match production web:
   - `STRIPE_CHECKOUT_SUCCESS_URL` (should include `?checkout=success` for client refresh)
   - `STRIPE_CHECKOUT_CANCEL_URL`

---

## B. Railway variables (lobby server service)

Replace **test** values with **live** Stripe + production secrets. Names from `server/stripeCatalog.js`, `server/stripeBillingRoutes.js`, `.env.example`, `docs/WEB_ENTITLEMENTS.md`.

| Variable | Action |
|----------|--------|
| `STRIPE_SECRET_KEY` | Set to live `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | Set to live webhook signing secret |
| `STRIPE_PRICE_TIER_LOCAL_LIAR` | Live Price id `price_…` for £2.99/mo |
| `STRIPE_PRICE_TIER_SUSPECT` | Live Price id for £4.99/mo |
| `STRIPE_PRICE_TIER_HOST_MOST` | Live Price id for £9.99/mo |
| `STRIPE_PRICE_ADDON_TWIST_TRUTH` | Live Price id for £1.99 one-time |
| `STRIPE_PRICE_DLC_PACK` | Default live Price id for £0.99 DLC |
| `STRIPE_PRICE_DLC_*` | Optional per-pack overrides (hyphens → underscores) |
| `STRIPE_CATALOG_JSON` | Optional single JSON map if you prefer over individual env vars |
| `STRIPE_CATALOG_DISPLAY_JSON` | Optional display labels only |
| `REVENUECAT_WEBHOOK_SECRET` | Must match RevenueCat webhook Authorization bearer |
| `LOBBY_CLIENT_ORIGINS` | Production web origins (no `*` at launch) |
| `REDIS_URL` / Postgres | Production persistence for lobbies + entitlements |

Redeploy Railway service after saving variables. Hit `/health`, then one **live** Stripe test purchase with a real card (small tier) before announcing.

---

## C. RevenueCat + Google Play

### C1. Google Play Console

1. **Monetize → Products → Subscriptions:** ensure products exist:
   - `local_liar`, `suspect`, `host_most` with base plan **`monthly`** (matches `GOOGLE_PLAY_SUBSCRIPTION_BASE_PLAN_ID`).
2. **One-time products:** `twist_truth`, each `dlc_pack_*` slug from `listGooglePlayProductMappings()`.
3. Set **GBP prices** to match table above.
4. **Monetize → Monetization setup →** link **Google Play service account** to API access (JSON key) — required for RevenueCat to validate purchases.

### C2. RevenueCat project

1. **Project settings → Apps → Android:** connect **Google Play** with the service account JSON (RevenueCat docs: “Play Store Credentials”).
2. Copy the **Google Play API key** (RevenueCat shows a **`goog_…`** public SDK key for the Android app — set in EAS / Expo as `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`; iOS uses `EXPO_PUBLIC_REVENUECAT_IOS_KEY`).
3. **Products:** import/link Play subscription and one-time product ids to **Entitlements**:
   - Entitlement ids should map to server logic (`local_liar`, `suspect`, `host_most`, `twist_truth`, `dlc_pack_<pack>`) — see `mapRevenueCatEntitlements` in `server/entitlementsRoutes.js`.
   - If Play entitlement ids differ, set Railway `REVENUECAT_ENTITLEMENT_TIER_JSON` e.g. `{"play_entitlement_id":"host_most"}`.
4. **Integrations → Webhooks:** URL `https://<production-lobby-host>/api/billing/revenuecat`, Authorization **`Bearer <same as REVENUECAT_WEBHOOK_SECRET>`**.
5. **Customer identity:** ensure purchases use **`app_user_id` = PoF account id** (see `docs/review-2026-06/MOBILE_DEPLOYMENT_READINESS.md`).

### C3. Sandbox → production smoke test

1. License testers on Play internal track → sandbox purchase each tier once.
2. Confirm RevenueCat customer shows active entitlements → Railway webhook **200** → `GET /api/me/entitlements` reflects tier on signed-in account.

---

## D. Subscription prices outside the UK

**Google Play (Android subscriptions & one-times)**

1. Play Console → each subscription → **Pricing →** use **Price templates** or edit **country/region** rows.
2. Enable **local currency conversion** from GBP base or set manual prices per country (Apple-style “equalized” vs custom).
3. After price changes, allow 24h for propagation; RevenueCat reads Play prices — no separate RC price for Play-backed products.

**Stripe (web Checkout)**

1. Each Price → **Currency options** or create **multi-currency Prices** on the same Product.
2. Checkout uses the Price id in env — either one GBP Price (Stripe converts at checkout for some regions) or separate Price ids per major market wired via `STRIPE_CATALOG_JSON`.
3. For strict non-UK pricing, create e.g. `price_eur_local_liar` and document mapping; UK customers keep `STRIPE_PRICE_TIER_*` GBP ids.

**RevenueCat**

- RC does not set Play/App Store prices; it mirrors store receipts. Fix pricing in **Play Console** (Android) and **App Store Connect** (iOS when shipped).
- Use **Offering** metadata for display only; authoritative charge is always the store.

---

## E. Verification before launch

- [ ] Live Stripe webhook deliveries succeed (Dashboard → Webhooks → recent events).
- [ ] Live RevenueCat webhook deliveries succeed (RC → Integrations → webhook history).
- [ ] Web Stripe checkout updates entitlements row in Postgres/Redis.
- [ ] Android purchase updates same row via RC webhook (`app_user_id` matches PoF id).
- [ ] Refund/expiry in RC **downgrades** entitlements (replace semantics — see `tests/server/entitlements.test.mjs`).
- [ ] No test keys (`sk_test_`, test webhook secrets) remain on production Railway.

---

## References in repo

- `artifacts/stripe-dlc-pricing.md` — DLC £0.99 env var list  
- `docs/WEB_ENTITLEMENTS.md` — entitlements model  
- `docs/railway-deploy.md` — Railway + RC webhook URL  
- `src/billing/googlePlayProductCatalog.js` — Play product id map  
- `server/stripeCatalog.js` — Stripe Price id resolution  
