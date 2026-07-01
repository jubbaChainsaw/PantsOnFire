# Performance Optimization — June 2026

Scope: web app load/startup speed. No gameplay, scoring, round, DLC, host,
online-protocol, or entitlement behaviour changed — verified by the existing
64-test suite plus a browser smoke test (Playwright, dev and production
builds) confirming the app boots to the account-gate screen with no new
console errors and identical visual output.

## What was fixed

### 1. Startup image preload was fetching every theme, not just the active one (the main fix)

`useGlobalGraphicsPreload` (`src/App.jsx`) ran on every app mount, behind a
full-screen blocking `StartupPreloadOverlay`, and preloaded
`Object.values(THEME_ASSETS)` — **every theme's host art**, regardless of
which theme (if any) the player had selected.

Measured impact of the bug:
- 177 unique URLs preloaded on every single startup.
- **100 of those 177 don't exist on disk** (dead references — themes that
  were retired/renamed in `THEME_ASSETS` but never cleaned up), each firing
  a wasted request.
- The 77 real files total **~27 MB**, all fetched before the player ever
  sees the home screen, even though a session only ever uses one theme.

Individual host "talk" frame PNGs are also uncompressed-heavy (e.g. a
1024×1536 RGBA frame in `public/assets/themes/murder-mystery/hosts/` is
3.7 MB where lossless re-encoding gets it to 0.76 MB — see "Not done" below),
which made this preload bug much more expensive than the URL count alone
suggests.

**Fix:** `useGlobalGraphicsPreload(themeName)` now preloads only
`THEME_ASSETS[themeName]` plus `THEME_ASSETS.Default` (the fallback theme
`getThemeHostAssets` already falls back to), and re-runs when the player's
selected theme changes. Verified with Playwright against both the dev server
and the production build: only the `default` theme directory is hit on
startup (down from all ~10 themes in `THEME_ASSETS`).

This does not change what a player ever sees — every theme still renders
correctly via the existing `<img>`/`<video>` `src` attributes the moment it's
selected, exactly as before. It only changes *when* those bytes are fetched:
on demand instead of all up front.

### 2. `livekit-client` (~130 kB gzip / ~490 kB raw) was in the initial bundle

`src/online/voicePartyTransport.js` imported `livekit-client` at module top
level, so every page load — including every pass-the-phone session that
never touches online voice — paid to download, parse, and hold that code
before it could possibly be used.

**Fix:** the import is now `const { Room, RoomEvent } = await import('livekit-client')`
inside `createVoicePartyTransport()`, the only function that uses it. The
function was already `async` and already only called when a player connects
to online voice chat, so this is a pure load-timing change: Vite now emits
`vendor-livekit` as a separate chunk that is **not** in `dist/index.html`'s
`modulepreload` list (verified in the build output) and is only fetched the
first time voice chat actually connects.

### 3. No vendor/app chunk separation

`vite.config.js` had no `build.rollupOptions.output.manualChunks`, so every
dependency (React, framer-motion, lucide-react, socket.io-client, Supabase,
LiveKit) was bundled into the same graph as game code. Any game update — a
new theme, a copy tweak, a bug fix — forced players to re-download all of it.

**Fix:** added `manualChunks` splitting `vendor-react`, `vendor-motion`,
`vendor-icons`, `vendor-socket`, `vendor-supabase`, `vendor-livekit` from the
app chunk. Total first-load bytes are close to unchanged (chunking alone
doesn't remove bytes), but:
- Repeat visits / app updates only re-fetch the changed chunk(s) — the
  ~230 kB gzip of rarely-changing vendor code (react+motion+supabase, LiveKit
  now lazy per #2) stays cached across deploys instead of re-downloading
  whole.
- Chunks fetch in parallel over HTTP/2 instead of one 354 kB gzip blob that
  must fully arrive before any of it can run.

## Verified before/after (production build)

| | Before | After |
|---|---|---|
| Startup image preload | 177 URLs / ~27 MB, all themes, 100 dead | ~20 URLs / active theme + Default only |
| Eagerly-loaded JS (modulepreload + immediate dynamic import) | one 1,319 kB chunk (354 kB gzip) | react+motion+icons+socket+supabase+app chunks; **livekit-client (129 kB gzip) deferred until voice chat connects** |
| Playwright smoke test (prod build, `networkidle`) | not measured before fix | 1.2 s, 0 new console errors, correct theme-scoped preload confirmed |

## What was NOT done (needs a decision, not yet touched)

### A. Bulk image re-encoding — biggest remaining lever, ~700 MB → likely ~150–200 MB
`public/assets` is 711 MB, dominated by `themes/` (504 MB). Individual host
frame PNGs are 3–4 MB each; a lossless re-encode of a sample file (same
pixels, same PNG format, just proper compression) cut it from 3.69 MB to
0.76 MB (**79% smaller, zero visual change**, verified with `sharp`). A
project-wide pass across all 428 PNGs / 125 JPGs would very likely cut total
asset weight by more than half, which matters most for mobile/WebView
players on real networks.

This is a large, binary-heavy operation (hundreds of files rewritten) with a
different risk profile than a code diff — it's provably lossless but not
reviewable the way source changes are, and it touches every theme/DLC pack's
art. **I did not run this without checking in first.** If you want it, I'd
run it as: batch lossless PNG re-encode (`sharp`, `compressionLevel: 9`) with
an automated before/after pixel-hash comparison per file to prove nothing
changed visually, committed as its own PR. WebP conversion would save more
(~88% in the sample) but changes file format/references — bigger, separate
decision.

### B. Splitting the 659 kB `App.jsx` chunk itself (code-splitting screens)
This is the next-biggest JS lever after the vendor split, and the
architecture review (`ARCHITECTURE_REVIEW.md`, item E12: "move screens into
`src/features/`") is a prerequisite for it — you can't `React.lazy()` a
screen that's a sibling function inside one 10k-line module. That work was
explicitly marked "after playtesting" and file-moves of screens were
explicitly out of scope for the last approved change. Not touched here;
flagging it as the natural next step once you're ready for that scope.

### C. Font optimization — checked, skipped as not worth it
Only one font file is actually fetched (`Vintage Cowboy.ttf`, 92 kB, already
`font-display: swap`); the other 4 files in `public/assets/fonts/` aren't
referenced anywhere so they cost zero runtime bytes. Not a meaningful lever.

### D. Mobile WebView / static hosting caching headers
The audit confirmed `server/lobbyServer.js` doesn't serve the web build at
all (no `express.static`) — the web app is deployed separately (Railway
runs only the lobby API per `railway.toml`). Whatever serves the built
`dist/` in production should set long-lived cache headers + compression for
the now-content-hashed vendor chunks; that's infrastructure/hosting
configuration outside this repo's server code, not something to fix here.
Similarly, the Expo WebView always loads a remote `GAME_URL` with no local
bundling — already tracked in `MOBILE_DEPLOYMENT_READINESS.md`.

## Verification performed
- `npm test` — 64/64 pass, unchanged.
- `npm run build` — succeeds; chunk breakdown confirmed above.
- Playwright smoke test against both `vite` dev server and `vite preview`
  (production build): app boots to the account-gate screen, only the active
  theme's directory is hit by preload, no new console errors (one pre-existing,
  unrelated `favicon.ico` 404 present before and after — not introduced by
  this change).
- `dist/` left as the pre-existing committed snapshot (not part of this
  diff) — same handling as prior review commits; rebuild at deploy time.
