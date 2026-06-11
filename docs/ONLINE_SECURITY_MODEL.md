# Online Security Model

## Principle

The server is the source of truth.

Clients may display state but should not be trusted for:
- Score calculations
- Liar assignment
- Round generation
- Vote validation
- Entitlement validation
- Host-only actions
- Lobby ownership

## Lobby Security

- Lobby codes should remain server generated.
- Join requests should be rate limited.
- Lobby enumeration should be monitored.
- Host privileges must be validated server-side.

## Session Security

- Session tokens should be short lived.
- Reconnect flows should rotate tokens where practical.
- Expired sessions should be invalidated.

## Socket Security

Validate every incoming event.

Never trust:
- Player IDs
- Scores
- Vote payloads
- Entitlements
- Host flags

## Voice Security

- LiveKit tokens should be short lived.
- Voice access should require valid lobby membership.
- Lobby closure should invalidate voice access.

## Purchase Security

- RevenueCat remains the source of truth.
- Client purchase state is display only.
- Online entitlement checks should be validated server side.

## Implemented Safeguards (June 2026)

- Private round data (liar identity, prompt pair) is redacted from public
  round payloads until the reveal phase.
- Joins cannot claim host status or reclaim another player's seat without
  that seat's valid session token; reclaims rotate the token.
- Session tokens and lobby codes are generated with `node:crypto`.
- Per-IP rate limiting on lobby create/join/resume/lookup and voice-token
  endpoints.
- LiveKit voice tokens are issued with a 15-minute TTL and require a valid
  lobby session.
- Voice-activity and chat socket events require a valid session token.
- RevenueCat webhooks replace entitlement state (downgrades/refunds apply)
  and are verified with a constant-time secret comparison; entitlements
  persist to Redis when configured.
- Idle lobbies expire (24 h TTL in Redis, periodic sweep in memory).

See `docs/review-2026-06/SECURITY_AUDIT.md` for the full audit, including
open items (per-lobby locking, host-only phase advancement, clientId
exposure in snapshots).

## Production Recommendations

- Redis-backed lobby storage.
- Lock CORS to known origins (`LOBBY_CLIENT_ORIGINS`).
- Monitoring.
- Audit logging.
- Abuse reporting.
- Shared (Redis-based) rate limiting before scaling to multiple instances.
