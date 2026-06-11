# Test Strategy

## Objectives

Protect gameplay, lobby stability, purchases, entitlements and future releases.

## Unit Tests

Priority areas:

- Scoring.
- Voting.
- Round generation.
- Liar assignment.
- Prompt selection.
- Entitlement calculation.
- DLC resolution.

## Integration Tests

- Socket.IO flows.
- Lobby creation.
- Lobby joining.
- Reconnect behaviour.
- RevenueCat entitlement flows.
- Supabase authentication flows.

## Playtest Validation

- Pass-the-phone sessions.
- Online sessions.
- Voice sessions.
- Mixed device sessions.

## Mobile Validation

- Android purchases.
- Restore purchases.
- Subscription validation.
- Deep links.

## Regression Testing

Every bug fix should include a repeatable test case.

## Release Checklist

- Core gameplay works.
- Lobbies work.
- Purchases work.
- Voice works.
- No critical regressions.
