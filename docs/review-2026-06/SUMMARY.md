# Review Summary — June 2026 Alpha Review

Full reports in this folder: SECURITY_AUDIT.md, PLAYTEST_READINESS.md,
MOBILE_DEPLOYMENT_READINESS.md, BUG_LIST.md, TECHNICAL_DEBT_AND_ROADMAP.md.

## What changed in code (all incremental; no rewrites)

### Server — `server/storage/lobbyStore.js`
- `toPublicRound` now redacts `imposterIds`, `imposterPrompt`,
  `commonPrompt`, and `grillData` until the round reaches
  `liar-reveal`/`results`/`final`. Liar identity can no longer be read from
  snapshots or `GET /api/lobbies/:code/round` before the reveal.
- `upsertPlayer` rewritten: joins can never set `isHost` or a score;
  reclaiming an existing seat requires that seat's valid session token and
  rotates it; otherwise `client-id-in-use` is returned; colliding player ids
  get fresh server ids; players can no longer be displaced/deleted by a
  crafted join.
- Session tokens, lobby codes, and ids now use `node:crypto`
  (24-byte base64url tokens, `randomInt` codes).
- Lobby expiry: Redis writes carry a 24 h idle TTL (refreshed per write,
  `LOBBY_IDLE_TTL_MS` to override); the in-memory store sweeps idle lobbies.
- Removed unused `issueOrReuseSessionToken` (the token-reuse footgun).

### Server — `server/lobbyServer.js`
- Per-IP rate limiting on lobby create/join/resume/lookup and LiveKit token
  endpoints; `trust proxy` enabled; `429 {error:'rate-limited'}` responses.
- LiveKit tokens issued with `ttl: '15m'`.
- `party-voice:activity` now requires a valid player session token.
- Join route passes the optional `sessionToken` through for seat reclaim and
  maps `client-id-in-use` to 409.
- Entitlement store is Redis-backed when `REDIS_URL` is configured
  (`pof:entitlements:<userId>`), Map fallback for dev.

### Server — `server/entitlementsRoutes.js`
- RevenueCat webhook now **replaces** entitlement state from the subscriber
  payload, so expirations/refunds revoke access (previously impossible);
  events without a subscriber payload are acknowledged without changes.
- Webhook auth uses a constant-time comparison.
- Supports async (Redis) stores; shared Supabase admin client; pure helpers
  exported for tests.

### Server — `server/storage/redisLobbyStore.js`
- Deleted: dead, unreferenced legacy implementation that was also broken
  (undefined `MIN_PLAYERS`) and contained the hijack flaws.

### Client
- `src/account/tierModel.js`: fixed the load-time `ReferenceError`
  (`DLC_BUNDLE_NAMES_LIST` now derived from `DLC_THEME_PACKS`) that crashed
  the whole app, including pass-the-phone mode.
- `src/online/lobbyTransport.js`: join accepts an optional session token;
  voice-activity events include the current session token.
- `src/App.jsx`: rejoining the same lobby sends the stored session token so
  same-device seat reclaim still works under the new server rules; friendly
  messages for `client-id-in-use` and `rate-limited`. No gameplay logic
  touched.
- `App.js` (Expo): dev header/footer only render in `__DEV__`;
  `originWhitelist` and `setSupportMultipleWindows={false}` hardening.

### Tests / tooling
- New dependency-free `node --test` suite: `tests/server/lobbyStore.test.mjs`
  (lobby create/join/hijack/ready/start, round generation + liar assignment,
  snapshot redaction, private round auth, vote validation + server scoring,
  resume/expiry) and `tests/server/entitlements.test.mjs` (RevenueCat
  mapping, expiry handling, webhook replace/downgrade semantics, auth).
- `npm test` / `npm run test:server` scripts added.

## Verification performed
- `npm test`: 19/19 pass.
- `npm run build`: succeeds (pre-existing chunk-size warning only).
- Lobby server boot + HTTP smoke test: health OK; join works; host-hijack
  join rejected with `client-id-in-use`; no `imposter*` fields in pre-reveal
  snapshots.

## What was intentionally NOT changed
- Pass-the-phone gameplay, round types, themes, personas, host systems, DLC
  data, account flows — untouched.
- Phase-advance remains any-member (host-only enforcement needs a product
  decision + coordinated client change — see SECURITY_AUDIT.md C).
- `clientId` still appears in snapshots (residual low-risk; follow-up
  refactor described in SECURITY_AUDIT.md B).
- Online round generation still Hot Seat-only (scope decision).

## Needs manual review / action by a human

0. **`dist/` is a stale committed build.** The checked-in `dist/` predates
   these fixes (it still contains the load-crash bug) and is also missing
   newer assets. Rebuild with `npm run build` wherever the web app is
   actually served from, and consider removing `dist/` from version control
   in favour of building at deploy time (Railway can run the build).
1. Source the 13 missing SFX files and the Chain Reaction logo.
2. Decide online round-type scope; hide Dodgy Audio / Clip Trap until built.
3. Deploy with Redis + explicit `LOBBY_CLIENT_ORIGINS`; run a full online
   session end-to-end (incl. reconnect and voice) before Group 3 playtests.
4. RevenueCat: configure products/entitlements per
   MOBILE_DEPLOYMENT_READINESS.md and point the webhook at
   `/api/billing/revenuecat`; verify a sandbox purchase and a refund
   revocation end-to-end.
5. Mobile: app.json identifiers/icons/permissions, eas.json, purchase/restore
   bridge, privacy policy — see the deployment report roadmap.
6. Remove or build-flag the demo purchase paths before charging real money.
