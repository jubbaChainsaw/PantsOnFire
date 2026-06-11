# Playtest Readiness Report — June 2026

Verdict: **pass-the-phone playtesting is unblocked** after the fixes in this
review (the app previously crashed at load). Online playtesting is viable for
the Hot Seat round type only. Audio polish (SFX) is the biggest remaining
quality gap.

## Blockers fixed in this review

1. **App crashed on load** — `src/account/tierModel.js` referenced an
   undefined `DLC_BUNDLE_NAMES_LIST` inside `SUBSCRIPTION_TIERS`, throwing a
   `ReferenceError` during module evaluation. Because `App.jsx` imports this
   module, the entire app (including pass-the-phone mode) failed to start.
   Now derived from `DLC_THEME_PACKS` names. This alone made every playtest
   impossible on a fresh build.
2. **Liar identity leaked online** (see SECURITY_AUDIT.md #1) — a
   playtest-critical leak per PLAYTEST_PLAN.md's "Critical" definition.

## Remaining issues by severity

### Critical (fix before the relevant playtest group)
- **Missing SFX files (13 of 14)** — only `sfx/heartbeat-placeholder.wav`
  exists; code references `fire-crackle.wav`, `imposter-found.wav`,
  `imposter-announced.wav`, `card-flip.wav`, `heartbeat.mp3`, and 9
  `sfx/byteblitz/*` files (Grill 'Em feedback). Failures are silent (no
  crash), but reveal/voting moments lose their punch and Grill 'Em loses its
  audio feedback loop. Generate or source these before Group 1 sessions, or
  consciously accept silent fallback.

### Major
- **Online mode supports only one round type** — the server generates
  Hot Seat (`prompt`) rounds exclusively (`buildAuthoritativeRound`), with a
  hardcoded 5-category/20-prompt bank, regardless of lobby settings. The
  rich client-side round-type/theme system applies to pass-the-phone only.
  Set Group 3 (online) expectations accordingly and document in the lobby UI.
- **Dodgy Audio and Clip Trap are stubbed** — marked `onlineOnly`, but no
  rule text or flow exists. Hide them from selection or finish them; players
  selecting them will hit dead flows.
- **Chain Reaction has no round-type logo** (`src/data/roundTypes.js`) —
  blank tile in the selector.
- **Host voice coverage: 8 of 35+ themes** — others fall back silently to no
  themed dialogue. Acceptable for alpha; flag in the playtest script so
  testers don't report it as a bug repeatedly.

### Minor
- Persona callout voiceover only exists for the 8 launch themes.
- Theme asset fallback hides broken images silently (good: no crash; bad:
  blank panels). Spot-check each theme used in a session beforehand.
- Picture DLC manifests validate structure but not file existence; current
  packs verified complete — re-run checks when adding packs.

## Asset inventory snapshot (verified on disk)
- Theme host idle/talk frames: complete for all shipped themes.
- Persona host videos (mp4/webm): present (70 video files validated).
- Host TTS voice packs: 8 themes complete (739 audio files).
- Picture pack images: all manifest entries resolve.
- SFX: 1 of 14 present (see above).
- Round-type logos: 9 of 10 (Chain Reaction missing).

## Round type matrix

| Round type | Pass-the-phone | Online | Notes |
|---|---|---|---|
| Hot Seat | ✅ | ✅ (only one) | server-authoritative online |
| Truth or Twisted | ✅ | ❌ | |
| Flash Frame | ✅ | ❌ | |
| Name and Blame | ✅ | ❌ | |
| Sound Off | ✅ | ❌ | |
| Off Topic Defense | ✅ | ❌ | |
| Chain Reaction | ✅ | ❌ | logo missing |
| Grill 'Em | ✅ | ❌ | needs byteblitz SFX |
| Dodgy Audio | ❌ | stub | hide or finish |
| Clip Trap | ❌ | stub | hide or finish |

## Suggested playtest gating
- **Group 1/2 (local pass-the-phone):** ready now; SFX strongly recommended
  first.
- **Group 3 (online + voice):** ready for Hot Seat-only sessions; verify a
  deployed Redis + LiveKit environment first and run one internal end-to-end
  session (create → join ×3 → ready → start → vote → reveal → next round →
  disconnect/reconnect) before inviting testers.

## Alpha exit criteria status (docs/ALPHA_EXIT_CRITERIA.md)
- "No reveal leaks" — now true online (was failing).
- "Persona/host artwork complete" — largely met; SFX and host voice coverage
  are the content gaps.
- "Core round types complete" — met for pass-the-phone; online parity is a
  beta-scope decision.
- Redis deployment / reconnect / voice testing — needs a deployed
  environment run-through (not testable in this repo alone).
