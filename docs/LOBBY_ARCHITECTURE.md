# Lobby Architecture

## Overview

The Pants On Fire online lobby system is an Express app with Socket.IO realtime
events and optional Redis-backed storage. Entry point: `server/lobbyServer.js`.
Lobby rules and state: `server/storage/lobbyStore.js` (in-memory or Redis via
`server/storage/index.js`).

The lobby server is responsible for:

- Creating lobby codes (6 characters from an ambiguity-free alphabet; see
  `LOBBY_CODE_CHARS` in `lobbyStore.js`).
- Allowing players to join, resume, and leave.
- Managing ready state and starting games (host session token required to start).
- Creating rounds, one-word phase, phase advancement, and votes.
- Returning public vs private round data (session token required for private reads).
- Disconnect grace handling and optional LiveKit voice rooms.
- Party chat and voice-activity socket events (session token validated).

## Storage

- **In-memory** — default for local dev (`npm run lobby:server`).
- **Redis** — production; set `REDIS_URL` or `LOBBY_REDIS_URL`. Key prefix:
  `LOBBY_REDIS_KEY_PREFIX` (default `pof:lobby`). Idle lobby TTL defaults to
  24h (`LOBBY_IDLE_TTL_MS` to override).

Entitlements use the same Redis client when Postgres is not configured, under
`ENTITLEMENTS_REDIS_KEY_PREFIX` (default `pof:entitlements`).

## Server authority

The server is authoritative for membership, session tokens, round generation,
liar assignment, voting, and scoring.

Host-validated actions enforced in `lobbyStore.js` / HTTP handlers:

- **Start game** — host session token (`startLobby`).
- **Next round** — host session token (`createNextRound`).
- **Phase advance** — host only (`advanceRoundPhase`; `POST …/round/phase/advance`
  returns `403` `{ "error": "host-only" }` for non-host callers). One-word turn
  timeouts still advance internally by mutating round state (no HTTP caller).
- **Kick player** — host only (`POST /api/lobbies/:code/kick` in
  `server/moderationRoutes.js`).

Not implemented as server endpoints: change rules mid-lobby, end lobby.

## Session tokens

- Issued on join/reclaim; rotated on resume and some mutations.
- Required for private round reads, resume, votes, one-word turns, and
  sensitive socket events.
- TTL: `LOBBY_SESSION_TOKEN_TTL_MS` (default 12h).

## Rate limiting (per IP, in-process)

Defined in `server/rateLimit.js`, wired in `lobbyServer.js`:

| Limiter | Max / minute | Routes |
|---------|----------------|--------|
| create | 10 | `POST /api/lobbies` |
| join | 20 | `POST /api/lobbies/:code/join` |
| resume | 30 | `POST /api/lobbies/:code/resume` |
| lookup | 60 | `GET /api/lobbies/:code`, `GET …/round`, `GET …/round/private` |
| voice token | 12 | `POST /api/lobbies/:code/voice/token` |

Responses: `429` with `{ "error": "rate-limited" }`. Use a shared Redis limiter
before running multiple lobby-server instances.

## Private data

Public snapshots and `GET /api/lobbies/:code/round` redact liar identity and
prompts until reveal. Never broadcast private prompt pairs or pre-reveal liar
ids over party chat.

## REST routes (lobby core)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/health` | `ok`, `service`, `store`, `voice.enabled`, `now` |
| POST | `/api/lobbies` | Create lobby |
| GET | `/api/lobbies/:code` | Public snapshot |
| POST | `/api/lobbies/:code/join` | Join |
| POST | `/api/lobbies/:code/resume` | Reconnect |
| POST | `/api/lobbies/:code/leave` | Leave |
| POST | `/api/lobbies/:code/start` | Host starts match |
| POST | `/api/lobbies/:code/ready` | Ready toggle |
| GET | `/api/lobbies/:code/round` | Public round (rate limited) |
| GET | `/api/lobbies/:code/round/private` | Player view (rate limited) |
| POST | `/api/lobbies/:code/rounds/next` | Host next round |
| POST | `/api/lobbies/:code/round/phase/advance` | Advance phase |
| POST | `/api/lobbies/:code/round/one-word` | One-word turn |
| POST | `/api/lobbies/:code/round/votes` | Submit vote |
| POST | `/api/lobbies/:code/voice/token` | LiveKit token |
| POST | `/api/lobbies/:code/kick` | Host kick |
| POST | `/api/lobbies/:code/report` | Player report |
| POST | `/api/lobbies/:code/complete-hosted-online-game` | Hosted game completion hook |

## Other HTTP modules (same process)

Mounted from `lobbyServer.js`:

- **Auth** — `/api/auth/*` (`server/pofAuthRoutes.js`)
- **Entitlements** — `/api/me/entitlements`, RevenueCat webhook
  (`server/entitlementsRoutes.js`)
- **Stripe billing** — `/api/billing/catalog`, checkout, webhook
  (`server/stripeBillingRoutes.js`); see `docs/WEB_ENTITLEMENTS.md`
- **Profile** — `/api/me/profile` (`server/playerProfileRoutes.js`)
- **Referrals** — `/api/me/referral*`, `/api/referral/invite/:code`
- **Moderation / blocks** — `/api/me/blocks` (`server/moderationRoutes.js`)
- **Account deletion** — `/api/me/delete-account`, public deletion request
- **Content packs** — `/api/content-packs/*`, `/api/me/packs/:id/download`,
  `/api/shell-config` (`server/contentPackRoutes.js`)
- **App install token** — `/api/app/install-token` (hosting gate)
- **Alt card unlocks** — `/api/me/alt-card-unlocks`

See also `docs/railway-deploy.md`, `docs/POF_CLOUD_AUTH.md`,
`docs/ionos-web-deploy.md`.

## Socket.IO

Party chat, lobby snapshots, voice activity, and moderation events. Clients
must authenticate sensitive events with lobby session tokens (see
`docs/ONLINE_SECURITY_MODEL.md`).

## Scaling notes

- Redis-backed lobbies for production.
- HTTPS + `LOBBY_CLIENT_ORIGINS` (or `LOBBY_CLIENT_ORIGIN`).
- Structured logs, metrics, and shared rate limiting at scale.
