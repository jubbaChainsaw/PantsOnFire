# Bug List — June 2026 Review

Severity per PLAYTEST_PLAN.md (Critical / Major / Minor). Status reflects
this review's changes.

| # | Severity | Bug | Location | Status |
|---|---|---|---|---|
| 1 | Critical | App crashes at load: `DLC_BUNDLE_NAMES_LIST` undefined (ReferenceError during module init, breaks all modes incl. pass-the-phone) | `src/account/tierModel.js:53` | **FIXED** |
| 2 | Critical | Liar identity + both prompts visible to all clients before reveal (public round not redacted) | `server/storage/lobbyStore.js` `toPublicRound` | **FIXED** |
| 3 | Critical | Any joiner can hijack any seat incl. host and receive the victim's session token; join honours `isHost:true`; colliding join deletes victim's player | `server/storage/lobbyStore.js` `upsertPlayer` | **FIXED** |
| 4 | Critical | RevenueCat refunds/expirations never revoke entitlements (merge-up logic) | `server/entitlementsRoutes.js` | **FIXED** |
| 5 | Major | Entitlements lost on server restart (in-memory Map) | `server/entitlementsRoutes.js` | **FIXED** (Redis-backed when `REDIS_URL` set) |
| 6 | Major | Session tokens generated with `Math.random()` (guessable) | `server/storage/lobbyStore.js` | **FIXED** (crypto) |
| 7 | Major | No rate limiting on lobby create/join/lookup/voice-token (code enumeration, spam) | `server/lobbyServer.js` | **FIXED** |
| 8 | Major | Joining with an empty `clientId` removed every other empty-`clientId` player from the lobby | `server/storage/lobbyStore.js` `upsertPlayer` filter | **FIXED** (rewrite) |
| 9 | Major | Dead duplicate Redis store would crash if used (undefined `MIN_PLAYERS`) | `server/storage/redisLobbyStore.js` | **REMOVED** |
| 10 | Major | LiveKit voice tokens valid ~6 h (SDK default, no TTL) | `server/lobbyServer.js` | **FIXED** (15 m) |
| 11 | Major | `party-voice:activity` spoofable by any socket (no session check) | `server/lobbyServer.js` | **FIXED** |
| 12 | Major | 13 of 14 SFX files missing (silent failure; Grill 'Em feedback + reveal stingers absent) | `public/assets/sfx/` vs `src/App.jsx` refs | **OPEN — needs assets** |
| 13 | Major | Dodgy Audio / Clip Trap round types selectable but stubbed (no rules/flow) | `src/data/roundTypes.js`, `src/App.jsx` | **OPEN — hide or implement** |
| 14 | Major | Online lobbies always play Hot Seat with a fixed 20-prompt bank regardless of settings | `server/storage/lobbyStore.js` `buildAuthoritativeRound` | **OPEN — by design for now; document in UI** |
| 15 | Major | Stale lobbies never expire (Redis keys without TTL, memory map unbounded) | `server/storage/lobbyStore.js` | **FIXED** (24 h idle TTL + sweep) |
| 16 | Minor | Chain Reaction round type missing logo asset | `src/data/roundTypes.js` | **OPEN — needs asset** |
| 17 | Minor | Expo shell rendered dev header/footer ("Run Vite: npm run dev") in all builds | `App.js` | **FIXED** (dev-only) |
| 18 | Minor | Webhook secret compared non-constant-time | `server/entitlementsRoutes.js` | **FIXED** |
| 19 | Minor | New Supabase admin client constructed per entitlements request | `server/entitlementsRoutes.js` | **FIXED** (shared client) |
| 20 | Minor | Local demo account passwords stored as base64 | `src/account/accountStorage.js` | **OPEN — acceptable for demo; remove before launch** |

Open items #12, #13, #16 are playtest-facing; #14 is a scope decision; #20 is
a launch gate.
