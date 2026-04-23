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
