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
- [x] **Batch 01:** `evidence-batch-01.json` — **no keyword heuristics**; merge via `buildJubbaWorldTraceability.mjs`
- [x] **Batch 02:** `evidence-batch-02.json` from `scripts/audit/generateEvidenceBatch02.mjs` — fills remaining **105** tracker rows
- [x] **Batch 03:** `evidence-batch-03.json` — link overlays + artifact list for Page review

### Task 4: Parent payloads

- [x] `proposed-tracker-updates.json` — REQ0017 evidence note, TEST0005 harness scope, REQ0014 package mismatch; dedup parent updates
- [x] `proposed-new-work-tasks.json` — single doc-CI drift task (deduped)

### Task 5: Evidence capture

- [x] E2E PNGs under `/opt/cursor/artifacts/jubba-audit-2026-11-06/e2e-shots/`
- [x] Store graphics copies under `…/store-graphics/`
