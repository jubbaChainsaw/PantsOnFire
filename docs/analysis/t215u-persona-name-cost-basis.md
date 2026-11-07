# t215u — Persona name catalog & clip / character cost basis (read-only)

Deterministic exports from this repo (no TTS, no pricing). Regenerate with:

`npm run analysis:export-persona-name-cost`

## Artifacts

| File | Purpose |
|------|---------|
| `persona-name-catalog.json` | Full rows: display name, `spokenFullHuman` (strip decorative quotes per `buildPersonaCalloutSpokenLine`), rule-based `spokenFirstAddress`, `minimalUniqueSpoken`, theme unlock metadata |
| `persona-name-catalog.csv` | Same as JSON, spreadsheet-friendly |
| `persona-name-cost-basis-summary.json` | Counts, character sums, collision groups, carrier phrase note |

`persona-name-cost-basis-summary.json` includes `gitCommit` and `generatedAt` at export time.

## Source code (ground truth)

- Persona pools: `src/data/themePersonas.js` (curated + procedural; DLC from `src/data/dlcPersonaRoster.json` via `src/data/dlcCuratedPersonas.js`)
- Spoken full string normalization: `src/data/hostPersonaCallouts.js` → `buildPersonaCalloutSpokenLine`
- Procedural name pools: `src/data/names.js` (`NAME_POOLS`), count `PROCEDURAL_PERSONA_COUNT` in `themePersonas.js`
- Theme unlock mapping: `src/data/themeCatalog.js`, `src/data/themes.js` (`THEME_META`)
- Export script: `scripts/exportPersonaNameCostAnalysis.mjs`

## Strategies (character & clip basis)

All totals are **bare name only** unless you add the optional carrier phrase (see summary JSON).

1. **Full spoken** — one clip per distinct `spokenFullHuman` (matches persona callout line text today).
2. **First / short address** — rule-based `spokenFirstAddress` (titles + two-token honorifics, epithet handling, compound patterns). Rows may be flagged `firstNameNeedsHumanReview`.
3. **Minimal unique prefix** — extend tokens from the start of `spokenFullHuman` until the prefix is unique across **all catalog personas** (global uniqueness).

**Collision reporting:** duplicate groups for `spokenFirstAddress` are **global** (whole catalog). Same-lobby collisions are a subset: any group with personas from different `poolThemeName` values cannot appear in one lobby if each theme uses only its own pool; groups within one theme still matter for “two players pick personas that share the same short form”.

## User names (out of scope for row count)

Typed player display names are **unbounded** and not listed in the catalog — only selectable persona definitions are exported.
