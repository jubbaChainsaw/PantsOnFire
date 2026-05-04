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

### Grill 'Em (AI Round)
- Players interrogate AI host **Blaze Byte**
- Liars are shown hidden AI context and try to steer suspicion
- Mic input + spoken AI responses are supported where available
- Questions per player auto-scale to target ~20 total questions per round

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

## AI parody picture round generator (OpenAI / FLUX)

You can also generate original parody/caricature image packs for picture rounds using
OpenAI or FLUX image generation. This is useful for recognisable-but-transformed artist/band
logo marks for music rounds and spoof movie posters for all-time-great films.

### What it creates

- two curated packs:
  - `music-parodies-v1`
  - `screen-parodies-v1`
- 50 prompt pairs per pack by default
- music pack now targets artist/band-inspired logo marks
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
- `exports/parody-picture-rounds/screen-parodies-v1/`

### Generate a small sample first

```bash
npm run picture:generate-parody-rounds -- --category music --limit 5
```

Using FLUX instead of OpenAI:

```bash
npm run picture:generate-parody-rounds -- --provider flux --category music --limit 5
```

Repeated music subjects are deduped automatically: if the same artist/band appears more
than once in the selected batch, the script generates the first image once and copies it
to the other matching output files instead of regenerating it.

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
- Defaults now focus on artist/band logo-mark generation for music and spoof movie-poster
  layouts for top films only.
- The prompts are written to steer results toward transformed parody/caricature territory
  with readable faces, costume cues, and props, but outputs should still be manually
  reviewed before shipping.
- The generated prompts explicitly avoid logos, title text, direct poster/cover recreation,
  and exact face matching.

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

