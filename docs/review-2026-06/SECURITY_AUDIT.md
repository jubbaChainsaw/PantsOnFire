# Security Audit — June 2026 Alpha Review

Scope: online lobby server, Socket.IO events, session/lobby tokens, host
actions, voting, private round data, LiveKit voice, Supabase auth,
RevenueCat entitlements, Expo/WebView bridge.

Severity legend: **Critical** = exploitable leak/hijack or money impact;
**High** = significant abuse or correctness risk; **Medium** = hardening gap;
**Low** = polish.

## Findings — FIXED in this review

### 1. Liar identity and prompts leaked in every public snapshot (Critical) — FIXED
`toPublicRound` (server/storage/lobbyStore.js) stripped per-player prompts but
left `imposterIds`, `imposterPrompt`, and `commonPrompt` in the round object
embedded in every `lobby:snapshot` broadcast and the unauthenticated
`GET /api/lobbies/:code/round`. Any player (or anyone with the lobby code)
could open dev tools and see who the liar was before the reveal.
**Fix:** these fields are now redacted until the round phase reaches
`liar-reveal`/`results`/`final`. Covered by tests.

### 2. Seat/session hijack via join (Critical) — FIXED
`upsertPlayer` matched joiners against existing players by `clientId` *or*
`id` — both of which are visible to everyone in the lobby snapshot — and then
**returned the existing player's live session token** to the caller
(`issueOrReuseSessionToken`). Joining with `clientId` set to the host's
(exposed as `hostClientId` in the snapshot) handed over the host seat and the
host's session token. Joiners could also send `isHost: true` and have it
honoured, and a join with a colliding id/clientId silently deleted the
victim's player entry.
**Fix:** joins can never grant host status or a starting score; reclaiming an
existing seat now requires that seat's valid session token (the client sends
its stored token when rejoining the same lobby) and rotates the token;
otherwise the join is rejected with `client-id-in-use`. Colliding player ids
get a fresh server-generated id and never displace the existing player.
Covered by tests.

### 3. Session tokens and lobby codes from `Math.random()` (High) — FIXED
Session tokens were `Math.random().toString(36)` (≈40 bits, non-CSPRNG and
predictable given V8's xorshift state). Tokens, lobby codes, and ids now come
from `node:crypto` (`randomBytes(24)` base64url tokens, `randomInt` codes).

### 4. No rate limiting anywhere (High) — FIXED
Lobby create/join/resume/lookup and LiveKit token endpoints had no
throttling, allowing lobby-code enumeration (32^6 codes is brute-forceable
without limits) and join spam. A per-IP fixed-window limiter now covers
create (10/min), join (20/min), resume (30/min), lookup (60/min), and voice
token (12/min), with `trust proxy` enabled for correct IPs behind Railway.
Note: the limiter is per-process; use a shared limiter if the server scales
to multiple instances.

### 5. RevenueCat webhook could never downgrade entitlements (High) — FIXED
The webhook handler merged new state with `pickHigherTier`/boolean-OR, so an
EXPIRATION or REFUND event could never lower a user's tier — refunds kept
paid access forever. The webhook now **replaces** entitlement state from the
subscriber payload (which carries the full active set), and acknowledges
without changes when the payload has no subscriber object. Covered by tests.

### 6. Entitlements stored only in process memory (High) — FIXED (when Redis configured)
`mountEntitlementsRoutes` used a `Map`, so every deploy/restart wiped all
purchase state until the next webhook. When `REDIS_URL` is configured the
entitlement store now persists to Redis (`pof:entitlements:<userId>`); the
Map remains the dev fallback. **Manual follow-up:** consider mirroring to a
Supabase table for durability beyond Redis, and trigger a RevenueCat
re-sync on cold start.

### 7. LiveKit tokens had no TTL (Medium) — FIXED
`AccessToken` was issued with the SDK default (6 h). Tokens now carry
`ttl: '15m'`; they only gate room entry so active calls are unaffected.
Issuance already required a valid lobby session (good) and keeps doing so.

### 8. `party-voice:activity` was unauthenticated (Medium) — FIXED
Anyone connected to the socket could spoof talking indicators for any player
in any lobby. The event now requires a valid player session token (the
client transport already tracks the current token and now sends it).

### 9. Webhook secret comparison not constant-time (Low) — FIXED
`auth !== Bearer ${secret}` replaced with `crypto.timingSafeEqual`.

### 10. Stale lobbies never expired (Medium) — FIXED
Redis lobby keys had no TTL and the in-memory store never pruned. Redis
writes now refresh a 24 h idle TTL (`LOBBY_IDLE_TTL_MS` to override); the
in-memory store sweeps idle lobbies on an interval.

### 11. Dead, broken duplicate Redis store (Low) — REMOVED
`server/storage/redisLobbyStore.js` was an older unreferenced implementation
(no round logic, referenced an undefined `MIN_PLAYERS`, and contained the
same hijack flaws). Deleted; `server/storage/index.js` uses the maintained
implementation in `lobbyStore.js`.

## Findings — open / accepted risks (need manual review)

### A. Lobby snapshots are readable with just the lobby code (Medium, accepted)
`GET /api/lobbies/:code`, `GET /api/lobbies/:code/round`, and
`lobby:subscribe` do not require a session. After the redaction fix nothing
private leaks (names, scores, phase only), which matches typical party-game
"room code" semantics, and lookups are now rate-limited. If you want stricter
behaviour, require a session token on `lobby:subscribe` and gate the round
endpoint.

### B. Player `clientId`s still appear in snapshots (Medium)
The client identifies itself in snapshots via `player.clientId ===
onlineClientId` (src/App.jsx ~8543). With the join fix a leaked clientId can
no longer take a seat or token; the residual risk is a targeted
`client-id-in-use` join annoyance. Recommended follow-up refactor: identify
self by `playerId` from the join/resume response and strip `clientId` and
`hostClientId` from `toClientSnapshot`.

### C. Any lobby member can advance the round phase (Medium)
`advanceRoundPhase` validates a session but not host role. Docs
(LOBBY_ARCHITECTURE.md) say phase advancement is host-only; the client lets
any member trigger advancement in some flows, so making it host-only
server-side needs a coordinated client change. Decide the intended design,
then enforce it.

### D. Per-lobby read-modify-write races (Medium)
The HTTP handlers map `lock-timeout` errors, but neither store actually
locks: concurrent joins/votes on the same lobby can clobber each other
(last-writer-wins on the whole lobby JSON). Low impact at party scale on a
single instance; for production scale, add the Redis `SET NX PX` lock
pattern around mutations (the deleted legacy file had a sketch of this).

### E. Disconnect-grace timers and rate limits are per-process (Medium)
`disconnectTimersByLobbyCode` and the limiter live in process memory. With
multiple server instances behind a load balancer, disconnect cleanup and
limits won't coordinate. Fine for one Railway instance; revisit before
horizontal scaling (move to Redis-based presence + limiter).

### F. Client-side demo purchases unlock content locally (High for launch, OK for alpha)
`src/account/accountStorage.js` `purchaseTierDemo`/`purchaseDlcPackDemo`
write unlock flags to localStorage; anyone can self-grant DLC in the web
build. This only affects local/offline content (server entitlements gate
online), but before charging money the client must treat
`/api/me/entitlements` + RevenueCat as the only sources of truth and the
demo purchase paths must be removed or build-flagged off.

### G. Local account passwords are base64, not hashed (Low, demo-only)
`accountStorage.js` encodes passwords with `btoa`. Acceptable only as a
device-local demo; production accounts must be Supabase-only.

### H. CORS defaults to `*` (Low)
`LOBBY_CLIENT_ORIGINS` defaults to allow-all. Set explicit origins in
production (the parsing/wildcard support is already there).

### I. Supabase / RevenueCat trust boundaries (verified OK)
`/api/me/entitlements` validates the Supabase access token server-side with
the service-role client (good); the anon key in the web bundle is by design;
the service key and webhook secret are env-only and not in the repo; the
WebView bridge only forwards `userId`/refresh requests and never grants
entitlements client-side.
