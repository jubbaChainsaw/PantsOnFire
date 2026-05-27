# Game assets layout

## Naming convention

| Layer | Folder | URL prefix | Versioning |
|-------|--------|------------|------------|
| **UI pack** (shared chrome) | `public/assets/ui/` | `/assets/ui/` | Add `ui-v2/`, `ui-v3/`, … later; switch `UI_PACK_SLUG` in `src/data/uiAssets.js` |
| **Themes** (per-theme art) | `public/assets/themes/<theme-slug>/` | `/assets/themes/…` | Per theme / DLC, not UI pack version |
| **Host voice** | `public/assets/audio/host/<theme-slug>/tts/` | `/assets/audio/host/…` | Regenerated from CSV exports |
| **Misc** | `images/`, `sfx/`, `videos/`, … | `/assets/…` | As needed |

The UI pack is **not** merged into `themes/` — it stays a separate, versionable bundle.

## `ui/` — active UI pack

Used by `src/data/uiAssets.js` (`UI_PACK_SLUG = 'ui'`).

| Subfolder | Files | Purpose |
|-----------|-------|---------|
| `wallpapers/` | `home-page.png`, `in-game.png` | Menu vs in-round backgrounds |
| `logos/` | `main-logo.png`, `logo-18plus.png` | Branding |
| `cards/` | `{theme-slug}-front.png`, `{theme-slug}-back.png`, `liar-front.png` | Prompt card faces |
| `categories/` | `{category-id}.png` | Category picker |
| `game-modes/` | `prompt.png`, `opinion.png`, … | Round type picker |
| `mockups/` | — | Design reference only (not loaded in app) |

### Standard file names

- **Cards:** `default-front.png`, `pirates-back.png`, `liar-front.png` (kebab-case theme slug)
- **Categories:** `movies.png`, `school-uni.png` (matches category `id` in `categories.js`)
- **Game modes:** `prompt.png`, `chain.png`, … (matches round type `id`)

### Future UI versions

1. Copy or build a new pack: `public/assets/ui-v2/` (same subfolder layout).
2. Change one line: `UI_PACK_SLUG` in `src/data/uiAssets.js` (or env `VITE_UI_PACK_SLUG` if wired later).
3. Keep old packs in repo for rollback and diffing.

## `themes/<theme-slug>/` — theme content

| Path | Purpose |
|------|---------|
| `personas/` | Persona portraits (`01-name-slug.png`) |
| `hosts/` | Ian Poster: `persona-host-idle.png`, `persona-host-talking.webm`/`.mp4` |
| `cards/` | **Legacy** — gameplay cards use `ui/cards/` |

## `audio/host/<theme-slug>/tts/` — Ian Poster voice

Bulk-generated via `npm run host:generate-elevenlabs`.

## Retired

- **Detectives Noir** — do not re-add `themes/detectives-noir/`.
- **`new-ui/`** — renamed to `ui/` (May 2026).

## Maintenance

```bash
npm run host:sync-generated-media
npm run host:generate-elevenlabs -- --core --install
```
