# Data file naming conventions

Use explicit, domain-focused file names for data modules. Prefer names that describe *what data* the file contains.

## Rules

- Use `camelCase` file names.
- Use a noun or noun phrase tied to the domain (for example `roundTypeCatalog.js`, `playerNamePools.js`).
- Avoid vague names like `copy.js`, `misc.js`, `utils.js`, or `data.js`.
- Keep each file focused on one data domain.

## Current examples

- `categories.js` — prompt/category and round content banks
- `roundTypes.js` — round type catalog and round type flags
- `themeAssets.js` — theme-specific asset paths
- `themes.js` — theme metadata (gradients, tone, packs)
- `names.js` — name pools and random name helper
- `gameTextContent.js` — UI text/copy banks and copy picker

## For future DLC packs

- Use pack-oriented paths under `public/assets/graphic-packs/<type>/<pack-id>/...`.
- Keep `pack-id` kebab-case and versioned (for example `core-v1`, `animals-v2`).
- Keep DLC manifests in dedicated files (for example `pictureDlcManifests.js`) rather than embedding pack metadata directly in gameplay files.
- Use a formal manifest schema with:
  - pack metadata (`id`, `type`, `version`, `label`, `enabled`, `basePath`)
  - prompt entries (`entryId`, `hint`, `main`, `imposter`, `categoryTag`, optional `adultOnly`)
  - media file names (`mainMediaFile`, `imposterMediaFile`)
- Build runtime round content by transforming manifest entries into game prompts (data-only onboarding for new DLC packs).

## Picture DLC manifest workflow (data-only)

- Source of truth is JSON manifests:
  - `public/assets/graphic-packs/picture/<pack-id>/manifest.json`
- Sync generated JS registry before commit:
  - `npm run dlc:sync-picture-manifests`
- Lint picture manifests before commit:
  - `npm run dlc:lint-picture-manifests`
- Scaffold a new picture pack:
  - `npm run dlc:new-picture-pack -- <pack-id> "<Label>"`
- Runtime reads generated data module:
  - `src/data/generatedPictureDlcManifests.js`
- Add a new picture pack without touching core logic:
  1. Add `manifest.json` under the pack directory
  2. Add referenced media files under that pack's `images/`
  3. Run `npm run dlc:sync-picture-manifests`
  4. Build and commit

## Category-specific standard packs (non-DLC updates)

- Standard prompt content should live under:
  - `src/data/packs/<category-id>/promptRoundData.js`
- Aggregate all category packs through:
  - `src/data/packs/categoryPromptPacks.js`
- `categories.js` should consume the aggregate pack index to build `DEFAULT_CATEGORIES`.
- For non-DLC prompt updates, add/edit files in `src/data/packs/...` rather than editing `categories.js` directly.
