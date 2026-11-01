# Test Strategy

## Objectives

Protect gameplay, lobby stability, purchases, entitlements and future releases.

## Current Automated Coverage

Run with **`npm test`** (Node `node --test` over `tests/**/*.test.mjs`), which
includes:

- `tests/server/` — lobby store, auth, billing catalog, rate limits, hosting gate, etc.
- `tests/billing/` — Google Play product id mapping

**`npm run test:server`** runs only `tests/server/*.test.mjs` (no billing tests).

Other scripts (not part of `npm test` today): Playwright `npm run test:e2e`,
`npm run test:mobile-dist-smoke` (used in the Android debug APK workflow).

Coverage highlights:

- Server lobby store: create/join, seat-hijack protection, ready/start,
  round generation and liar assignment, public snapshot redaction, private
  round authorization, vote validation, server-side scoring, resume and
  token expiry.
- Entitlements: RevenueCat entitlement mapping, expiry handling, webhook
  replace/downgrade semantics, webhook authentication.
- HTTP rate limits: limiter unit tests plus route wiring / 429 behaviour for
  resume and round read endpoints.

Client-side game logic is not yet under test; extract pure logic from
`src/App.jsx` and add vitest (see docs/review-2026-06/TECHNICAL_DEBT_AND_ROADMAP.md).

**CI note:** GitHub Actions workflows (Android, IONOS deploy, media validation)
do not currently run `npm test` on every push — run `npm test` locally or add
a CI job when ready. The Android debug APK workflow **does** run
`test:mobile-dist-smoke`.

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
