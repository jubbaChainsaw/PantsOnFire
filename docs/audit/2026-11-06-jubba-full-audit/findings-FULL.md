# Jubba full audit — findings (evidence baseline)

**Branch:** `cursor/ionos-web-deploy-6e4c` — **PR #111**  
**Commits (audit):** `cbef5d48c4805833b2f74fdecb0acc2ddc434064` (deliverables + E2E fix), `9fb745f749700ecdf684cad8678cedea4a0e5131` (`jubbaworld-pending` entry), `22508a64e4bbc513b79015080466a9e1ef6c6ba8` (findings SHA notes)  
**Status:** **Evidence baseline complete** — per-item **deep code proof** for all **119** rows is **not** claimed; **72** rows remain **`untested`** under audit heuristics (see JSON).

## Superpowers (attached bundle)

Imported text: `SUPERPOWERS_SKILLS_BUNDLE.md` (same content as user upload). The **plugin** is not installed in cloud; workflows applied:

1. **Writing plans** → `plan.md`, `traceability-FULL.md`, this folder layout  
2. **Systematic debugging** → Playwright failure: lobby code selector (`.font-mono` vs `.pof-countdown-digit`)  
3. **Verification before completion** → re-ran full E2E after fix; logged commands in `AUDIT_TEST_LOG.md`  
4. **Independent code review** → **not** available as a separate agent in this run (limitation)

## JubbaWorld baseline

- **119** items mapped **exactly once** by `number` in `traceability-FULL.json`.  
- **+10** conversation requirement rows (distinct from the 119).  
- **26** empty descriptions — rows labeled **`inferred_from_title_or_parent`**.  
- **API limits:** comments/history/acceptance subroutes **unavailable** (403/404) — per snapshot `meta.limitations`.

## Tracker vs evidence (important)

| Metric | Value |
|--------|------|
| Tracker `Done` (snapshot) | 61 |
| Rows classified **`verified`** (audit) | **1** (`POF-ENH-005` → CI workflow file) |
| Tracker `Done` but row still **`untested`**/**`partial`** | **59** (heuristic: no mapped automated proof) |

**`WTSK0002` / `POF-DEC-001`:** Tracker shows **Done** with **progress 0** — classified **`deferred`**; **Jubba decision on PR #112 still pending** → suggested tracker correction in `proposed-tracker-updates.json`.

## Tests actually run

See **`AUDIT_TEST_LOG.md`**. Summary:

- `npm test` — 49 pass  
- `npm run test:server` — 41 pass  
- `npm run lint:undef` — pass  
- `npm run test:e2e` — 7 pass, 1 skip (Double Take)  
- `buildMobileBundledWeb` + `npm run test:mobile-dist-smoke` — 1 pass  

No physical device, no production billing.

## E2E fix (audit-only, minimal)

`tests/e2e/playwright/web-player-website.spec.js` — read lobby code from **`.pof-countdown-digit`** (matches `App.jsx`).

Optional **`POF_AUDIT_SHOT_ROOT`** — screenshots land under `/opt/cursor/artifacts/jubba-audit-2026-11-06/e2e-shots/` without dirtying git assets.

## Prioritized remediation

1. Replace **heuristic `untested`** with **epic-by-epic** code references + tests or explicit **`deferred`** with owner.  
2. **`POF-DEC-001`:** move **off Done** in JubbaWorld until decided.  
3. **ALL CAPS:** complete **div/title** coverage or document exceptions (`CONV-REQ-ALL-CAPS`).  
4. **Client game logic tests** (`docs/TEST_STRATEGY.md`).  
5. Expand Playwright (un-skip Double Take; add online/voice smoke where feasible without device).

## Artifacts for review Page

- `/opt/cursor/artifacts/jubba-audit-2026-11-06/e2e-shots/*.png`  
- `/opt/cursor/artifacts/jubba-audit-2026-11-06/store-graphics/*.png` (copies of `docs/store/graphics/`)  
- `traceability-FULL.json`, `findings-FULL.json`

Machine-check: **`findings-FULL.json`**.
