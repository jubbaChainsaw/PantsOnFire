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
