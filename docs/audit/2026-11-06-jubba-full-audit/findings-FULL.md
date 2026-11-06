# Jubba full audit — findings (batch 02/03 matrix complete)

**Branch:** `cursor/ionos-web-deploy-6e4c` — **PR #111**  

Historical **frozen deliverable chain** (parent logging): see `findings-FULL.json` → `auditDeliverableCommits` (five SHAs through `0e1c36adce560d7118c43e2735cc42f6f4121e70`). This document and later commits **append** audit evidence; they do not invalidate that chain.

## What this round delivered

- **Extended evidence loader:** `scripts/audit/buildJubbaWorldTraceability.mjs` merges **all** `evidence-batch-*.json` in **lexical order** (batch01 → batch02 → batch03); later files **override** `item.number` fields.
- **`evidence-batch-02.json`:** **105** remaining tracker rows filled via `scripts/audit/generateEvidenceBatch02.mjs` — **explicit per-number overrides**, not keyword rules.
- **`evidence-batch-03.json`:** Link overlays for **REQ0017**, **REQ0009**, **STRY0010/11/24** testRefs; expands **CONV-REQ-REVIEW-AS-PAGE** artifact list.
- **`proposed-tracker-updates.json`:** **REQ0017** implementation evidence + **TEST0005** diagnostic scope note + **REQ0014** package mismatch — **no duplicate server task** (removed from proposed new work).
- **`proposed-new-work-tasks.json`:** Single residual gap — **TEST_STRATEGY.md vs npm-test.yml** doc sync (deduped with **DFCT0040** / **REQ0010**).

## Superpowers

Bundle: `SUPERPOWERS_SKILLS_BUNDLE.md`. Plugin not installed in cloud. **Independent code review:** not available this run.

## Matrix reconciliation (machine check)

| Metric | Value |
|--------|------:|
| Snapshot items | **119** (unique `number` == 119) |
| Conversation rows | **10** |
| Matrix rows | **129** |

**Item `evidenceClassification` counts** (sum **119**): see `traceability-FULL.json` → `itemClassificationCounts` (e.g. `code_proven_partial`, `partial`, `blocked_device_external`, `verified`, `deferred`, `missing`, `blocked_external_owner`).

**Conversation counts** (sum **10**): `partial` + `verified`.

Taxonomy explicitly **avoids** generic `untested`; use `blocked_device_external` / `blocked_external_owner` / `missing` / `deferred` as appropriate.

### Priority themes (evidence pointers)

- **Core loop:** `REQ0005`, `STRY0010`, `STRY0011` — `src/App.jsx` screen machine; `tests/e2e/playwright/martin-smoke.spec.js` (Double Take **still skipped** — **TEST0004**).
- **Historical Done security:** `DFCT0035`, `DFCT0042`, `DFCT0043` — `server/lobbyServer.js` + `tests/server/lobbyHttpRateLimit.test.mjs` / `lobbyStore.test.mjs`.
- **Voice / LiveKit:** `TEST0003`, `CONV-REQ-VOICE-TURN-PHASE` — `server/lobbyServer.js` `/api/lobbies/:code/voice/token`, `src/online/voicePartyTransport.js`; **no device party test**.
- **Entitlements / billing:** `ENHC0013`, `tests/server/entitlements.test.mjs`, `server/stripeBillingRoutes.js` — sandbox/unit; **not live Play/Stripe**.
- **Offline / newest source:** `REQ0019`, `CONV-REQ-PROMPT-SOURCE-SELECTION` — `src/lib/gameSourcePreference.js`, `tests/nativeShell/gameSourceSelection.test.mjs`.
- **Moderation / report:** `CONV-REQ-REPORT-BLOCK-DELETE` — `server/moderationRoutes.js`, `src/lib/lobbyModerationApi.js`, `src/App.jsx` `handleReportLobbyPlayer`.

## REQ0017 (existing item — not a new server epic)

- **Missing (server):** `server/storage/lobbyStore.js` `buildAuthoritativeRound` sets `roundTypeId: 'prompt'` (Hot Seat) only (~353–410).
- **Present (client):** Two Truths screens (`twotruths-input` / `twotruths-voting` / `twotruths-reveal`) in `src/App.jsx` (~9257+).
- **Parent payload:** `proposed-tracker-updates.json` → **REQ0017** note with file anchors.

## TEST0005 (diagnostic scope)

`tests/e2e/playwright/mobile-preview-api-proxy-diagnostic.spec.js` documents that the **Vite preview** mobile harness (`playwright.mobile-dist.config.js`) **does not** return JSON `/api/auth/status` like a live API without a backend. That is **harness limitation**, not proof of production auth failure. Dev proxy: `vite.config.js` forwards `/api` to `localhost:8787`.

## Parent tracker (deduped)

Parent items **ENHC0024**, **ENHC0025**, **TEST0004**, **TEST0005**, **TEST0001/3** — referenced in evidence `linksExistingTracker` and `proposed-tracker-updates.json` **parentReportedUpdates**; no duplicate tasks filed for them.

## Tests (this audit — targeted)

- **Regenerated** matrices only in this message — **did not re-run** full `npm test` / Playwright / mobile smoke (prior log: `AUDIT_TEST_LOG.md`). Run before release: `npm test`, `npm run test:e2e`, `npm run test:mobile-dist-smoke` after `buildMobileBundledWeb`.

## Artifacts for parent Page (exact file paths)

- `docs/audit/2026-11-06-jubba-full-audit/traceability-FULL.json`
- `docs/audit/2026-11-06-jubba-full-audit/findings-FULL.json`
- `docs/audit/2026-11-06-jubba-full-audit/evidence-batch-01.json`
- `docs/audit/2026-11-06-jubba-full-audit/evidence-batch-02.json`
- `docs/audit/2026-11-06-jubba-full-audit/evidence-batch-03.json`
- `docs/audit/2026-11-06-jubba-full-audit/jubbaworld-snapshot-2026-11-06.json`
- `docs/audit/2026-11-06-jubba-full-audit/jubbaworld-snapshot-upload-provenance-8c20.json`
- `docs/audit/2026-11-06-jubba-full-audit/proposed-tracker-updates.json`
- `docs/audit/2026-11-06-jubba-full-audit/proposed-new-work-tasks.json`
- `docs/audit/2026-11-06-jubba-full-audit/AUDIT_TEST_LOG.md`

Optional screenshots: `/opt/cursor/artifacts/jubba-audit-2026-11-06/e2e-shots/*.png`, `.../store-graphics/*.png`

## Remaining after audit

- **Implementation:** REQ0017 server Two Truths authority; REQ0009 full online round-type parity; voice/device tests (TEST0003); Double Take unskip (TEST0004); doc CI drift (see proposed-new-work-tasks).
- **Process:** WTSK0002 decision; Play/org items (REQ0012/3/5/6).

Machine-check: **`findings-FULL.json`** and **`traceability-FULL.json`**.
