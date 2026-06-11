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

## Production Recommendations

- Redis-backed lobby storage.
- Rate limiting.
- Monitoring.
- Audit logging.
- Abuse reporting.
