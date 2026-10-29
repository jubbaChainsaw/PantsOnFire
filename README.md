# Pants on Fire: Find the Liar

![Pants on Fire Logo](public/assets/images/logo.png)

🔥 **Catch the liar... or become the liar.**  
🎭 **Choose the chaos. Then survive it.**

`Pants on Fire` is a loud, chaotic, pass-the-phone party game built for arguments, bad bluffs, fake confidence, and zero trust.  
Think social deduction meets gameshow energy, with neon arcade style and rapid-fire rounds.

---

## Why This Game Slaps

- Fast setup, instant chaos
- Hidden info + social mind games
- Multiple round types with different bluff styles
- Replayable categories, prompts, themes, and host stingers
- Built for in-person party sessions first

---

## Core Gameplay Loop

1. Home
2. Setup lobby
3. Rules splash
4. Pick round type / category
5. Pass-the-phone reveal (one player at a time)
6. Discussion or interrogation
7. Voting
8. Suspense liar reveal
9. Results + scoring
10. Next round or final winner

---

## Round Types

### Hot Seat (Classic)
- Truthful players share one prompt
- Liars get a different prompt
- Blend in without over-explaining

### Truth or Twisted
- Everyone receives the same scenario
- Truthful players respond honestly
- Liars must argue against their natural take and still look legit

### Flash Frame
- Visual clue round in pass-the-phone flow
- Great for fast, high-confusion rounds

---

## Modes & Rules

### Classic
- Standard deduction rules

### Chaos
- Adds banned words + extra verbal pressure

### Win Condition (choose one)
- **Points mode:** first to target score wins
- **Rounds mode:** fixed rounds per player

### 18+ Mode
- Optional toggle in Settings
- Unlocks adult-only / risqué prompt sets
- Home + Setup surfaces show a clear `18+ Active` badge

---

## Themes & Personality

Theme system drives:
- Name pools
- Copy tone
- Host stingers
- Theme art surfaces (banner, character card, icon sheet)

Asset structure is organized under:
- `public/assets/themes/<theme>/characters`
- `public/assets/themes/<theme>/icons`
- `public/assets/themes/<theme>/ui`

### Host PNG sizing + talking frames

For each theme host, use a portrait transparent PNG at **900 x 1400 px (2:3)**.

- Safe zone recommendation for face/speech acting: centered, keep key details within ~70% width and ~80% height.
- Keep transparent padding around the character so bottom-left placement works cleanly across screens.
- Provide these files per theme in `src/data/themeAssets.js`:
  - `hostIdle` (required)
  - `hostTalk1`, `hostTalk2`, `hostTalk3` (optional but recommended)

If talk frames are not provided, the app automatically falls back to the idle frame.

---

## Tech Highlights

- React + Vite frontend
- Local data-driven architecture:
  - `src/data/categories.js`
  - `src/data/roundTypes.js`
  - `src/data/copy.js`
  - `src/data/names.js`
  - `src/data/themes.js`
  - `src/data/themeAssets.js`
- Expo mobile test shell (`App.js` with WebView wrapper)

---

## Quick Start

```bash
npm install
npm run dev
```

## Royalty-free picture pack importer (Pexels / Pixabay)

You can auto-populate picture clue packs from royalty-free sources and generate
`manifest.json` entries with one command.

### 1) Prepare an import spec JSON

Copy:

- `tools/royalty-free-import-template/picture-import.spec.example.json`

Then edit:

- `pack.id`, `pack.label`, `pack.releaseChannel`
- prompt pairs in `entries[]` (`main` / `imposter`)
- per-side search terms (`mainQuery` / `imposterQuery`)

### 2) Add API keys

Use environment variables:

- `PEXELS_API_KEY` for Pexels
- `PIXABAY_API_KEY` for Pixabay

The importer can use one or both. It tries each entry's preferred provider first,
then falls back to the other provider if available.

### 3) Run importer

```bash
npm run dlc:import-picture-pack -- --spec tools/royalty-free-import-template/picture-import.spec.example.json
```

Importer output:

- downloads images into `public/assets/graphic-packs/picture/<pack-id>/images/`
- writes/updates `public/assets/graphic-packs/picture/<pack-id>/manifest.json`
- writes attribution info to `public/assets/graphic-packs/picture/<pack-id>/attribution.json`
- runs:
  - `npm run dlc:lint-picture-manifests`
  - `npm run dlc:sync-picture-manifests`

### Notes

- Saved image files use `.png` names for manifest compatibility, even if source media is jpg/webp.
- Keep attribution metadata (`attribution.json`) for legal/audit tracking.
- Check source site terms before shipping; provider terms may change over time.

## Ian Poster host voice (ElevenLabs)

Ian Poster speaks on every theme. Voice IDs live in CSV registries; scripts export line lists, then call ElevenLabs to make MP3s.

**Pronunciation:** On-screen copy stays **Ian Poster**. The `tts_text` sent to ElevenLabs uses **Ee-an Poss-tah** (Ian like “Ee-an”, Poster like “Poss-tah” / boss + bar). Re-export after changing `IAN_POSTER_SPOKEN_NAME` in `scripts/lib/elevenLabsTtsPrompt.cjs`.

**Cadence:** Exports follow [ElevenLabs TTS best practices](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices): one trailing `<break time="Xs" />` per clip (seconds, not ms), light em-dash pacing, and `apply_text_normalization: on` in the generator.


### API key

Set one of:

```bash
export ELEVENLABS_API_KEY=your_key_here
```

Or add to `scripts/royaltyFreeApiKeys.local.json` (gitignored, same pattern as persona image keys):

```json
{
  "elevenLabsApiKey": "your_key_here"
}
```

### Core themes (Default, Pirates, Murder Mystery, …)

**1. Voice IDs** — already in `exports/host-voice-master.csv` (edit to change).

**2. Export line list** (no API key needed):

```bash
npm run host:export-voice-master
```

Writes `exports/host-voice-lines-master.csv`.

**3. Generate MP3s:**

```bash
npm run host:generate-elevenlabs -- --core --install
```

`--install` writes to `public/assets/audio/host/<theme-slug>/tts/`. Without it, files go to `exports/generated-audio/<theme-slug>/`.

Test first:

```bash
npm run host:generate-elevenlabs -- --core --dry-run --limit 5
```

### DLC pack (e.g. Wanted: Better Alibis)

**1. Voice IDs** — `exports/dlc/wanted-better-alibis/host-voice-master.csv`

**2. Export:**

```bash
npm run host:export-dlc-voice -- --pack wanted-better-alibis
```

**3. Generate:**

```bash
npm run host:generate-elevenlabs -- --pack wanted-better-alibis --install
```

All DLC packs: see `exports/dlc/README.md`.

### Persona name callouts (beta launch themes)

Ian Poster speaks each curated persona name in **Persona-only** mode (pass-the-phone reveal and single-liar reveal).

**1. Export** (reads `themePersonas.js` — re-run after adding personas):

```bash
npm run host:export-persona-callouts
```

Writes `exports/host-persona-callouts.csv` (Default + core themes + Cowboys / Gangsters / Wrestlers).

**2. Generate** (uses each theme’s `voice_id` from the master registries):

```bash
npm run host:generate-elevenlabs -- --persona-callouts --limit 10 --install
npm run host:generate-elevenlabs -- --persona-callouts --install
```

Files install to `public/assets/audio/host/<theme-slug>/tts/` as `{slug}_persona_{persona-key}.mp3`.

### Legacy: zip install

If you already have a ZIP of MP3s:

```bash
npm run host:install-default-voice-pack -- --zip exports/default-host-tts.zip
```

## Batch generation for persona avatars

You can generate prompts for every persona and batch-generate avatar images.

### 1) Export all persona avatar prompts

```bash
npm run persona:export-avatar-prompts
```

Output:

- `exports/persona-avatar-prompts.json`
- `exports/persona-avatar-prompts.csv`

Each row’s `prompt` (and `wanPrompt`) is a **short WAN-first** block: layout, one-line style anchor, theme, optional title-costume mandate, then a distilled **HERO LOOK** clause so traits are not buried under a long style essay.

### 2) Generate all persona avatars (fal.ai WAN edit by default)

Set your API key:

```bash
export FAL_KEY=your_key_here
```

Run generator (defaults to **`fal-ai/wan/v2.7/edit`**, **512×512** PNG, hosted **style-only** reference image + negative prompt, **flat white #FFFFFF** backdrop; optional **`--chroma-key`** for legacy **#FF00FF → alpha** post-processing):

```bash
npm run persona:generate-avatars
```

Optional flags:

```bash
npm run persona:generate-avatars -- --dry-run
npm run persona:generate-avatars -- --overwrite
npm run persona:generate-avatars -- --theme "Default"
npm run persona:generate-avatars -- --style-reference-url "https://example.com/style.webp"
npm run persona:generate-avatars -- --negative-prompt "photorealistic, 3d render"
npm run persona:generate-avatars -- --model "fal-ai/nano-banana/edit" --reference-image ./path/to/local.png
npm run persona:generate-avatars -- --chroma-key
npm run persona:generate-avatars -- --chroma-tolerance 72
npm run persona:generate-avatars -- --chroma-fringe
```

Re-key existing persona PNGs in `public/` that still use a **#FF00FF** field (same tolerance logic as **`--chroma-key`**):

```bash
npm run persona:key-chroma -- --dry-run
npm run persona:key-chroma -- --theme Default
npm run persona:key-chroma -- --tolerance 72 --fringe
```

OpenAI instead:

```bash
export OPENAI_API_KEY=your_key_here
npm run persona:generate-avatars -- --provider openai
```

Notes:

- Images are saved to each persona `imageSrc` path (under `public/assets/themes/.../personas/`).
- Use `--dry-run` first to verify prompt coverage and output paths.
- WAN mode uses the Craiyon URL as **style** reference only (prompt forbids copying the reference subject). Legacy Nano Banana still supports `--reference-image` / `--use-existing-reference`.
- Prompts ask for a **flat #FFFFFF white** field plus a **bold black outer outline** so busts read cleanly inside circular avatars. The generator **does not** chroma-key by default; pass **`--chroma-key`** if you still generate on a **#FF00FF** plate and want **sharp** to strip that field to alpha (strict RGB box, default tolerance **58**). An optional **`--chroma-fringe`** pass can eat thin magenta halos but may false-key **purple-tinted shadows** on dark clothing, so it defaults **off**. Tune with **`--chroma-tolerance`**. **Magenta** (when used) is chosen instead of green so cel-shaded greens in clothing are less likely to punch holes.

## Theme host pack installer (10 talking frames + themed overlays)

Use this when you have a ZIP of host source PNGs and want to wire them into
runtime host animations across themes.

### 1) Put source files in `exports/`

- Host source ZIP (example): `exports/Hosts (1).zip`
- Overlay base PNG (example): `exports/hostoverlay.png`

### 2) Install host packs

```bash
npm run host:install-theme-host-packs -- --zip "exports/Hosts (1).zip" --overlay "exports/hostoverlay.png"
```

What this script does:

- extracts host PNG sources
- maps them to themes using filename hints (and fallback assignment order)
- writes host idle image per theme:
  - `public/assets/themes/<theme-slug>/hosts/persona-host-idle.png`
- generates a 10-frame talking sequence per installed theme:
  - `persona-host-talk-01.png` ... `persona-host-talk-10.png`
- generates themed overlay variants for every theme:
  - `public/assets/themes/<theme-slug>/hosts/host-overlay.png`

### 3) Optional flags

```bash
# dry run
npm run host:install-theme-host-packs -- --zip "exports/Hosts (1).zip" --overlay "exports/hostoverlay.png" --dry-run

# print unmatched files
npm run host:install-theme-host-packs -- --zip "exports/Hosts (1).zip" --overlay "exports/hostoverlay.png" --list-unmatched

# provide explicit fallback assignment order for unlabeled files
npm run host:install-theme-host-packs -- --zip "exports/Hosts (1).zip" --overlay "exports/hostoverlay.png" --theme-order "Default,Murder Mystery,Pirates,Cops and Robbers,Ghosts and Ghouls"

# override generated themed overlays with a per-theme overlay ZIP
npm run host:install-theme-host-packs -- --zip "exports/Hosts (1).zip" --overlay-per-theme-zip "exports/theme-overlays.zip"
```

### Runtime behavior

- Host talking animation now supports 10-frame persona sequences when present.
- Theme host overlays (`host-overlay.png`) are rendered above the host art on:
  - Game intro host screen
  - Round host intro screen
  - Liar reveal host screen
- If an overlay is missing for a non-default theme, it simply does not render.

## AI parody picture round generator (OpenAI / FLUX)

You can also generate original parody/caricature image packs for picture rounds using
OpenAI or FLUX image generation. This is useful for recognisable-but-transformed
artist/band patch-style logo emblems for music rounds, standalone album-cover-inspired
packs, and spoof movie posters for all-time-great films.

### What it creates

- three curated packs:
  - `music-parodies-v1`
  - `albums-parodies-v1`
  - `screen-parodies-v1`
- 50 prompt pairs in the music pack, a local-source albums pack, and 50 prompt pairs in the screen pack by default
- music pack now starts with top-selling rock bands and top-selling pop stars, then expands
  into rap/hip-hop, boy bands, and girl groups, all paired into music patch-logo rounds
- albums pack is built from local files in `assets/music-albums/to-process/` and is designed
  for album-cover recreations in its own standalone output folder
- screen pack now targets top films only, excluding sequels and prequels
- `manifest.json` files compatible with the picture DLC workflow
- `generation-prompts.json` files so you can review/edit prompts before spending API credits
- square 800x800 image generation by default

### Prompt-only review pass

Start here to export prompts and manifests without generating any images:

```bash
npm run picture:generate-parody-rounds -- --prompts-only
```

This writes reviewable pack folders under:

- `exports/parody-picture-rounds/music-parodies-v1/`
- `exports/parody-picture-rounds/albums-parodies-v1/`
- `exports/parody-picture-rounds/screen-parodies-v1/`

### Generate a small sample first

```bash
npm run picture:generate-parody-rounds -- --category music --limit 5
```

Using FLUX instead of OpenAI:

```bash
npm run picture:generate-parody-rounds -- --provider flux --category music --limit 5
```

Generate the standalone Albums pack:

```bash
npm run picture:generate-parody-rounds -- --provider flux --category albums --limit 20
```

The standalone Albums pack uses local files from:
- `assets/music-albums/to-process/`

For each local cover, the Albums path uses a strict redraw-only cartoon prompt that:
- keeps the broad composition and visual idea
- redraws all cover elements into new cartoon graphics
- forbids direct copied source fragments
- does not send a separate style-reference image

Repeated music subjects are deduped automatically: if the same artist/band appears more
than once in the selected batch, the script generates the first image once and copies it
to the other matching output files instead of regenerating it.

To keep what you already generated, rerun **without** `--overwrite`. Existing image files
will be left untouched and only missing outputs will be created.

For the standalone Albums pack specifically, existing generated outputs are always preserved
and only missing images are created, even if you pass `--overwrite`.

If you want a different size, override it explicitly:

```bash
npm run picture:generate-parody-rounds -- --category music --limit 5 --size 1024x1024
```

### Generate directly into the live picture-pack folder

After reviewing the prompts:

```bash
npm run picture:generate-parody-rounds -- --output-root public/assets/graphic-packs/picture
npm run dlc:lint-picture-manifests
npm run dlc:sync-picture-manifests
```

### Notes

- OpenAI key sources:
  - `OPENAI_API_KEY`
  - `scripts/royaltyFreeApiKeys.local.json` -> `openaiApiKey`
- FLUX / fal.ai key sources:
  - `FAL_KEY`
  - `FAL_API_KEY`
  - `FLUX_API_KEY`
  - `scripts/royaltyFreeApiKeys.local.json` -> `falApiKey` or `fluxApiKey`
- FLUX defaults to model `fal-ai/flux/dev` and uses the fal model API.
- When you generate the standalone Albums pack with `--provider flux`, the script uses fal
  Nano Banana edit with:
  - the local album cover file as the content reference image
  - your full parody-cartoon redraw prompt embedded directly in the request
  - no separate style-reference image
- The Albums prompt now explicitly tells Nano Banana to replace direct source-cover elements
  with newly drawn cartoon graphics rather than carrying fragments through unchanged.
- Defaults now focus on expanded music patch-emblem generation across rock bands, pop stars,
  rap/hip-hop, boy bands, and girl groups:
  - text logo / wordmark
  - no people or faces
  - surrounding symbolic elements tied to the act's clothing, props, stage persona, and album-art colors
  - jacket-patch / bag-patch / badge-emblem composition
- The generator automatically removes obsolete old `music-*` image files from the current run
  folder before generating, so only the active prefixed sets remain.
- Rerun without `--overwrite` to preserve any existing rock/pop/new-genre files you already
  like while still filling in any missing ones. Because rock and pop appear first in the
  music bank, missing rock/pop files will be attempted before the newly added categories.
- Music prompts are styled toward a punchy comic-punk illustrated patch look.
- Film prompts remain spoof movie-poster layouts for top films only.
- The prompts are written to steer results toward transformed parody/caricature territory
  with readable faces, costume cues, and props, but outputs should still be manually
  reviewed before shipping.
- The generated prompts explicitly avoid logos, title text, direct poster/cover recreation,
  and exact face matching.

## Realistic animal picture set (OpenAI)

There is also a standalone animal generator for realistic picture-round images.

### What it creates

- one pack: `animals-realistic-v1`
- 50 animals arranged as 25 visually similar pairs
- simple gameplay-facing records such as:
  - `hint: "Insect"`
  - `prompt: "beetle"`
- realistic animal rendering with the established graphic-style influence kept subtle

### Examples

Export prompts only:

```bash
npm run picture:generate-animal-set -- --prompts-only
```

Generate a small sample:

```bash
npm run picture:generate-animal-set -- --limit 10
```

Generate the full animal set:

```bash
npm run picture:generate-animal-set
```

### Notes

- Uses `OPENAI_API_KEY` (or `scripts/royaltyFreeApiKeys.local.json` -> `openaiApiKey`).
- Rerun without `--overwrite` to preserve already generated animal images.
- The prompt bank is grouped into lookalike pairs such as octopus/squid, crocodile/alligator, and leopard/cheetah to suit picture-round comparisons.

## Global Online Lobbies (App Store / Play Store ready)

To support players in different homes/countries, you must run the lobby server on a
public internet host (HTTPS + WSS), not localhost.

### 1) Deploy the lobby server

Run this server process in production:

```bash
npm run lobby:server
```

Server entrypoint: `server/lobbyServer.js`

### 2) Configure client -> server URL

When building the frontend, set:

```bash
VITE_LOBBY_SERVER_URL=https://your-lobby-server.example.com
```

This URL is what all devices connect to for lobby creation/join/sync.

### 3) Use Redis in production (strongly recommended)

```bash
LOBBY_REDIS_URL=redis://your-redis-host:6379
```

Without Redis, lobby state is in-memory and will reset on server restart.

### 4) Configure allowed client origins (CORS)

For security, lock allowed origins instead of wildcard:

```bash
LOBBY_CLIENT_ORIGIN=https://your-web-app.example.com
```

Or multiple origins:

```bash
LOBBY_CLIENT_ORIGINS=https://your-web-app.example.com,https://staging.your-web-app.example.com
```

### 5) Production env example

```bash
PORT=8787
LOBBY_SESSION_TOKEN_TTL_MS=43200000
LOBBY_REDIS_URL=redis://your-redis-host:6379
LOBBY_CLIENT_ORIGIN=https://your-web-app.example.com
```

### 6) Verify deployment health

```bash
curl https://your-lobby-server.example.com/health
```

Expected JSON includes `ok: true` and storage kind (`memory` or `redis`).

### Realtime Online Lobby Server (required for networked play)

Run the lobby backend in a second terminal:

```bash
npm run lobby:server
```

Then run the app:

```bash
npm run dev
```

By default:
- frontend: `http://localhost:5173`
- lobby server: `http://localhost:8787`

For deployed environments, set the frontend env var:

```bash
VITE_LOBBY_SERVER_URL=https://your-lobby-server.example.com npm run dev
```

#### Durable lobby storage (Redis)

By default, the lobby server uses an in-memory store (good for local quick testing).
To persist lobbies/session tokens across server restarts and support multi-instance scale,
set a Redis URL before starting the lobby server:

```bash
export LOBBY_REDIS_URL=redis://localhost:6379
npm run lobby:server
```

Optional durability/security env vars:

- `LOBBY_REDIS_NAMESPACE` (default: `pof:lobby`)
- `LOBBY_SESSION_TOKEN_TTL_MS` (default: `43200000`, i.e. 12h)

---

## Expo Mobile Test Shell

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run expo:start
```

- Android emulator default URL: `http://10.0.2.2:5173`
- iOS default URL: `http://localhost:5173`
- Override URL:
  - `EXPO_PUBLIC_GAME_URL=http://YOUR-IP:5173 npm run expo:start`

---

## What’s Next

- Online lobby + real party chat
- Device-per-player sessions (Jackbox style)
- More premium content packs
- Enhanced animation + SFX pass

If it feels too clean, it's wrong.  
This game should feel loud, suspicious, and a little unhinged.

