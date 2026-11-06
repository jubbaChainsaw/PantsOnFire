# Audit test execution log — 2026-11-06

Branch: `cursor/ionos-web-deploy-6e4c` (PR #111). No production mutations.

## Node / server / billing

| Command | Result | Notes |
|--------|--------|-------|
| `npm test` | **49 passed** | `tests/**/*.test.mjs` |
| `npm run test:server` | **41 passed** | `tests/server/*.test.mjs` subset |
| `npm run lint:undef` | **exit 0** | `eslint src --max-warnings 0` |

## Playwright E2E (`npm run test:e2e`)

- **Prerequisite:** `npx playwright install chromium --with-deps`
- **First run (earlier session):** 1 failed — `web-player-website.spec.js` used `.font-mono` for lobby code; UI uses `.pof-countdown-digit`. **Fixed** on this branch.
- **Second run (earlier session):** **7 passed**, **1 skipped** (`martin-smoke` Double Take intro — `test.skip`), **0 failed**.
- **Continuation batch 01:** `npm run test:e2e` **not re-run** (time); rely on prior pass above.
- **Screenshot env:** `POF_AUDIT_SHOT_ROOT=/opt/cursor/artifacts/jubba-audit-2026-11-06/e2e-shots` (does not overwrite committed `public/assets/ui/neon/apk-verify/`).

## Mobile bundled smoke (`npm run test:mobile-dist-smoke`)

- **Prerequisite:** `node scripts/buildMobileBundledWeb.mjs dist-android` (produces `dist-android/`, **gitignored**).
- **Continuation batch 01 (2026-11-06 ~19:08 UTC):** **2 passed**, **0 failed**
  - `mobile-bundled-dist-smoke.spec.js` — assets, fonts, core local screens
  - **`mobile-preview-api-proxy-diagnostic.spec.js`** — documents that `vite preview` mobile harness does **not** return JSON for `/api/auth/status` when lobby is absent (SPA fallback or non-API body); **intentional audit diagnostic** for mobile-auth/proxy gap — not a shipping fix.
- Vite preview **stderr:** `http proxy error: /api/auth/status` + `ECONNREFUSED` (nothing listening on `localhost:8787`) — see diagnostic test.

## Not run / gaps

- Full Playwright matrix against **every** round type end-to-end (`martin-smoke` Double Take still skipped — parent **TEST0004**).
- Physical Android device, Play billing, LiveKit voice party in real network conditions.
- Dedicated accessibility audit tooling.
- Production Stripe / RevenueCat (sandbox-only reasoning in findings).
