# Architecture Review — June 2026 (post security fixes)

**Planning pass only. No code was moved or changed for this review.**

Companion to `SECURITY_AUDIT.md` / `TECHNICAL_DEBT_AND_ROADMAP.md` in this
folder. Scope: identify the safest extractions from `src/App.jsx`
(10,556 lines) that reduce future bug risk without disturbing the
alpha/playtest build. All behaviour — pass-the-phone, all round types,
themes, personas, host systems, DLC, online lobby, purchases — must remain
identical through every step proposed here.

---

## 1. App.jsx responsibility map

Measured: **10,556 lines, 121 top-level functions, 121 `useState` /
63 `useEffect` total — 65 state atoms and 36 effects inside the single
`App()` component (lines 7595–10547).**

| Lines | Contents | Category |
|---|---|---|
| 1–169 | imports (data layer, account, billing, auth, online transports, UI kit) | — |
| 170–330 | asset path constants, screen-set constants, storage keys | content/config |
| 331–710 | persona profile + friends normalizers; player identity/colour builders; `getStored`/`setStored`; persistent clientId; online session persistence | account/session, personas, utilities |
| 711–781 | `mapLobbyErrorToMessage` (error-code → copy table) | online lobby client |
| 782–955 | layout helper; `toClientRoundFromServer`; category/round-type compatibility (`getCompatibleRoundTypes`, `pickCompatibleRoundTypeId`, `usesNoCategorySelection`…); picture-pack normalizers | round generation, DLC |
| 956–1152 | **`buildLocalRound`** — round generation for all 8 pass-the-phone round types (prompt/chain/nameblame/noise/offtopic/opinion/picture/grill), liar assignment, banned words, recent-prompt avoidance | round generation |
| 1153–1246 | **`calculateRoundResolutionLocal`** — vote normalization, tally, liar-caught logic, scoring incl. Grill 'Em adjustments | voting, scoring |
| 1247–1288 | `applyGrillRoundDataToRound` | scoring |
| 1289–1789 | presentational primitives: `GlassPanel`, `TopFrame`, `ScoreStrip`, `ThemeArt`, `MultiSourceVideo`, `ThemeHostVisual`, `RoundMascot`… | UI layout |
| 1790–1989 | `useTalkingAnimation`, `useIanPosterHostVoicePlayback`, host voice-line helpers, `fitTextToBubble` | host/audio |
| 1990–2360 | `GameIntroScreen`; rule-text/icon getters; image preload hooks + `StartupPreloadOverlay` | screens, assets |
| 2361–2488 | custom-category meta, instruction host lines, example prompts | content helpers |
| 2489–3406 | `HostIntroScreen`, `RulesSplashScreen`, `AccountGateScreen`, `HomeScreen`, `PersonaScreen`, `FriendsScreen` | screens |
| 3407–4101 | `DevelopmentProgressScreen`, `OnlineLobbySetupScreen`, `BrandedScreen`, `OnlineJoinLobbyScreen`, `OnlineLobbyCodeScreen` | screens (online) |
| 4102–4684 | `SetupScreen` (local lobby/player management, 580 lines) | pass-the-phone flow |
| 4685–5122 | `RevealScreen` (pass-the-phone reveal; also consumes online private prompt) | pass-the-phone flow |
| 5123–5336 | **Grill 'Em judge** — `evaluateGrillQuestion`, tag inference, guess normalization, voice picking (pure functions) | round rules (grill) |
| 5337–5819 | `GrillEmScreen` — SpeechRecognition + speechSynthesis wiring interleaved with transcript/strike/score state | round flow + host/audio |
| 5820–6022 | `VoicePartyStatusStrip`, `PartyChatDrawer`, `PartySpeakerOverlay` | online voice UI |
| 6023–6753 | `DiscussionScreen`, `VotingScreen`, `LiarRevealScreen`, `ResultsScreen`, `FinalScreen` | round flow, reveal, scoring UI |
| 6754–7125 | `StoreScreen`; theme selection, pack unlock/redeem helpers | DLC/store |
| 7126–7594 | `SettingsScreen`, `AdminDialog` | settings, dev tools |
| 7595–10547 | **`App()`** — 65 state atoms; ~25 persistence effects (localStorage mirrors); BGM/SFX engine; friends/persona handlers; online session resume + transport lifecycle + snapshot sync (8287–8745); online actions (private-prompt fetch, phase advance, votes, next round, create/join/ready/start/leave: 8715–9694); local game flow (`startGame`, `chooseCategory`, `revealResults`, `finishLiarReveal`, `nextRound`, `endGame`); screen router (9797–10547) | everything |

### Highest-risk areas (where future bugs will come from)

1. **Dual-mode shared state in `App()`** — `players`, `round`,
   `votesByPlayerId`, `tally`, `roundGains` are shared between local and
   online play, with `onlineMode` branches deciding which writer wins.
   Editing one mode silently regresses the other (this is where a
   pass-the-phone break would most likely originate). The snapshot-sync
   effect (lines 8513–8679) writes 10+ state atoms from one socket payload.
2. **`buildLocalRound` (956–1152)** — one ~200-line function with
   per-round-type branching, zero tests. Every new round type, DLC pack, or
   prompt-pool change passes through here.
3. **Client/server rules duplication** — `calculateRoundResolutionLocal`
   duplicates `scoreRoundServer` (server/storage/lobbyStore.js), and the
   server's `SERVER_BANNED_WORD_BANK`/prompt bank is a verbatim copy of
   `src/data/categories.js` entries. The two have already drifted (grill
   adjustments exist only client-side). Any scoring tweak must be made
   twice, identically.
4. **Session-token rotation bookkeeping** — each of the ~7 online action
   handlers repeats the "store rotated token → update ref → update
   localStorage → update transport" dance by hand. One missed update =
   `token-rotation-required` errors mid-game.
5. **`GrillEmScreen`** — device APIs (speech in/out) interleaved with
   scoring state in one 480-line component; hard to test, browser-fragile.

### What is already healthy (don't touch)

- `src/data/` (26 modules, ~8,300 lines) is genuinely data-driven, mostly
  import-free, and well-factored. It already *is* the `content/` layer.
- `src/online/lobbyTransport.js`, `voicePartyTransport.js`,
  `src/account/*`, `src/billing/*`, `src/auth/*` are cleanly separated.
- Screen components receive explicit props (no context soup) — that makes
  later file moves mechanical.
- The pure game logic is **already browser-API-free** (verified: no
  `window`/`document`/`localStorage` usage in lines 956–1288) — it's
  trapped in App.jsx by location, not by coupling.

---

## 2. Safe extraction candidates (ranked)

Key enabling fact: `src/data/roundTypes.js`, `categories.js`,
`gameTextContent.js` have **no imports at all**, so a new `src/game/`
module importing them with explicit `.js` extensions is testable by the
existing dependency-free `node --test` runner — no vitest needed for
phase 1.

| # | Extraction | From (App.jsx lines) | To | Kind | Risk |
|---|---|---|---|---|---|
| E1 | `buildLocalRound` + `shuffle`/`pickRandom` + round-type compat helpers (875–955) | 956–1152, 933–955, 448–458 | `src/game/localRounds.js` | pure functions | **Low** |
| E2 | `calculateRoundResolutionLocal`, `applyGrillRoundDataToRound` | 1153–1288 | `src/game/scoring.js` | pure functions | **Low** |
| E3 | Grill judge: `evaluateGrillQuestion`, tag/guess helpers | 5123–5336 | `src/game/grillJudge.js` | pure functions | **Low** |
| E4 | `getStored`/`setStored`, persistent clientId, online-session persistence | 642–710 | `src/services/storage.js` | utility | **Very low** |
| E5 | `mapLobbyErrorToMessage` | 711–781 | `src/online/lobbyMessages.js` | pure table | **Very low** |
| E6 | Persona/friends normalizers (`normalizePersonaProfile`, `normalizeFriendRecord`, invite helpers) | 331–447 | `src/features/social/model.js` | pure functions | **Low** |
| E7 | Picture-pack selection/weights normalizers | 831–910 | `src/game/picturePacks.js` | pure functions | **Low** |
| E8 | Rotated-token bookkeeping → one `applyRotatedSessionToken(result)` helper used by all online handlers | repeated in 8835–9690 | `src/online/sessionState.js` | small service | **Medium** |
| E9 | BGM/SFX engine (`playSfx`, `resolveBgmForScreen`, BGM effects) | 7955–8060 | `src/hooks/useGameAudio.js` | hook | **Medium** |
| E10 | Host voice/talking hooks (`useTalkingAnimation`, `useIanPosterHostVoicePlayback` + helpers) | 1779–1989 | `src/hooks/useHostVoice.js` | hooks | **Medium** |
| E11 | Online lobby client (resume effect, transport lifecycle, snapshot sync, action handlers) | 8287–9694 | `src/online/useOnlineLobby.js` | large hook | **High** |
| E12 | Screen components → feature folders | 1990–7594 | `src/features/*` | mechanical moves | **Medium (churn)** |
| E13 | `App()` state → reducers/state modules | 7595+ | `src/state/` | restructure | **High** |
| E14 | Shared client/server rules (scoring + prompt banks consumed by both `src/game/` and `server/`) | E1/E2 output + `server/storage/lobbyStore.js` | `src/game/` imported by server | consolidation | **Medium-High** |

The extraction rule that keeps E1–E7 low risk: **cut-paste only** — function
bodies move verbatim, the only edits are `import`/`export` lines. Verify
with `git diff --color-moved=dimmed-zebra` showing pure moves.

---

## 3. Recommended target architecture

```text
src/
  game/            # PURE rules — no React, no browser APIs, .js-extension imports
    localRounds.js   #   E1: round generation + round-type compatibility
    scoring.js       #   E2: tally / liar-caught / gains (one source of truth)
    grillJudge.js    #   E3: Grill 'Em question evaluation
    picturePacks.js  #   E7: pack selection/weights
  content/         # = existing src/data/ (KEEP the src/data path for now —
                   #   26 modules / 30+ import sites; rename is churn with no
                   #   safety payoff. Treat "content layer" as a concept, and
                   #   only physically migrate post-mobile-beta, if ever.)
  hooks/           # React hooks with browser/device concerns
    useGameAudio.js  #   E9: BGM/SFX
    useHostVoice.js  #   E10: talking frames + Ian Poster playback
    usePreloadedGraphics.js
  services/        # non-React side-effect wrappers
    storage.js       #   E4: localStorage access (single place to harden for WebView)
  online/          # existing transports +
    lobbyMessages.js #   E5: error copy
    sessionState.js  #   E8: token rotation bookkeeping
    useOnlineLobby.js#   E11 (post-playtest): lobby client hook
  billing/         # existing bridge; later purchaseService.js (POF_PURCHASE bridge)
  state/           # post-beta: gameReducer.js, lobbySettings.js (do NOT start here)
  features/        # post-playtest: screen modules by feature
    setup/  reveal/  rounds/  voting/  results/  grill/
    store/  settings/  social/  online-lobby/
  account/ auth/ components/ data/   # unchanged
```

Two deliberate deviations from a textbook layout, for safety:

- **Do not rename `src/data/` → `src/content/`** now. It is the
  best-factored part of the codebase; renaming touches every import for
  zero behavioural benefit. Revisit after mobile beta.
- **`src/state/` stays empty until after mobile beta.** Reducer-izing the
  65 state atoms is the only high-value change that genuinely risks
  pass-the-phone mode, and it needs the characterization tests that the
  earlier extractions create.

---

## 4. Test-first refactor plan (per extraction)

General verification gate for every step, in order:
1. `npm test` green (including new tests for the extracted module).
2. `npm run build` succeeds.
3. `git diff --color-moved` shows verbatim moves for pure extractions.
4. Manual smoke: one pass-the-phone round of the affected round type(s) +
   (for online-touching steps) one full online session
   (create → join ×3 → ready → start → vote → reveal → next round).

### E1 — `src/game/localRounds.js` (Low risk)
- **Tests first** (written against current behaviour, run after the move):
  for each of the 8 round types: round builds with N players; exactly
  `liarCount` liars, liar ∈ players; liar gets imposter prompt, others get
  main prompt; banned words exclude prompt words; `recentPromptKeys`
  avoided when alternatives exist; `usesNoCategorySelection` types ignore
  category; chain rounds assign cards per player; grill rounds carry
  `grillData` defaults; adult prompts only when `adultMode`.
- **Files**: new `src/game/localRounds.js`; App.jsx deletes the functions
  and adds one import line. No call-site changes.
- **Verify**: gate above; play one local round of each type.

### E2 — `src/game/scoring.js` (Low risk)
- **Tests first**: port the server-test scenarios (caught/escaped liar,
  vote gains) and add grill cases (team bonus, liar swing, guess winner ±,
  disqualification penalty, score floor at 0); invalid/self votes
  filtered. These tests double as the **drift detector** vs
  `scoreRoundServer` — assert both implementations agree on the shared
  (non-grill) scenarios by importing both.
- **Files**: new `src/game/scoring.js`; App.jsx import swap.
- **Verify**: gate; one local round through results screen.

### E3 — `src/game/grillJudge.js` (Low risk)
- **Tests first**: `evaluateGrillQuestion` — hint/answer requests flagged
  as cheats; correct guess detection incl. normalization (case,
  punctuation, articles); yes/no/possibly tag inference.
- **Files**: new module; App.jsx + `GrillEmScreen` import swap.
- **Verify**: gate; one Grill 'Em round (typed input is enough; mic path
  unchanged).

### E4 — `src/services/storage.js` (Very low risk)
- **Tests first**: get/set round-trip with stubbed localStorage; corrupt
  JSON returns fallback; clientId stable across calls.
- **Verify**: gate; reload app, confirm settings/persona persist.

### E5 — `src/online/lobbyMessages.js` (Very low risk)
- **Tests first**: table test — every known error code maps to non-empty
  copy; unknown code → fallback.

### E6/E7 — social model / picture packs (Low risk)
- **Tests first**: normalizers are total functions — fuzz with junk input,
  assert shape; pack weights normalize to known manifests only.

### E8 — `src/online/sessionState.js` (Medium risk — do after playtest wave 1)
- **Tests first**: given an action result with `rotatedSessionToken`,
  helper updates session object + storage + transport exactly once;
  no-op when token absent/unchanged.
- **Files**: new module; ~7 handlers in App.jsx replace inline blocks.
- **Verify**: gate + full online session incl. a reconnect and a
  ready-toggle (the two flows most sensitive to token rotation).

### E9/E10 — audio + host voice hooks (Medium risk — after playtesting)
- **Tests first**: limited (browser APIs); extract with the component
  behaviour pinned by manual smoke checklist: BGM per screen, SFX on
  vote/reveal, host talk frames animate, Ian Poster lines play on intro.

### E11 — `useOnlineLobby` (High risk — after playtesting, before beta)
- **Tests first**: integration tests running the real lobby server
  in-process (it's importable ESM) against the hook via `@testing-library/
  react` or a headless harness; cover join/ready/start/vote/resume.
- **Verify**: scripted 3-device online session + disconnect/reconnect.

### E12 — screens → `src/features/` (Medium churn — after playtesting)
- No new tests needed (mechanical moves; props unchanged); rely on build +
  per-screen visual smoke. Move one feature folder per PR.

### E13/E14 — state reducers, shared client/server rules (High — after mobile beta)
- **Tests first**: characterization tests over `startGame → chooseCategory
  → reveal → vote → results → nextRound` state transitions (enabled by
  E1–E3); server imports `src/game/scoring.js` so one implementation
  scores both modes — gated on E2's parity tests being green.

---

## 5. Refactor risk matrix

| Step | Behaviour-change risk | Test cover before merge | Blast radius if wrong | When |
|---|---|---|---|---|
| E4 storage | Very low | unit | settings persistence | Now |
| E5 messages | Very low | unit | error copy | Now |
| E1 rounds | Low | unit (new) | local round generation | Now |
| E2 scoring | Low | unit + server-parity | local scores | Now |
| E3 grill judge | Low | unit | Grill 'Em answers | Now |
| E6 social model | Low | unit | friends/persona forms | Now |
| E7 picture packs | Low | unit | Flash Frame pack mix | Now |
| E8 token helper | Medium | unit + online smoke | online session stability | After playtest wave 1 |
| E9/E10 audio/host hooks | Medium | manual checklist | audio/host feel | After playtesting |
| E12 screen moves | Medium (churn) | build + smoke | imports only | After playtesting |
| E11 online hook | High | integration | online mode | After playtesting |
| E14 shared rules | Medium-High | parity suite | both modes' scoring | After mobile beta |
| E13 state reducers | High | characterization | everything | After mobile beta |

---

## 6. Prioritised lists

### Do now (before/during playtesting) — all low risk, all raise test cover
1. **E1 + E2 + E3**: extract `src/game/` (rounds, scoring, grill judge)
   with the unit tests described above. This is the single best
   bugs-prevented-per-risk move available: it puts the logic that playtest
   feedback will most likely change ("scoring feels wrong", "prompts
   repeat", "grill judge too strict") under tests *before* that feedback
   arrives.
2. **E4 + E5**: storage service + lobby error copy (trivial wins that
   shrink App.jsx's utility noise).
3. **E2 parity tests**: client-vs-server scoring agreement suite (drift
   detector for risk area #3).
4. Add a CI workflow running `npm test` + `npm run build` (none exists).
5. Optional: add vitest as a devDependency for future React-side tests —
   zero runtime risk — but phase 1 needs only the existing `node --test`.

### Do after playtesting (stability window before mobile beta)
6. **E8**: centralize session-token rotation.
7. **E6 + E7**: social model + picture-pack helpers.
8. **E9 + E10**: audio engine and host-voice hooks.
9. **E12**: move screens to `src/features/`, one folder per PR.
10. **E11**: `useOnlineLobby` hook with server-in-process integration
    tests (do this before online beta load grows).

### Do after mobile beta
11. **E14**: single shared rules module consumed by client and server
    (ends the duplicated scoring/prompt banks; also unlocks online parity
    for more round types using the existing data layer).
12. **E13**: consolidate `App()`'s 65 state atoms into `src/state/`
    reducers (game, lobby settings, online session), guarded by the
    characterization tests accumulated above.
13. Revisit `src/data/` → `src/content/` rename (optional; only if it
    still earns its churn).
14. `src/billing/purchaseService.js` for the native purchase/restore
    bridge (designed in MOBILE_DEPLOYMENT_READINESS.md).

### Explicitly not recommended
- Rewriting App.jsx wholesale, introducing a state library (Redux/Zustand),
  or converting to TypeScript before beta — each invalidates the "verify by
  verbatim move" safety property that makes this plan low risk.
