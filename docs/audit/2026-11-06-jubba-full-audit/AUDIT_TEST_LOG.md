# Audit test execution log — 2026-11-06

Branch: `cursor/ionos-web-deploy-6e4c` (PR #111). No production mutations.

## Node / server / billing

| Command | Result | Notes |
|--------|--------|--------|
| `npm test` | **49 passed** | `tests/**/*.test.mjs` |
| `npm run test:server` | **41 passed** | `tests/server/*.test.mjs` subset |
| `npm run lint:undef` | **exit 0** | `eslint src --max-warnings 0` |

## Playwright E2E (`npm run test:e2e`)

- **Prerequisite:** `npx playwright install chromium --with-deps`
- **First run:** 1 failed — `web-player-website.spec.js` used `.font-mono` for lobby code; UI uses `.pof-countdown-digit`. **Fixed** in commit on this branch.
- **Second run:** **7 passed**, **1 skipped** (`martin-smoke` Double Take intro — `test.skip`), **0 failed**.
- **Screenshot env:** `POF_AUDIT_SHOT_ROOT=/opt/cursor/artifacts/jubba-audit-2026-11-06/e2e-shots` (does not overwrite committed `public/assets/ui/neon/apk-verify/`).

## Mobile bundled smoke (`npm run test:mobile-dist-smoke`)

- **Prerequisite:** `node scripts/buildMobileBundledWeb.mjs dist-android` (produces ~167MB `dist-android/`, **gitignored**).
- **Result:** **1 passed**; Vite preview logged **ECONNREFUSED** for `/api/auth/status` (no lobby server) — **test still passed** (not asserted against that proxy path in this spec).

## Not run / gaps

- Full Playwright matrix against **every round type** end-to-end (martin Double Take remains skipped).
- Physical Android device, Play billing, LiveKit voice party in real network conditions.
- Dedicated accessibility audit tooling.
- Production Stripe / RevenueCat (sandbox-only reasoning in findings).
