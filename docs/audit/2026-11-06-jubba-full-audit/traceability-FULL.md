# JubbaWorld traceability — machine-readable primary artifact

**Source of truth:** `traceability-FULL.json` (129 rows: **119** JubbaWorld items + **10** conversation requirements).

Snapshot: `jubbaworld-snapshot-2026-11-06.json` (fetched 2026-11-06T18:34Z UTC). Inventory markdown copy: `jubbaworld-inventory-2026-11-06.md`.

## Row schema (per item)

| Field | Meaning |
|-------|--------|
| `evidenceClassification` | `verified` \| `partial` \| `untested` \| `deferred` |
| `confidence` | low \| medium \| high |
| `emptyDescription` | 26 items — acceptance **inferred** from title/parent |
| `nextAction` | Evidence-backed follow-up (not “Done”) |

## Generator

```bash
node scripts/audit/buildJubbaWorldTraceability.mjs
```

Heuristic rules + keyword buckets — **parent must not** treat as automatic product sign-off. Deep per-item code review remains manual for rows marked `untested`/`partial`.

## Quick counts (from generator output)

Run: `node -e "const j=require('./traceability-FULL.json'); ..."` — see `findings-FULL.json` → `matrix.evidenceCounts`.

## Special: WTSK0002 / POF-DEC-001

Tracker `Done` **overridden** to **`deferred`** in matrix: PR #112 decision **not** final per user.
