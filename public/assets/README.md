# Game assets layout

## `new-ui/` — shared UI pack (active)

Used by `src/data/uiAssets.js` for screens, not per-theme legacy card folders.

| Path | Purpose |
|------|---------|
| `wallpapers/home-page.png` | Home / menu background |
| `wallpapers/in-game.png` | In-round screens background |
| `logos/` | Main and 18+ logos |
| `cards/` | Prompt card fronts/backs (`{theme-slug}-front.png`) + `liar-front.png` |
| `categories/` | Category picker icons (`{category-id}.png`) |
| `game-modes/` | Round type icons (`prompt.png`, `opinion.png`, …) |
| `mockups/` | Design references only (not loaded by the app) |

## `themes/<theme-slug>/` — theme content

| Path | Purpose |
|------|---------|
| `personas/` | Persona portrait PNGs for persona-only mode |
| `hosts/` | Ian Poster host: `persona-host-idle.png`, `persona-host-talking.webm`/`.mp4`, optional `host-overlay.png` |
| `cards/` | **Legacy** — superseded by `new-ui/cards/` for gameplay |

Host talk uses **video + idle** (see `ThemeHostVisual` in `App.jsx`). Do not add `new-ui/hosts/` talk frame sequences.

## `audio/host/<theme-slug>/tts/` — Ian Poster voice MP3s

Bulk-generated from `exports/host-voice-lines-master.csv` or DLC pack CSVs via `npm run host:generate-elevenlabs`.

## Retired

- **Detectives Noir** — theme removed; do not re-add `themes/detectives-noir/`.

## Maintenance scripts

```bash
npm run host:sync-generated-media   # refresh generatedHostMedia.js from theme host folders
npm run host:generate-elevenlabs -- --core --install
```
