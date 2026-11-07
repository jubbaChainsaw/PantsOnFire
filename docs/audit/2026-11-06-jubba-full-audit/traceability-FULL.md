# JubbaWorld traceability — primary artifact

**Source of truth:** `traceability-FULL.json` (**129** rows: **119** items + **10** conversation requirements).

**Evidence merge:** all `evidence-batch-*.json` in this folder (**lexical** order). **Later overrides earlier** for the same `item.number`.

**Taxonomy (items):** includes `account_status_unknown`, `stale_tracker_mismatch`, `blocked_device_external`, `deferred`, `missing`, `partial`, `code_proven_partial`, `verified` — **not** generic `untested`. Counts sum to **119**.

**Quality note:** `generateEvidenceBatch02.mjs` rows are **structured audit trail** — the methodology flag states they are **not** independent human examination.

**Gap map:** `audit-gap-criteria-2026-11-06.json`.

## Regenerate

```bash
node scripts/audit/generateEvidenceBatch02.mjs
node scripts/audit/buildJubbaWorldTraceability.mjs
```

**Independent code review:** **not performed** for this audit (Superpowers `requesting-code-review` not fulfilled).
