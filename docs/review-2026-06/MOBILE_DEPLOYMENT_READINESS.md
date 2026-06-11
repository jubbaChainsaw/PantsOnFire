# Mobile Deployment Readiness — June 2026

Verdict: the Expo/WebView + RevenueCat architecture is sound for this game,
but the wrapper is currently a **dev shell**, not a shippable app. Below is
what exists, what's missing, and a concrete store roadmap.

## Current state

- `App.js`: WebView wrapper that loads `EXPO_PUBLIC_GAME_URL` (defaults to
  the local Vite dev server), configures RevenueCat from
  `EXPO_PUBLIC_REVENUECAT_{IOS,ANDROID}_KEY`, and handles two web→native
  messages: `POF_SET_USER` (RevenueCat `logIn`) and
  `POF_REFRESH_ENTITLEMENTS` (`syncPurchases`). Dev header now hidden in
  release builds; `originWhitelist` and `setSupportMultipleWindows={false}`
  added (this review).
- Entitlement flow: purchases happen in RevenueCat → webhook →
  lobby server → web app fetches `/api/me/entitlements` with the Supabase
  token. This is the correct authoritative shape.

## Gaps (must fix before any store submission)

1. **app.json is incomplete**: no `ios.bundleIdentifier`, no
   `android.package`, no icons/splash/adaptive-icon, no permissions
   (microphone is needed for Grill 'Em / voice party in the WebView →
   `android.permission.RECORD_AUDIO`, `NSMicrophoneUsageDescription`).
2. **No eas.json** — define `development`/`preview`/`production` build
   profiles; keep RevenueCat public SDK keys in EAS env config.
3. **No native purchase initiation path** — the WebView can tell native who
   the user is, but there is no `POF_PURCHASE <productId>` /
   `POF_RESTORE_PURCHASES` message handling, and no native→web reply channel
   (`webviewRef.injectJavaScript`/`postMessage`) to confirm results. The web
   store UI currently only has demo purchases. This is the main engineering
   task for monetised mobile builds.
4. **Restore purchases** — required by Apple. Wire a visible "Restore
   purchases" button → `POF_RESTORE_PURCHASES` → `Purchases.restorePurchases()`
   → entitlement refresh.
5. **Bundle the web app or pin the URL** — decide between (a) hosted web URL
   (simplest; needs offline failure UX since pass-the-phone should work
   without network) or (b) bundling the Vite `dist/` into the app and loading
   from file/localhost server. For a party game played in basements, (b) or a
   cached hybrid is strongly recommended for pass-the-phone reliability.
6. **WebView media permissions** — Grill 'Em uses mic/speech in the WebView;
   Android needs `onPermissionRequest` granting and iOS needs
   `mediaCapturePermissionGrantType` configuration in `react-native-webview`.

## RevenueCat product configuration

Map store products → RevenueCat entitlements exactly as the server expects
(`server/entitlementsRoutes.js`):

| Entitlement id (RC) | Server effect |
|---|---|
| `local_liar` / `tier_local_liar` | Local Liar tier |
| `suspect` / `tier_suspect` | Suspect tier |
| `host_most` / `tier_host_most` | Host with the Most tier |
| `twist_truth` | Twist the Truth addon |
| `dlc_pack_<packId>` | Unlocks theme pack `<packId>` (must match ids in `src/data/themeCatalog.js`, e.g. `dlc_pack_ye-olde-baloney`) |

Custom mappings can be supplied via `REVENUECAT_ENTITLEMENT_TIER_JSON`.
Configure the RevenueCat webhook to POST
`https://<lobby-server>/api/billing/revenuecat` with the Authorization header
set to the value in `REVENUECAT_WEBHOOK_SECRET`. **Set `app_user_id` to the
Supabase user id** (the web app already sends it via `POF_SET_USER`).

Note: tier pricing in `src/account/tierModel.js` describes upgrade discounts
("£1.00 upgrade if you already own Local Liar") — on the stores this needs
either subscription tiers with proration or separate upgrade SKUs; flat
non-consumables cannot discount automatically.

## Environment variables (deployment matrix)

| Variable | Where | Notes |
|---|---|---|
| `VITE_LOBBY_SERVER_URL` | web build | falls back to `https://api.pantsonfire.app` off-localhost |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | web build | anon key is public by design |
| `EXPO_PUBLIC_GAME_URL` | EAS build | production web URL |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `..._ANDROID_KEY` | EAS build | public SDK keys |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | lobby server | secret |
| `REVENUECAT_WEBHOOK_SECRET` | lobby server | secret |
| `REDIS_URL` | lobby server | required in production (lobbies + entitlements persistence) |
| `LIVEKIT_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | lobby server | secret |
| `LOBBY_CLIENT_ORIGINS` | lobby server | set explicitly in production (no `*`) |

No secrets were found committed to the repo (checked `.env.production.example`
and scripts).

## Store roadmap

### Phase 1 — Google Play internal testing (target: 1–2 weeks of work)
1. Complete app.json (package id, icons, splash, permissions) + eas.json.
2. Point `EXPO_PUBLIC_GAME_URL` at the deployed web build; verify
   pass-the-phone, online lobby, and voice in the WebView on 2–3 real
   devices (including a low-end Android).
3. Create the Play app, upload an EAS `production` AAB to the **internal
   testing** track (up to 100 testers, no review delay).
4. Configure RevenueCat Android products + license-tester accounts; verify a
   sandbox purchase end-to-end: buy → webhook → `/api/me/entitlements` →
   theme unlock.

### Phase 2 — Google Play closed beta
1. Store listing assets (screenshots, feature graphic, descriptions).
2. **Data safety form**: declare collection of email/user id (Supabase),
   purchase history (RevenueCat), and voice audio in transit (LiveKit; not
   recorded). Privacy policy URL is mandatory.
3. Content rating questionnaire — the 18+ mode must be declared; keep it
   off-by-default and age-gated in-app (already opt-in).
4. Closed testing track; Google now requires 12+ testers for 14 days before
   production access for new personal dev accounts — start this clock early.
5. Crash monitoring (Sentry or Play Vitals) before widening.

### Phase 3 — Apple TestFlight
1. Apple Developer account, bundle id, App Store Connect app.
2. EAS iOS build; TestFlight internal (25 testers) then external (needs
   Beta App Review).
3. **Apple-specific review risks to pre-empt:**
   - Restore purchases button must exist and work.
   - If Supabase social logins are offered, **Sign in with Apple is
     mandatory**; pure email/password is fine without it.
   - Guideline 4.2 (minimum functionality / thin WebView wrappers): bundle
     the web app or demonstrate native integration (purchases, offline play)
     rather than shipping a bare URL wrapper.
   - Account deletion must be available in-app (Supabase delete flow).
4. RevenueCat iOS products + sandbox purchase verification.

### Phase 4 — App Store / Play production release
1. Exit criteria: ALPHA_EXIT_CRITERIA.md complete, closed-beta crash-free
   rate ≥ 99.5%, purchase + restore verified on both platforms, lobby server
   load-tested on Redis.
2. Staged rollout on Play (10% → 50% → 100%); phased release on iOS.
3. Post-launch: monitor RevenueCat webhook failures and lobby server logs;
   keep `REVENUECAT_WEBHOOK_SECRET` rotation documented.

## Privacy / data-safety summary (for both stores)
- Identity: email + user id (Supabase) — account purposes.
- Purchases: RevenueCat (linked to user id).
- Voice: LiveKit real-time audio, not recorded/stored.
- Speech recognition in Grill 'Em uses the device/browser engine — verify
  what the WebView engine sends off-device and disclose if applicable.
- Analytics: none currently shipped (declare "no analytics" until added).
- A privacy policy URL is required for both stores before any external
  testing track.
