# JubbaWorld traceability — machine-readable primary artifact

**Source of truth:** `traceability-FULL.json` (**129** rows: **119** JubbaWorld items + **10** conversation requirements).

- **Working snapshot:** `jubbaworld-snapshot-2026-11-06.json` (fetched 2026-11-06 18:34Z UTC).
- **Upload provenance copy:** `jubbaworld-snapshot-upload-provenance-8c20.json` (same content as user upload `pants-on-fire-jubbaworld-snapshot_8c20.json`).
- **Per-item evidence (batched):** `evidence-batch-01.json` — generator **does not** apply keyword heuristics.

## Row schema

| Field | Meaning |
|-------|--------|
| `evidenceClassification` | `pending_examination` until a batch fills the row; then `verified` \| `partial` \| `missing` \| `blocked` \| `deferred` as appropriate |
| `implementationRefs` | Human-entered path snippets (often `file:anchor`) |
| `testRefs` | Automated test files or cases |
| `nextAction` | Concrete follow-up; never “epic test 72 items” |

## Generator

```bash
node scripts/audit/buildJubbaWorldTraceability.mjs
```

Edits **`evidence-batch-01.json`** (or future `evidence-batch-02.json` once wired) — not title/keyword matching.

## Batch 01 status

See `traceability-FULL.json` → `evidenceBatch` and `itemClassificationCounts`.

**WTSK0002 / POF-DEC-001:** Parent reports tracker reopened — row remains tied to snapshot fields; do not use matrix as proof of final decision state.
