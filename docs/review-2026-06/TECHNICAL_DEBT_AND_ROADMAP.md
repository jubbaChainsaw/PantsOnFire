# Technical Debt Review & Prioritised Roadmap — June 2026

## Technical debt assessment

### 1. App.jsx is 10,500+ lines (High)
It owns game state, all screens, online transport glue, voice, audio, host
playback, store UI, and account flows. It works — do **not** rewrite it.
Extract incrementally, tests-first, in this order (lowest risk → highest
value):
1. Pure logic first: local round generation, liar assignment, scoring
   (`calculateRoundResolutionLocal` and friends) → `src/game/` modules with
   unit tests. No behaviour change, big test payoff.
2. Online lobby client state (the ~1,500 lines of session/snapshot/transport
   effects) → a `useOnlineLobby` hook.
3. Screen components into `src/screens/` (mechanical moves).
4. Host/audio playback into a `src/host/` service.
Each step should ship separately and keep pass-the-phone behaviour identical.

### 2. No test infrastructure existed (High — partially addressed)
This review adds a dependency-free `node --test` suite (19 tests) covering
server lobby/session/voting/scoring/redaction and entitlement mapping
(`npm test`). Still missing:
- Client unit tests (needs vitest; pure game logic extraction above makes
  this cheap).
- Socket.IO integration tests (spin up the server in-process).
- A CI workflow running `npm test` + `npm run build` on PRs (there is a
  `.github/workflows` dir — add a test job).

### 3. Client/server duplication of game rules (Medium)
Round phases, scoring, and prompt structures are implemented twice (App.jsx
local flow and server store). Acceptable while online supports only Hot
Seat; if online round-type parity is pursued, extract shared rule data to a
common module consumed by both (the data files are already importable from
the server since everything is ESM).

### 4. Online round generation is a placeholder (Medium)
`SERVER_PROMPT_CATEGORIES` hardcodes 20 prompts. Decide: either ship online
as "Hot Seat quick play" (fine for beta) or port the data-driven
category/theme system server-side. The latter is the single biggest piece of
work hiding in the backlog — scope it deliberately.

### 5. Lobby store concurrency (Medium)
No per-lobby locking; see SECURITY_AUDIT.md finding D. Add a Redis
`SET NX PX` lock helper around mutations when online usage grows.

### 6. Entitlement persistence is two-tier (Medium)
Redis (this review) covers restarts; a Supabase `entitlements` table would
make purchase state queryable/auditable and survive Redis loss. The
`mountEntitlementsRoutes` store interface (async get/set) accepts such an
adapter without further refactoring.

### 7. Snapshot identity uses clientId (Low)
Move client self-identification to `playerId`, then strip
`clientId`/`hostClientId` from snapshots (SECURITY_AUDIT.md finding B).

### 8. Asset pipeline (Low)
Manifest linting exists and is good; add an existence check for SFX and
round-type logos to `scripts/` so missing files fail validation instead of
silently failing at runtime.

## Prioritised implementation roadmap

### Now (done in this review)
- ✅ Fix app-crash bug (tierModel).
- ✅ Close liar-leak, seat-hijack, token, rate-limit, webhook-downgrade holes.
- ✅ Entitlement persistence via Redis; lobby TTLs; LiveKit token TTL.
- ✅ Server test suite + `npm test`.

### Next 1–2 weeks (playtest enablement)
1. Add the 13 missing SFX files; add Chain Reaction logo.
2. Hide Dodgy Audio / Clip Trap from selection (or finish them).
3. Add CI workflow: `npm test` + `npm run build`.
4. Deploy lobby server with Redis + explicit `LOBBY_CLIENT_ORIGINS`; run one
   full internal online session including reconnect.
5. Begin Group 1/2 pass-the-phone playtests.

### Weeks 3–5 (mobile internal testing)
6. Complete app.json (+ icons/splash/permissions) and eas.json.
7. Implement WebView purchase/restore bridge (POF_PURCHASE /
   POF_RESTORE_PURCHASES + native→web replies).
8. RevenueCat products + webhook configured against staging; verify sandbox
   purchase → webhook → entitlement → unlock end-to-end.
9. Play internal testing track; start the 12-tester/14-day closed-test clock.

### Weeks 5–8 (beta hardening)
10. Extract + unit-test local game logic from App.jsx (debt items 1–2).
11. Decide online round-type scope (debt item 4); implement per decision.
12. Supabase entitlements table mirror; remove/flag-off demo purchases.
13. TestFlight (restore purchases, account deletion, 4.2 mitigation: bundle
    the web app for offline pass-the-phone).
14. Privacy policy + data safety forms on both stores.

### Pre-launch gates
- Closed beta crash-free ≥ 99.5%, ALPHA_EXIT_CRITERIA.md fully green.
- Purchase, restore, refund-revocation verified on both platforms.
- Per-lobby locking + shared rate limiting if scaling beyond one instance.
