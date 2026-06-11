# Test Strategy

## Objectives

Protect gameplay, lobby stability, purchases, entitlements and future releases.

## Current Automated Coverage

Run with `npm test` (dependency-free `node --test`, in `tests/`):

- Server lobby store: create/join, seat-hijack protection, ready/start,
  round generation and liar assignment, public snapshot redaction, private
  round authorization, vote validation, server-side scoring, resume and
  token expiry.
- Entitlements: RevenueCat entitlement mapping, expiry handling, webhook
  replace/downgrade semantics, webhook authentication.

Client-side game logic is not yet under test; extract pure logic from
App.jsx and add vitest (see docs/review-2026-06/TECHNICAL_DEBT_AND_ROADMAP.md).

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
