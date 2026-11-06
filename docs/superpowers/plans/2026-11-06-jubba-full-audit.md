# [Jubba full audit] Implementation / evidence plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or human review to work traceability rows task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Evidence-backed traceability for all 119 JubbaWorld items + 10 conversation requirements; no false Done; tests and artifacts recorded.

**Architecture:** Baseline snapshot JSON in `docs/audit/…/`; generator `scripts/audit/buildJubbaWorldTraceability.mjs`; findings in `findings-FULL.*`; Playwright + Node tests as independent signals.

**Tech Stack:** Node 22, Playwright, Vite, Express lobby server (E2E only).

## Global constraints

- No merge/deploy/Play/live billing from audit run  
- No secrets in logs  
- Do not trust tracker Done without repo/test evidence  
- POF-DEC-001 remains **pending decision** until Jubba chooses PR #112 vs branch workflow  

---

## Tasks

### Task 1: Lock baseline snapshot

- [x] Copy `pants-on-fire-jubbaworld-snapshot_8c20.json` → `docs/audit/2026-11-06-jubba-full-audit/jubbaworld-snapshot-2026-11-06.json`
- [x] Copy inventory + Superpowers bundle into `docs/audit/…/`

### Task 2: Automated tests

- [x] `npm test`, `npm run test:server`, `npm run lint:undef`
- [x] `npx playwright install chromium --with-deps`
- [x] `npm run test:e2e` (fix lobby code locator)
- [x] `buildMobileBundledWeb` + `npm run test:mobile-dist-smoke`

### Task 3: Traceability matrix

- [x] Generator script produces `traceability-FULL.json` (119 + 10 rows)
- [ ] Optional: manual refinement per **`untested`** row (ongoing)

### Task 4: Parent payloads

- [x] `proposed-tracker-updates.json` (POF-DEC-001 + global caveats)
- [x] `proposed-new-work-tasks.json` (deduped)

### Task 5: Evidence capture

- [x] E2E PNGs under `/opt/cursor/artifacts/jubba-audit-2026-11-06/e2e-shots/`
- [x] Store graphics copies under `…/store-graphics/`
