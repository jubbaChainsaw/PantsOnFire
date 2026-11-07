# t221u — Ian host commentary toggle (design spec, pending implementation)

**Status:** DESIGN — user asked for review Page material **before** expanded behavior ships.  
**Does not replace** authorized work: online Two Truths / Double Take E2E / `docs/audio/ian-poster-voice-refresh-manifest.json` / round-cue registration in `hostVoiceLineMap.js`.

---

## Goal

A **per-device**, **persistent** toggle in **Settings → Audio** that mutes **Ian Poster host narration only** (bundled TTS MP3s: intro flow, stingers, discussion bridge, Two Truths phase cues, persona name callouts, and any future modular name/suffix clips). **Music, SFX, and real player voice chat stay unchanged.** On-screen **subtitles / copy / UI text** stay visible.

---

## UX (Settings)

- **Placement:** Existing audio section in `SettingsScreen` (`src/App.jsx`), near **Voice chat (online)** — separate row so the distinction is obvious.
- **Label (Chewy ALL CAPS on the heading per product rule):** use the same heading pattern as other rows (`pof-heading` on title). Proposed title:

  **`IAN HOST COMMENTARY`**

  Subtitle (`pof-body` / `pof-desc`, sentence case): *When off, Ian’s voice lines stay silent. Music, sound effects, and party voice chat are unchanged. You’ll still see on-screen text.*

- **Default:** **ON** — matches today’s behavior (host lines play when theme has Ian packs).
- **Scope:** **This device only** — not synced to lobby or cloud profile (unless product later decides otherwise).

---

## Behavior

### When OFF

1. **Immediate:** stop the **current** host `HTMLAudioElement` (if any), clear timers (`fallbackTimerRef`, `pauseTimerRef`, `advanceTimerRef` paths in `src/lib/hostSpeechPlayback.js` / `useHostSpeechAutoAdvance`).
2. **Queue hygiene:** drop any **pending** scripted host narration queue (future modular “name + suffix” chains must clear `pendingSegments` / `nextLine` preload — spec: single owner ref or context).
3. **No stale replay on ON:** turning narration back **on** must **not** auto-replay lines that would have fired while off (bump session / increment `lineKey` generation counter so effects don’t replay old keys).

### When ON

- Resume normal behavior: host lines may play on the **next** eligible `lineKey` / phase transition.

### Must stay active when commentary is OFF

- `playSfx` / music (`music.want`, etc.).
- LiveKit / party **voice chat** — gated only by existing `voiceChatEnabled` and phase screens (`onlineVoiceEnabled` in `App.jsx`).

### Routing requirement (no bypass)

**All** Ian host playback must go through one choke point:

- Today: `useIanPosterHostVoicePlayback` (and `useHostSpeechAutoAdvance` which wraps it) in `src/lib/hostSpeechPlayback.js`.
- **Call sites today:** `App.jsx` — `HostIntroScreen`, `RevealScreen`, `LiarRevealScreen`, `DiscussionTimeHostVoice`, `TwoTruthsPhaseHostVoice`.
- Future modular / banter (t220u): same hook or a thin wrapper that still checks **`hostCommentaryEnabled !== false`** before `enabled: true`.

Optional **defense-in-depth:** guard inside `useIanPosterHostVoicePlayback` with a `React.Context` reader so any missed call site still no-ops audio (subtitle layer unaffected because it is separate UI).

---

## Persistence

- **Storage key:** e.g. `imposter-host-commentary-v1` in `localStorage` (same pattern as `loadFx` / `saveFx` in `src/lib/pofFx.js`), default **`true`** when missing.
- **Offline:** read on boot before first host line; write on toggle change.
- **Not** lobby-wide: each browser / app install has its own value.

---

## Relationship to other settings

| Control | Commentary OFF |
|---------|------------------|
| Background music | Unchanged |
| Sound effects | Unchanged |
| Voice chat (online) | Unchanged |
| Ian host MP3s | **Muted / not started** |
| UI subtitles / captions | **Still shown** |

---

## Tests (planned — post sign-off)

1. **Music/SFX:** With commentary off, trigger SFX + music-eligible screen — assert audio elements / `playSfx` still run; assert **no** `Audio` from host candidates (spy or flag on hook).
2. **Voice chat:** Commentary off, online discussion phase — LiveKit connect still allowed when `voiceChatEnabled` true.
3. **Toggle interrupt:** Start a host clip, flip commentary off mid-play — assert `stopPlayback` / no `ended` fired for completion that advances dialogue.
4. **Queue clear:** (after modular queue exists) enqueue name+suffix, toggle off — assert queue length 0 / no deferred `setTimeout` play.
5. **Persistence:** Set off, reload — still off; default fresh profile — on.
6. **Stale event:** Toggle off through a phase, toggle on next phase — assert previous line does not play.

---

## Review Page — one-paragraph summary

**IAN HOST COMMENTARY** is a per-device setting (default on) that silences Ian Poster’s pre-recorded host voice while keeping music, SFX, and party voice chat. Turning it off stops the current line immediately and clears any queued host audio; turning it on only affects new moments—nothing catches up while it was off. Text and subtitles stay.

---

## Sign-off

Implementation waits on product OK of this spec (labels, default-on, local-only persistence).
