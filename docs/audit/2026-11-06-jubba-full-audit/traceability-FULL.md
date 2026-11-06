# JubbaWorld traceability — machine-readable primary artifact

**Source of truth:** `traceability-FULL.json` (**129** rows: **119** items + **10** conversation requirements).

**Evidence merge:** all `evidence-batch-*.json` in `docs/audit/2026-11-06-jubba-full-audit/` (lexical order: batch-01, batch-02, batch-03). Later files **override** same `item.number`.

**Provenance:** `jubbaworld-snapshot-upload-provenance-8c20.json` (user upload bytes).

## Generator

```bash
node scripts/audit/generateEvidenceBatch02.mjs   # optional: regenerate batch-02
node scripts/audit/buildJubbaWorldTraceability.mjs
```

No keyword heuristics in `buildJubbaWorldTraceability.mjs`.

## Classifications

See `traceability-FULL.json` → `itemClassificationCounts`. Labels include `code_proven_partial`, `partial`, `verified`, `missing`, `deferred`, `blocked_device_external`, `blocked_external_owner` — **not** a generic `untested` bucket.
