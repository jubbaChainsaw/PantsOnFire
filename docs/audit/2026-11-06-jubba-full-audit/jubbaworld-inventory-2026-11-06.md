# Pants on Fire — JubbaWorld inventory snapshot

- Fetched: **2026-11-06 18:34:07 GMT** (Europe/London) / `2026-11-06T18:34:07.458018+00:00` UTC
- Source: `https://jubbachainsaw.co.uk/api/bot/projects/pants-on-fire/items` (+ `/items/{id}` enrichment)
- Auth: env `JUBBAWORLD_POF_TOKEN` (not echoed)
- Count: **119** items (API total=119)
- Mutations: **none** (read-only export)
- Trust rule: **Do not treat tracker Done as verified** without repo/test/dashboard evidence
- Cursor note: preliminary draft only; unit tests 49 app / 41 server; **E2E/mobile smoke not attempted** (must run locally next)

## Counts

### By type
- `defect`: 43
- `enhancement`: 24
- `requirement`: 15
- `story`: 27
- `test`: 3
- `work_task`: 7

### By status
- `Backlog`: 23
- `Done`: 61
- `In progress`: 32
- `To do`: 3

### By type × status

| Type | Status | Count |
|---|---|---:|
| defect | Done | 30 |
| defect | In progress | 13 |
| enhancement | Done | 15 |
| enhancement | In progress | 7 |
| enhancement | To do | 2 |
| requirement | Backlog | 9 |
| requirement | In progress | 6 |
| story | Backlog | 13 |
| story | Done | 9 |
| story | In progress | 5 |
| test | Backlog | 1 |
| test | Done | 1 |
| test | In progress | 1 |
| work_task | Done | 6 |
| work_task | To do | 1 |

## Limitations

- Auth env JUBBAWORLD_POF_TOKEN (not echoed). Project-scoped bot token.
- List endpoint /projects/pants-on-fire/items?limit=200 returned all 119 items with descriptions, checklists, createdAt/updatedAt/done.
- GET /items/{id} enrichment hit Rate limit: 60 calls per 60s; after retries 119/119 details fetched (or note remaining_errors). Detail payload omits createdAt/updatedAt/done.
- Subroutes comments/updates/blockers/history/acceptance return 403 for POF token; owner token returns 404 Unknown bot route — comments/updates not available via bot API as probed.
- Acceptance criteria live in description text and/or checklist[]; no separate AC endpoint.
- Docs endpoint returned empty/minimal payload.
- Do not trust tracker Done without repo/test/dashboard evidence.
- No mutations performed in this export.
- Cursor preliminary note (parent): only draft audit + unit tests 49 app / 41 server so far; E2E/mobile smoke NOT attempted — must be exercised on next audit run locally.

## Notable tracker inconsistencies (retained as evidence)

### POF-DEC-001 marked Done without Jubba decision
- Number: `WTSK0002`
- Status: `Done` / done=True / progress=0
- Title: Decision pending: PR #112 (manual-only Android debug workflow) conflicts with branch workflow
- Description: PR #112 from main makes the Android debug workflow manual-only and conflicts with the workflow on cursor/ionos-web-deploy-6e4c. Not merged; a choice between the two is needed later.

Source: Toolsmith docs drift report 2026-11-01, approved by Jubba. Branch cursor/ionos-web-deploy-6e4c (PR #111).
- Context: only a recommendation was produced; Jubba has not decided on PR #112. Treat Done as incorrect/unverified.

### Timestamp API quirk
- `GET /items/{id}` returns no `createdAt`/`updatedAt`/`done`.
- List endpoint includes those fields; snapshot uses list as primary and records `_tracker_evidence`.
- Earlier agent reads noted oddly missing recent modified timestamps despite Nov 3 activity — do not over-trust freshness from tracker alone.

## Conversation requirements (for audit; NOT filed to JubbaWorld yet)

### CONV-REQ-FONT-CHEWY
- Source: user conversation / store graphics review
- Statement: Display font must be Chewy with black outline and drop shadow (as chosen).
- Related tracker refs: POF-FIX-STORE-GRAPHICS-FONT, POF-UI-004
- Approval note: Graphics with corrected Chewy approved in t208u; fonts must remain Chewy.

### CONV-REQ-ALL-CAPS
- Source: user t207u
- Statement: All fonts in headers etc should be ALL CAPS. Apply to headings, titles, button labels, nav; not player names, chat, or prompts. Body text may stay sentence case.
- Related tracker refs: POF-ENH-DISPLAY-CAPS
- Notes: Remaining div-based titles noted incomplete; nothing deployed yet at approval time.

### CONV-REQ-GRAPHICS-APPROVED
- Source: user t208u
- Statement: Draft store graphics (icon, feature graphic, 3 portrait marketing stills) with ALL CAPS + Chewy approved for content review. Approval is not merge/upload/deploy permission.
- Related tracker refs: POF-ENH-006, POF-FIX-STORE-GRAPHICS-FONT, POF-ENH-DISPLAY-CAPS

### CONV-REQ-PASS-PHONE-AND-ONLINE
- Source: standing product requirements from project context
- Statement: Game supports pass-phone and online play modes.

### CONV-REQ-VOICE-TURN-PHASE
- Source: standing product requirements from project context
- Statement: One-word turn phase: microphone only for current player; then open discussion. Default voice on.

### CONV-REQ-REPORT-BLOCK-DELETE
- Source: standing product requirements from project context
- Statement: Report/block and deletion flows required.

### CONV-REQ-AGE-13-PLUS
- Source: standing product requirements / store work
- Statement: Age rating / audience is 13+; prompt reword for 13+ Travel Mix-up logged/done in tracker as part of store prep.

### CONV-REQ-PROMPT-SOURCE-SELECTION
- Source: standing product requirements from project context
- Statement: Newest bundled/cache/live source selection for prompts; debug bundled default.

### CONV-REQ-NO-LIVE-WITHOUT-APPROVAL
- Source: standing security/process rules
- Statement: No release/merge/deploy/live payments changes without Jubba explicit approval. Jubba merges himself. Secrets never echoed.

### CONV-REQ-REVIEW-AS-PAGE
- Source: user t204u
- Statement: Whenever something needs review, present it as a Page showing the actual item, not only a PR link.

## Full item inventory

Grouped by type. Status Done is shown as reported by tracker only.

## Type: requirement (15)

### REQ0005 — seed:pants-on-fire:pof-R1
- Title: Core party game loop
- Status: **In progress** | done=False | progress=0 | priority=High
- Created: 2026-10-27T19:44:01 | Updated: 2026-10-27T20:48:29
- Source: bot=First README (initial commit 72c2653, 2026-04-23) link=https://github.com/jubbaChainsaw/PantsOnFire/blob/72c2653414c828243149b699b16aa024b3d316f2/README.md
- Description:

```
Home / Setup / Store / Settings; round types (prompt, opinion, picture, sound, video); Classic and Chaos modes; rules splash; suspense liar reveal; themed names.

Source: First README (initial commit 72c2653, 2026-04-23) · Date: 2026-04-23
```

### REQ0006 — seed:pants-on-fire:pof-R2
- Title: Grill 'Em voice I/O
- Status: **Backlog** | done=False | progress=0 | priority=High
- Created: 2026-10-27T19:44:01 | Updated: 2026-10-27T20:48:29
- Source: bot=First README "Audio Architecture Requirement" link=https://github.com/jubbaChainsaw/PantsOnFire/blob/72c2653414c828243149b699b16aa024b3d316f2/README.md
- Description:

```
Player questions captured via microphone, AI answers spoken with TTS; same voice pipeline reused for online party chat.

Source: First README "Audio Architecture Requirement" · Date: 2026-04-23
UNCERTAIN: Not seen in any transcript; status unknown.
```

### REQ0007 — seed:pants-on-fire:pof-R3
- Title: Mobile app build
- Status: **In progress** | done=False | progress=0 | priority=High
- Created: 2026-10-27T19:44:01 | Updated: 2026-10-27T20:48:29
- Source: bot=First README (Expo test shell); transcripts link=https://github.com/jubbaChainsaw/PantsOnFire
- Description:

```
Expo/Android shell then installable release APK.

Source: First README (Expo test shell); transcripts · Date: 2026-04-23
```

### REQ0008 — seed:pants-on-fire:pof-R4
- Title: Neon UI redesign
- Status: **In progress** | done=False | progress=0 | priority=High
- Created: 2026-10-27T19:44:01 | Updated: 2026-10-27T20:48:29
- Source: bot=First ask t0u/t3u (POF transcript) link=
- Description:

```
Design the UI in MagicPath around the new neon graphics and port it into the real game.

Source: First ask t0u/t3u (POF transcript) · Date: 2026-04-23
```

### REQ0009 — seed:pants-on-fire:pof-R5
- Title: Online multiplayer lobbies
- Status: **Backlog** | done=False | progress=0 | priority=High
- Created: 2026-10-27T19:44:01 | Updated: 2026-10-27T20:48:29
- Source: bot=First README (future online mode); transcripts link=
- Description:

```
Jackbox-style multi-device sessions with lobby codes, timers and owner controls.

Source: First README (future online mode); transcripts · Date: 2026-04-23
```

### REQ0010 — seed:pants-on-fire:pof-R6
- Title: Quality and testing
- Status: **In progress** | done=False | progress=0 | priority=High
- Created: 2026-10-27T19:44:01 | Updated: 2026-10-27T20:48:29
- Source: bot=Transcripts link=
- Description:

```
End-to-end test suite across the game loop.

Source: Transcripts · Date: 2026-04-23
```

### REQ0011 — seed:pants-on-fire:pof-R7
- Title: Infrastructure / hosting
- Status: **In progress** | done=False | progress=0 | priority=High
- Created: 2026-10-27T19:44:01 | Updated: 2026-10-27T20:48:29
- Source: bot=Transcripts link=
- Description:

```
Build pipeline, lobby backend hosting, MCP wiring, security hardening.

Source: Transcripts · Date: 2026-04-23
```

### REQ0012 — pof:req:upload-keystore
- Title: Martin to supply upload keystore or enable Play App Signing
- Status: **Backlog** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T22:10:07 | Updated: 2026-10-27T22:10:07
- Source: bot=POF link=

### REQ0013 — pof:req:play-console-app
- Title: Martin to create Play Console app
- Status: **Backlog** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T22:10:08 | Updated: 2026-10-27T22:10:08
- Source: bot=POF link=

### REQ0014 — pof:req:confirm-package
- Title: Confirm package name app.pantsonfire.liar
- Status: **Backlog** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T22:10:08 | Updated: 2026-10-27T22:10:08
- Source: bot=POF link=

### REQ0015 — pof:req:privacy-policy
- Title: Privacy policy URL
- Status: **Backlog** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T22:10:09 | Updated: 2026-10-27T22:10:09
- Source: bot=POF link=

### REQ0016 — pof:req:eas-project-id
- Title: EAS project id
- Status: **Backlog** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T22:10:09 | Updated: 2026-10-27T22:10:09
- Source: bot=POF link=

### REQ0017 — pof:req:online-two-truths
- Title: Online server support for Two Truths round
- Status: **Backlog** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T22:10:10 | Updated: 2026-10-27T22:10:10
- Source: bot=POF link=

### REQ0018 — pof:req:meme-decoder-hold
- Title: Meme Decoder on hold for rethink
- Status: **Backlog** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T22:10:10 | Updated: 2026-10-27T22:10:10
- Source: bot=POF link=
- Description:

```
On hold pending rethink.
```

### REQ0019 — (no externalRef)
- Title: Decision: keep live-website loading with version-aware selection; debug builds default to bundled with a Game source toggle
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-31T17:04:50 | Updated: 2026-10-31T17:04:50
- Source: bot=POF link=
- Description:

```
Problem: be03dd5 APK showed the old UI because the app switched to the not-yet-updated live site. Commit 33f410e then pinned release builds to the bundled copy without instruction, which contradicted the architecture. Jubba (31 Oct) confirmed live loading stays. Fix: load the newest compatible copy (live, cached or bundled); debug builds default to bundled; a Game source toggle for testing; a build stamp shows the version and source.
```

## Type: story (27)

### STRY0001 — seed:pants-on-fire:pof-infra-1
- Title: Wire Cursor MCP servers (GitHub, Playwright, Supabase, Railway)
- Status: **Backlog** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R7 (REQ0011) parentStory=None (None)
- Source: bot=GitHub PR #97 (open, unmerged) link=https://github.com/jubbaChainsaw/PantsOnFire/pull/97
- Checklist: 0/3
  - [ ] Merge PR #97
  - [ ] Set GITHUB_PERSONAL_ACCESS_TOKEN locally
  - [ ] Complete Supabase + Railway OAuth in Cursor
- Description:

```
.cursor/mcp.json; env var GITHUB_PERSONAL_ACCESS_TOKEN; OAuth for Supabase (read-only) and Railway (lobby deploy/debug).

Acceptance criteria:
- Delivered as described
- Checklist complete

Source: GitHub PR #97 (open, unmerged) · Date: 2026-05-25
```

### STRY0002 — seed:pants-on-fire:pof-infra-2
- Title: Production hardening of lobby server (CORS, Redis, Supabase entitlements)
- Status: **Backlog** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R7 (REQ0011) parentStory=None (None)
- Source: bot=GitHub PR #102 (open) link=https://github.com/jubbaChainsaw/PantsOnFire/pull/102
- Description:

```
LOBBY_CLIENT_ORIGINS required in production; VITE_ENABLE_* guards; Supabase-backed RevenueCat entitlements (docs/supabase-entitlements-migration.sql); CI workflow lint/test/build.

Acceptance criteria:
- Delivered as described
- Checklist complete

Source: GitHub PR #102 (open) · Date: 2026-06-08
UNCERTAIN: PR #102 still open/unmerged (re-checked 2026-10-27)
```

### STRY0003 — seed:pants-on-fire:pof-infra-4
- Title: Android release APK build pipeline
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R7 (REQ0011) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063); cloud agent summaries link=https://github.com/jubbaChainsaw/PantsOnFire/pull/105
- Checklist: 3/4
  - [x] Release build with embedded bundle
  - [x] WebP conversion + slim dist
  - [x] Relative asset base for WebView
  - [ ] Emulator verification
- Description:

```
npm run android:apk -> assembleRelease; scripts/patch-android-native.cjs (arm64, R8 minify, resource shrink); POF_MOBILE_BUILD=1, EXPO_PUBLIC_USE_BUNDLED_WEB=1; WebViewAssetLoader at appassets.androidplatform.net; publish to GitHub release neon-debug-apk.

Acceptance criteria:
- Delivered as described
- Checklist complete

Source: POF bot transcript (7430b063); cloud agent summaries · Date: 2026-10-27
```

### STRY0004 — seed:pants-on-fire:pof-infra-3
- Title: Security/deployment hardening (alpha review)
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R7 (REQ0011) parentStory=None (None)
- Source: bot=GitHub PR #103 (merged) link=https://github.com/jubbaChainsaw/PantsOnFire/pull/103
- Description:

```
Per-IP rate limits, LiveKit 15m tokens, Redis TTL lobbies, constant-time webhook secret, shared Supabase admin client.

Acceptance criteria:
- Delivered as described
- Checklist complete

Source: GitHub PR #103 (merged) · Date: 2026-06-11
```

### STRY0005 — seed:pants-on-fire:pof-infra-5
- Title: Online lobby backend hosting for sideloaded builds
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R7 (REQ0011) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063); GitHub commit 5ad7785 / PR #59 link=https://github.com/jubbaChainsaw/PantsOnFire/pull/59
- Description:

```
Lobby server hosted on Railway (deploy config commit 5ad7785, PR #59 merged 2026-05-14). Online play from the sideloaded neon APK still needs the live lobby URL baked in.

Acceptance criteria:
- Delivered as described
- Checklist complete

Source: POF bot transcript (7430b063); GitHub commit 5ad7785 / PR #59 · Date: 2026-05-14
```

### STRY0006 — seed:pants-on-fire:pof-req-1
- Title: Redesign UI in MagicPath around new neon graphics
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R4 (REQ0008) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063) link=https://github.com/jubbaChainsaw/PantsOnFire/pull/105
- Checklist: 2/2
  - [x] Built
  - [x] Verified
- Description:

```
Pull PantsOnFire repo into MagicPath, design core game loop screens; keep prompt cards, persona avatars and card decks art (t0u-t3u).

Acceptance criteria:
- Delivered as described
- Verified by Martin or a test task

Source: POF bot transcript (7430b063) · Date: 2026-10-27
```

### STRY0007 — seed:pants-on-fire:pof-req-2
- Title: Port neon redesign into the real game
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R4 (REQ0008) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063); PR #105 summary link=https://github.com/jubbaChainsaw/PantsOnFire/pull/105
- Checklist: 1/2
  - [x] Built
  - [ ] Verified
- Description:

```
All screens in neon shell; only Home is a faithful port, others share a general neon style.

Acceptance criteria:
- Delivered as described
- Verified by Martin or a test task

Source: POF bot transcript (7430b063); PR #105 summary · Date: 2026-10-27
UNCERTAIN: Pixel-perfect ports of 21 non-Home screens not done
```

### STRY0008 — seed:pants-on-fire:pof-req-3
- Title: Installable Android APK
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R3 (REQ0007) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063) link=https://github.com/jubbaChainsaw/PantsOnFire/releases/tag/neon-debug-apk
- Checklist: 1/2
  - [x] Built
  - [ ] Verified
- Description:

```
Standalone release APK (arm64, ~49-55 MB) published on releases page.

Acceptance criteria:
- Delivered as described
- Verified by Martin or a test task

Source: POF bot transcript (7430b063) · Date: 2026-10-27
```

### STRY0009 — seed:pants-on-fire:pof-req-4
- Title: End-to-end test suite
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R6 (REQ0010) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063) link=https://github.com/jubbaChainsaw/PantsOnFire/pull/105
- Checklist: 1/2
  - [x] Built
  - [ ] Verified
- Description:

```
39 tests passing (logic/server + Playwright); full-game flows added later; screen checks for loaded images and no-scroll fit.

Acceptance criteria:
- Delivered as described
- Verified by Martin or a test task

Source: POF bot transcript (7430b063) · Date: 2026-10-27
```

### STRY0010 — seed:pants-on-fire:pof-st-1
- Title: Five round types playable
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T19:44:01 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R1 (REQ0005) parentStory=None (None)
- Source: bot=First README link=
- Checklist: 3/4
  - [x] Prompt round
  - [x] Opinion round
  - [x] Picture/sound/video placeholders
  - [ ] Real media assets
- Description:

```
Prompt and opinion rounds playable; picture, sound and video rounds start as placeholders.

Acceptance criteria:
- All five round types selectable
- Media rounds use real assets, not placeholders

Source: First README · Date: 2026-04-23
UNCERTAIN: README lists media rounds as placeholders; current state not confirmed.
```

### STRY0011 — seed:pants-on-fire:pof-st-2
- Title: Classic/Chaos modes, rules splash and liar reveal
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T19:44:01 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R1 (REQ0005) parentStory=None (None)
- Source: bot=First README link=
- Checklist: 4/4
  - [x] Classic
  - [x] Chaos
  - [x] Rules splash
  - [x] Suspense reveal
- Description:

```
Mode choice, rules splash before play, suspense reveal of the liar.

Acceptance criteria:
- Both modes start a game
- Rules splash shown
- Reveal screen with heartbeat SFX

Source: First README · Date: 2026-04-23
```

### STRY0012 — seed:pants-on-fire:pof-st-3
- Title: Grill 'Em mic capture + TTS answers
- Status: **Backlog** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T19:44:01 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R2 (REQ0006) parentStory=None (None)
- Source: bot=First README link=
- Checklist: 0/3
  - [ ] Mic capture
  - [ ] TTS playback
  - [ ] Shared module
- Description:

```
Shared voice pipeline (mic in, TTS out) for Grill 'Em and later online chat.

Acceptance criteria:
- Mic permission requested and handled
- AI answer spoken aloud
- Pipeline reusable by online mode

Source: First README · Date: 2026-04-23
UNCERTAIN: No evidence of implementation.
```

### STRY0013 — pof:story:two-truths-mode
- Title: Two Truths, One Fire mode
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T22:09:48 | Updated: 2026-10-27T22:09:48
- Source: bot=POF link=
- Description:

```
Pass-the-phone, 60s online timer, timeout rules, shuffled voting.
```

### STRY0014 — pof:story:magicpath-shop-mockup
- Title: MagicPath shop themes/packs redesign mockup (awaiting Martin feedback)
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T22:09:51 | Updated: 2026-10-27T22:09:51
- Source: bot=POF link=
- Description:

```
Mockup done; awaiting Martin's feedback.
```

### STRY0015 — pof:story:report-bug
- Title: Report a bug feature
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T22:09:55 | Updated: 2026-10-27T22:09:55
- Source: bot=POF link=
- Description:

```
In Settings + Pause; screenshot + diagnostics; offline queue.
```

### STRY0016 — pof:story:ota-updates
- Title: OTA updates via expo-updates/EAS
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T22:09:55 | Updated: 2026-10-27T22:09:55
- Source: bot=POF link=
- Description:

```
Preview and production channels.
```

### STRY0017 — pof:story:aab-packaging
- Title: AAB release packaging (placeholder-signed)
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T22:09:56 | Updated: 2026-10-27T22:09:56
- Source: bot=POF link=

### STRY0018 — chatgpt:pants-on-fire:theme-av
- Title: Themes drive graphics, music and sound effects
- Status: **Backlog** | done=False | progress=0 | priority=Medium
- Created: 2026-10-29T10:41:30 | Updated: 2026-10-29T10:41:30
- Source: bot=Grok Bot link=
- Description:

```
From ChatGPT conversation 'Imposter Party Game Design' (2026-04-20): Selecting a theme changes the visuals, music and SFX together.
```

### STRY0019 — chatgpt:pants-on-fire:host-lines
- Title: Dynamic randomised host greetings and comments each round
- Status: **Backlog** | done=False | progress=0 | priority=Medium
- Created: 2026-10-29T10:41:34 | Updated: 2026-10-29T10:41:34
- Source: bot=Grok Bot link=
- Description:

```
From ChatGPT conversation 'Imposter Party Game Design' (2026-04-20): Host lines vary randomly per round so it doesn't feel repetitive.
```

### STRY0020 — chatgpt:pants-on-fire:chaos-banned
- Title: Chaos banned words relevant to both prompts, excluding prompt/category/hint words
- Status: **Backlog** | done=False | progress=0 | priority=Medium
- Created: 2026-10-29T10:41:37 | Updated: 2026-10-29T10:41:37
- Source: bot=Grok Bot link=
- Description:

```
From ChatGPT conversation 'Imposter Party Game Design' (2026-04-20): Banned words in Chaos rounds must relate to both the real and liar prompts and never be the prompt, category or hint words.
```

### STRY0021 — chatgpt:pants-on-fire:round-points
- Title: Show points added per round on the leaderboard
- Status: **Backlog** | done=False | progress=0 | priority=Medium
- Created: 2026-10-29T10:41:41 | Updated: 2026-10-29T10:41:41
- Source: bot=Grok Bot link=
- Description:

```
From ChatGPT conversation 'Imposter Party Game Design' (2026-04-20): Leaderboard animates/shows the points each player gained this round.
```

### STRY0022 — chatgpt:pants-on-fire:heartbeat
- Title: Heartbeat sound and pulsing screen before the liar reveal
- Status: **Backlog** | done=False | progress=0 | priority=Medium
- Created: 2026-10-29T10:41:44 | Updated: 2026-10-29T10:41:44
- Source: bot=Grok Bot link=
- Description:

```
From ChatGPT conversation 'Imposter Party Game Design' (2026-04-20): Build tension before the reveal with a heartbeat SFX and pulsing screen.
```

### STRY0023 — chatgpt:pants-on-fire:av-online-only
- Title: Audio/video rounds only in online lobbies, not pass-the-phone
- Status: **Backlog** | done=False | progress=0 | priority=Medium
- Created: 2026-10-29T10:41:47 | Updated: 2026-10-29T10:41:47
- Source: bot=Grok Bot link=
- Description:

```
From ChatGPT conversation 'Imposter Party Game Design' (2026-04-20): Rounds needing audio/video are excluded from pass-the-phone mode.
```

### STRY0024 — chatgpt:pants-on-fire:round-chooser
- Title: Round chooser: pick round type from 2 options (not the previous), then category
- Status: **Backlog** | done=False | progress=0 | priority=Medium
- Created: 2026-10-29T10:41:51 | Updated: 2026-10-29T10:41:51
- Source: bot=Grok Bot link=
- Description:

```
From ChatGPT conversation 'Imposter Party Game Design' (2026-04-20): The chooser is offered two round types (never the previous round's type), then picks the category.
```

### STRY0025 — chatgpt:pants-on-fire:rules-settings
- Title: Game rules settings: points to win 10/15/20, rounds per player 1/2/3
- Status: **Backlog** | done=False | progress=0 | priority=Medium
- Created: 2026-10-29T10:41:54 | Updated: 2026-10-29T10:41:54
- Source: bot=Grok Bot link=
- Description:

```
From ChatGPT conversation 'Imposter Party Game Design' (2026-04-20): Lobby settings for target points and rounds per player.
```

### STRY0026 — chatgpt:pants-on-fire:host-costumes
- Title: Host presenter costume variants per theme
- Status: **Backlog** | done=False | progress=0 | priority=Medium
- Created: 2026-10-29T10:41:57 | Updated: 2026-10-29T10:41:57
- Source: bot=Grok Bot link=
- Description:

```
From ChatGPT conversation 'Imposter Party Game Design' (2026-04-20): The host persona wears a theme-matched outfit.
```

### STRY0027 — chatgpt:pants-on-fire:infomercial
- Title: 30-second 'Ian Poster' infomercial video
- Status: **Backlog** | done=False | progress=0 | priority=Medium
- Created: 2026-10-29T10:42:01 | Updated: 2026-10-29T10:42:01
- Source: bot=Grok Bot link=
- Description:

```
From ChatGPT conversation 'Pants on Fire Script' (2026-05-13): Produce the 30s infomercial-style promo scripted in ChatGPT.
```

## Type: work_task (7)

### WTSK0001 — POF-ENH-004
- Title: Retrospective logging: backfill past fixes and decisions from chat history
- Status: **To do** | done=False | progress=0 | priority=Medium
- Created: 2026-10-31T13:05:49 | Updated: 2026-10-31T13:05:49
- Source: bot=POF link=
- Description:

```
Go through POF chat history and log past bugs, fixes, enhancements and decisions (what was wrong, how fixed). Do it during development gaps.
```

### WTSK0002 — POF-DEC-001
- Title: Decision pending: PR #112 (manual-only Android debug workflow) conflicts with branch workflow
- Status: **Done** | done=True | progress=0 | priority=Medium
- Created: 2026-11-01T16:40:17 | Updated: 2026-11-03T10:31:41
- Source: bot=POF link=
- Description:

```
PR #112 from main makes the Android debug workflow manual-only and conflicts with the workflow on cursor/ionos-web-deploy-6e4c. Not merged; a choice between the two is needed later.

Source: Toolsmith docs drift report 2026-11-01, approved by Jubba. Branch cursor/ionos-web-deploy-6e4c (PR #111).
```

### WTSK0003 — POF-DEC-002
- Title: Decision: Web DLC packs repriced to £0.99 (Stripe sandbox)
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-11-01T16:40:18 | Updated: 2026-11-01T16:40:18
- Source: bot=POF link=
- Description:

```
Decision: web DLC packs priced at £0.99. Done: new Stripe sandbox price price_1UWofeFW10TGb7BArFgcjR86 on prod_VWNTxVbMdw4sxU; Railway lobby-server STRIPE_PRICE_DLC_PACK updated; deploy e80aacd4 healthy; catalog shows £0.99. Sandbox/test mode only; live mode to follow.

Source: Toolsmith docs drift report 2026-11-01, approved by Jubba. Branch cursor/ionos-web-deploy-6e4c (PR #111).
```

### WTSK0004 — POF-ENH-006
- Title: 13+ prompt copy: Travel Disasters pack
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-11-03T10:31:38 | Updated: 2026-11-03T10:31:38
- Source: bot=POF link=
- Description:

```
Travel Mix-up prompt used walk-of-shame / awkward checkout wording read as sexual for 13+ default. Reworded to embarrassing lobby checkout vs early-morning airport dash in pajamas (same travel-disaster theme).
Files: src/data/packs/categoryPromptPacks.js
Commit: 8b2881c
```

### WTSK0005 — POF-ENH-007
- Title: Play Store listing draft + graphics
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-11-03T10:31:39 | Updated: 2026-11-03T10:31:39
- Source: bot=POF link=
- Description:

```
Draft short/full descriptions, subscription benefit bullets (£2.99 / £4.99 / £9.99), content declaration answer notes, and generated icon/feature/screenshots (Chewy outlined neon style) under docs/store/.
Files: docs/store/play-listing.md, docs/store/content-declarations-notes.md, docs/store/graphics/icon-512.png, docs/store/graphics/feature-1024x500.png, docs/store/graphics/screenshot-01-home.png, docs/store/graphics/screenshot-02-ingame.png, docs/store/graphics/screenshot-03-lobby.png, scripts/generatePlayStoreGraphics.mjs
Commit: 3b5a5d1
```

### WTSK0006 — POF-ENH-008
- Title: Stripe live + RevenueCat production checklist (research)
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-11-03T10:31:39 | Updated: 2026-11-03T10:31:39
- Source: bot=POF link=
- Description:

```
Documented click-path for Jubba: live Stripe products/prices matching sandbox (99p DLC, £1.99 Twist, tier subs), Railway env vars, RevenueCat goog_ Android key + Play service account link, webhooks, and fixing non-UK subscription prices via Play Console / Stripe currency options. No live changes in repo.
Files: docs/store/STRIPE_REVENUECAT_LIVE_CHECKLIST.md
Commit: 3b5a5d1
```

### WTSK0007 — POF-FIX-STORE-GRAPHICS-FONT
- Title: Store graphics font fix: Chewy TTF glyph paths
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-11-06T18:25:17 | Updated: 2026-11-06T18:25:17
- Source: bot=POF link=https://github.com/jubbaChainsaw/PantsOnFire/commit/d8adf1a
- Description:

```
Root cause: SVG webfont fallback; fix actual Chewy glyph paths. Commit d8adf1a renders actual Chewy TTF glyphs with black outline/drop shadow on Play Store graphics (icon, feature, home/ingame/lobby marketing stills). Earlier PNGs showed generic serif fallback. Review Page updated; still draft — not uploaded or approved. No deletes.
```

## Type: enhancement (24)

### ENHC0001 — seed:pants-on-fire:pof-enh-12
- Title: Custom "Pants on Fire" font (colour, outline and Narrow variants)
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R4 (REQ0008) parentStory=None (None)
- Source: bot=Grok Bot transcript (98db2e85); GitHub PR #104 (open) link=https://github.com/jubbaChainsaw/PantsOnFire/pull/104
- Description:

```
Font assets requested 02:13 UTC; Narrow variant 02:24; added in PR #104 (open, unmerged).

Source: Grok Bot transcript (98db2e85); GitHub PR #104 (open) · Date: 2026-10-27
```

### ENHC0002 — seed:pants-on-fire:pof-enh-10
- Title: Pants on Fire app icon and app name
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R3 (REQ0007) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063) link=https://github.com/jubbaChainsaw/PantsOnFire/releases/tag/neon-debug-apk
- Description:

```
t25u-t26u.

Source: POF bot transcript (7430b063) · Date: 2026-10-27
```

### ENHC0003 — seed:pants-on-fire:pof-enh-6
- Title: Unique persona names; move persona settings into Settings; wire help/leaderboard icons
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R1 (REQ0005) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063) link=
- Description:

```
t14u.

Source: POF bot transcript (7430b063) · Date: 2026-10-27
UNCERTAIN: Unique names tested; icons wiring not confirmed
```

### ENHC0004 — seed:pants-on-fire:pof-enh-4
- Title: Lobby code in plain bold font
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R5 (REQ0009) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063) link=
- Description:

```
t10u.

Source: POF bot transcript (7430b063) · Date: 2026-10-27
UNCERTAIN: Not explicitly confirmed in summaries read
```

### ENHC0005 — seed:pants-on-fire:pof-enh-11
- Title: Legibility: outline font only for headings, Inter for body
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R4 (REQ0008) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063) link=https://github.com/jubbaChainsaw/PantsOnFire/pull/105
- Description:

```
t29u.

Source: POF bot transcript (7430b063) · Date: 2026-10-27
```

### ENHC0006 — seed:pants-on-fire:pof-enh-9
- Title: Custom prompts = lobby owner editor add-on, not player prompts
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R5 (REQ0009) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063); PR #105 link=https://github.com/jubbaChainsaw/PantsOnFire/pull/105
- Description:

```
t19u; hostPromptEditorUnlocked + editor warning dialog.

Source: POF bot transcript (7430b063); PR #105 · Date: 2026-10-27
```

### ENHC0007 — seed:pants-on-fire:pof-enh-7
- Title: Theme tune: vocal on menus, instrumental quieter in gameplay
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R1 (REQ0005) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063); PR #105 music/haptics (pofFx) link=https://github.com/jubbaChainsaw/PantsOnFire/pull/105
- Description:

```
t15u-t16u.

Source: POF bot transcript (7430b063); PR #105 music/haptics (pofFx) · Date: 2026-10-27
```

### ENHC0008 — seed:pants-on-fire:pof-enh-3
- Title: Online lobbies: 30s vote / selection timer with random flash pick
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R5 (REQ0009) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063); PR #105 "online 30s timed choice" link=https://github.com/jubbaChainsaw/PantsOnFire/pull/105
- Description:

```
Last 3 seconds options flash and one is picked at random (t9u, t12u).

Source: POF bot transcript (7430b063); PR #105 "online 30s timed choice" · Date: 2026-10-27
```

### ENHC0009 — seed:pants-on-fire:pof-enh-5
- Title: Remove 18+ toggle; Settings page for sound/music/haptics; custom-prompt warning
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R1 (REQ0005) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063); PR #105 tests "no 18+ on Home", s link=https://github.com/jubbaChainsaw/PantsOnFire/pull/105
- Description:

```
t13u.

Source: POF bot transcript (7430b063); PR #105 tests "no 18+ on Home", settings persist · Date: 2026-10-27
```

### ENHC0010 — seed:pants-on-fire:pof-enh-13
- Title: Use Narrow outline font for buttons and UI headings
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R4 (REQ0008) parentStory=None (None)
- Source: bot=Grok Bot transcript (98db2e85) -> POF bot link=
- Description:

```
Applied to the MagicPath designs only (02:28 UTC); not yet in repo code.

Source: Grok Bot transcript (98db2e85) -> POF bot · Date: 2026-10-27
```

### ENHC0011 — seed:pants-on-fire:pof-enh-1
- Title: Category screen: 6 random categories (2x3) + Choose for me
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T22:23:05
- Links: requirement=seed:pants-on-fire:pof-R1 (REQ0005) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063) (t6u,t12u); PR #105 summary link=https://github.com/jubbaChainsaw/PantsOnFire/pull/105
- Description:

```
Only six randomised categories; "choose for me" picks one of the six; no reshuffle (t6u, t12u).

Source: POF bot transcript (7430b063) (t6u,t12u); PR #105 summary · Date: 2026-10-27
```

### ENHC0012 — seed:pants-on-fire:pof-enh-2
- Title: Randomise round types, categories and pass-the-phone voting order
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R1 (REQ0005) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063) link=https://github.com/jubbaChainsaw/PantsOnFire/pull/105
- Description:

```
t7u.

Source: POF bot transcript (7430b063) · Date: 2026-10-27
```

### ENHC0013 — seed:pants-on-fire:pof-enh-8
- Title: Shop access to upgrade account / buy packs using existing tiers
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T22:23:03
- Links: requirement=seed:pants-on-fire:pof-R1 (REQ0005) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063) link=
- Description:

```
t17u-t18u.

Source: POF bot transcript (7430b063) · Date: 2026-10-27
UNCERTAIN: No completion evidence seen
```

### ENHC0014 — pof:enh:two-truths-equal-prompts
- Title: Equal prompt counts per category for Two Truths
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T22:09:49 | Updated: 2026-10-27T22:09:49
- Source: bot=POF link=

### ENHC0015 — pof:enh:mode-logos
- Title: New mode logos for Two Truths and Off Topic Defense
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T22:09:49 | Updated: 2026-10-27T22:09:49
- Source: bot=POF link=

### ENHC0016 — pof:enh:shop-rename-collapsible
- Title: Shop renamed with collapsible Access/Themes/Add-ons sections
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T22:09:50 | Updated: 2026-10-27T22:09:50
- Source: bot=POF link=

### ENHC0017 — pof:enh:uk-english-prompts
- Title: UK English rewrite of prompts
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T22:09:51 | Updated: 2026-10-27T22:09:51
- Source: bot=POF link=

### ENHC0018 — pof:enh:two-truths-prompt-editorial
- Title: Two Truths prompt quality editorial pass
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T22:10:06 | Updated: 2026-10-27T22:10:06
- Source: bot=POF link=
- Description:

```
Some niche/clumsy prompts remain.
```

### ENHC0019 — POF-ENH-001
- Title: Choose for me: roulette highlight animation landing on chosen category
- Status: **Done** | done=True | progress=0 | priority=Medium
- Created: 2026-10-31T12:59:14 | Updated: 2026-10-31T13:07:08
- Source: bot=POF link=

### ENHC0020 — POF-ENH-002
- Title: Prompt deep-dive: rework prompts per round (Chain Reaction prompts do not fit mechanic)
- Status: **To do** | done=False | progress=0 | priority=Medium
- Created: 2026-10-31T12:59:16 | Updated: 2026-10-31T12:59:16
- Source: bot=POF link=
- Description:

```
Deferred to next phase per Jubba.
```

### ENHC0021 — POF-ENH-003
- Title: Release-state analysis: extract reusable systems as skills
- Status: **To do** | done=False | progress=0 | priority=Medium
- Created: 2026-10-31T13:03:44 | Updated: 2026-10-31T13:03:44
- Source: bot=POF link=
- Description:

```
Once release-ready, review core systems (lobby, chat/voice, randomisation, content packaging, store/unlocks, build pipeline). Document how each works and the fixes made, and turn reusable parts into shared skills for future games and handover.
```

### ENHC0022 — (no externalRef)
- Title: Mode logo art should fill mode select cards
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-31T15:23:06 | Updated: 2026-10-31T15:23:06
- Source: bot=POF link=
- Description:

```
Device test of 2cc7582 on Samsung S24 Ultra (31 Oct). Sent to cloud agent for fix.
```

### ENHC0023 — POF-ENH-005
- Title: CI: add a job that runs npm test
- Status: **Done** | done=True | progress=0 | priority=Medium
- Created: 2026-11-01T16:40:13 | Updated: 2026-11-03T10:31:40
- Source: bot=POF link=
- Description:

```
CI currently doesn't run npm test (found in docs drift review). Add a test job running server and app tests.

Source: Toolsmith docs drift report 2026-11-01, approved by Jubba. Branch cursor/ionos-web-deploy-6e4c (PR #111).
```

### ENHC0024 — POF-ENH-DISPLAY-CAPS
- Title: Display titles ALL CAPS (partial: h1–h3 + buttons/nav)
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-11-06T19:14:57 | Updated: 2026-11-06T19:14:58
- Source: bot=POF link=
- Description:

```
Game commit eb0ddf0 + docs d6eea15. Uppercase Chewy on store graphics. PARTIAL in-app: h1–h3 and common buttons/nav uppercase; some div-based display titles not yet converted. Tests 49/49 build passed. No deploy. Store review Page updated with latest ALL CAPS PNGs (data URI embeds).
```

## Type: defect (43)

### DFCT0001 — seed:pants-on-fire:pof-def-6
- Title: Inconsistent settings toggles
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R1 (REQ0005) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063) link=https://github.com/jubbaChainsaw/PantsOnFire/pull/105
- Description:

```
t29u; SettingsToggleRow.

Source: POF bot transcript (7430b063) · Date: 2026-10-27
```

### DFCT0002 — seed:pants-on-fire:pof-def-3
- Title: APK 856 MB / 225 MB too large
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R3 (REQ0007) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063) link=https://github.com/jubbaChainsaw/PantsOnFire/pull/105
- Description:

```
Converted to WebP, release build, arm64 only.

Source: POF bot transcript (7430b063) · Date: 2026-10-27
```

### DFCT0003 — seed:pants-on-fire:pof-def-2
- Title: Player setup hidden under buttons
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R4 (REQ0008) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063) link=
- Description:

```
t11u.

Source: POF bot transcript (7430b063) · Date: 2026-10-27
UNCERTAIN: Assumed fixed in port
```

### DFCT0004 — seed:pants-on-fire:pof-def-9
- Title: Game mode screen lost graphics; showed Hot Seat twice; tiny icons; black host frame
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T22:23:05
- Links: requirement=seed:pants-on-fire:pof-R4 (REQ0008) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063) link=https://github.com/jubbaChainsaw/PantsOnFire/pull/105
- Description:

```
t30u; latest build held back at 14:29 UTC.

Source: POF bot transcript (7430b063) · Date: 2026-10-27
```

### DFCT0005 — seed:pants-on-fire:pof-def-8
- Title: Host intro off-screen, gap and repeating background; lines too slow
- Status: **In progress** | done=False | progress=50 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T22:23:04
- Links: requirement=seed:pants-on-fire:pof-R4 (REQ0008) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063) link=https://github.com/jubbaChainsaw/PantsOnFire/pull/105
- Description:

```
t29u, t30u.

Source: POF bot transcript (7430b063) · Date: 2026-10-27
```

### DFCT0006 — seed:pants-on-fire:pof-def-4
- Title: Release APK crashes: "Unable to load script" (no JS bundle)
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R3 (REQ0007) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063); cloud agent prompt link=https://github.com/jubbaChainsaw/PantsOnFire/pull/105
- Description:

```
Debug build had no embedded bundle; switched to assembleRelease.

Source: POF bot transcript (7430b063); cloud agent prompt · Date: 2026-10-27
```

### DFCT0007 — seed:pants-on-fire:pof-def-1
- Title: Cards do not fill container; button wording overflows
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R4 (REQ0008) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063) link=
- Description:

```
t4u.

Source: POF bot transcript (7430b063) · Date: 2026-10-27
UNCERTAIN: Fixed in MagicPath designs; not separately confirmed
```

### DFCT0008 — seed:pants-on-fire:pof-def-7
- Title: Render error when starting a game
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R1 (REQ0005) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063) link=https://github.com/jubbaChainsaw/PantsOnFire/pull/105
- Description:

```
Bug in 30-second timer code; regression test added.

Source: POF bot transcript (7430b063) · Date: 2026-10-27
```

### DFCT0009 — seed:pants-on-fire:pof-def-5
- Title: Blank navy screen on launch
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T16:19:03 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R3 (REQ0007) parentStory=None (None)
- Source: bot=POF bot transcript (7430b063) link=https://github.com/jubbaChainsaw/PantsOnFire/pull/105
- Description:

```
Absolute /assets paths and file:// ES modules; fixed via base ./ and WebViewAssetLoader.

Source: POF bot transcript (7430b063) · Date: 2026-10-27
```

### DFCT0010 — pof:def:body-text-unreadable
- Title: Unreadable body text (switched to Inter)
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T22:09:52 | Updated: 2026-10-27T23:14:54
- Source: bot=POF link=
- Resolution: duplicate

### DFCT0011 — pof:def:prompt-card-back
- Title: Prompt card back not loading
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T22:09:52 | Updated: 2026-10-27T22:09:52
- Source: bot=POF link=

### DFCT0012 — pof:def:category-grid-missing
- Title: Category grid missing
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T22:09:53 | Updated: 2026-10-27T22:09:53
- Source: bot=POF link=

### DFCT0013 — pof:def:text-overflow
- Title: Text overflow in buttons/cards
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T22:09:54 | Updated: 2026-10-27T23:14:55
- Source: bot=POF link=
- Resolution: duplicate

### DFCT0014 — pof:def:wallpaper-repeating
- Title: Wallpaper repeating
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T22:09:54 | Updated: 2026-10-27T22:09:54
- Source: bot=POF link=

### DFCT0015 — pof:def:reveal-intro-host
- Title: Host missing at reveal intro (black frame) + unreadable caption
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T22:10:06 | Updated: 2026-10-27T22:10:06
- Source: bot=POF link=

### DFCT0016 — pof:def:category-screen-clipped
- Title: Category choice screen clipped at bottom (last row of tiles cut off)
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T22:10:11 | Updated: 2026-10-27T22:10:11
- Source: bot=POF link=

### DFCT0017 — pof:def:only-5-categories
- Title: Only 5 categories showing on category choice screen
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T22:17:20 | Updated: 2026-10-27T22:17:20
- Source: bot=POF link=

### DFCT0018 — pof:def:choose-for-me-clip
- Title: 'Choose for me' button clips over top row of category tiles
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T22:17:20 | Updated: 2026-10-27T22:17:20
- Source: bot=POF link=

### DFCT0019 — POF-BUG-001
- Title: Debug APK: Unable to load script (JS bundle not embedded)
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-31T12:59:24 | Updated: 2026-10-31T12:59:24
- Source: bot=POF link=
- Description:

```
Fixed with debuggableVariants=[] and CI bundle check.
```

### DFCT0020 — POF-BUG-002
- Title: CARD_FIRE_FLAME_SOURCES undefined after Grill Em removal
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-31T12:59:24 | Updated: 2026-10-31T12:59:24
- Source: bot=POF link=
- Description:

```
Constants restored (ef18248), lint:undef CI guard added.
```

### DFCT0021 — POF-BUG-003
- Title: Android build: missing fonts and graphics, leftover 18+ logo
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-31T12:59:25 | Updated: 2026-10-31T12:59:25
- Source: bot=POF link=
- Description:

```
Fixed in f5695c8/6ba511e with dist-android asset verify; confirmed on device 31 Oct.
```

### DFCT0022 — POF-UI-001
- Title: Home screen: top icons too close to top edge, unequal edge spacing vs bottom buttons
- Status: **Done** | done=True | progress=0 | priority=Medium
- Created: 2026-10-31T12:59:26 | Updated: 2026-10-31T13:06:51
- Source: bot=POF link=

### DFCT0023 — POF-UI-002
- Title: Achievement toast never dismisses: add X close and auto-hide
- Status: **Done** | done=True | progress=0 | priority=Medium
- Created: 2026-10-31T12:59:26 | Updated: 2026-10-31T13:07:07
- Source: bot=POF link=

### DFCT0024 — POF-UI-003
- Title: Chain Reaction host screen font mismatch; countdown uses old bold font (3 hard to read)
- Status: **Done** | done=True | progress=0 | priority=Medium
- Created: 2026-10-31T12:59:27 | Updated: 2026-10-31T13:07:09
- Source: bot=POF link=

### DFCT0025 — POF-BUG-004
- Title: Host voice lines not playing; captions should sync to audio timing
- Status: **Done** | done=True | progress=0 | priority=Medium
- Created: 2026-10-31T12:59:28 | Updated: 2026-10-31T13:07:09
- Source: bot=POF link=

### DFCT0026 — POF-BUG-005
- Title: Missing host voice stingers for Double Take (pairs) and Two Truths
- Status: **Done** | done=True | progress=0 | priority=Medium
- Created: 2026-10-31T13:07:10 | Updated: 2026-10-31T13:21:39
- Source: bot=POF link=
- Description:

```
No MP3s under public/assets/audio/host/default/tts for pairs/twotruths; intros use timer fallback.
```

### DFCT0027 — POF-UI-004
- Title: Font consistency audit across every game mode and round screen
- Status: **Done** | done=True | progress=0 | priority=Medium
- Created: 2026-10-31T13:09:25 | Updated: 2026-10-31T13:21:39
- Source: bot=POF link=

### DFCT0028 — (no externalRef)
- Title: Safe-area insets: content under S24 Ultra status/nav bars; general big gaps and edge clipping
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-31T15:23:03 | Updated: 2026-10-31T15:23:03
- Source: bot=POF link=
- Description:

```
Device test of 2cc7582 on Samsung S24 Ultra (31 Oct). Sent to cloud agent for fix.
```

### DFCT0029 — (no externalRef)
- Title: Empty strip between host card and intro text
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-31T15:23:04 | Updated: 2026-10-31T15:23:04
- Source: bot=POF link=
- Description:

```
Device test of 2cc7582 on Samsung S24 Ultra (31 Oct). Sent to cloud agent for fix.
```

### DFCT0030 — (no externalRef)
- Title: Clipped pill at top-left on every screen
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-31T15:23:05 | Updated: 2026-10-31T15:23:05
- Source: bot=POF link=
- Description:

```
Device test of 2cc7582 on Samsung S24 Ultra (31 Oct). Sent to cloud agent for fix.
```

### DFCT0031 — (no externalRef)
- Title: Use persona avatars instead of initials/broken image on scoreboard, results and tally
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-31T15:23:07 | Updated: 2026-10-31T15:23:07
- Source: bot=POF link=
- Description:

```
Device test of 2cc7582 on Samsung S24 Ultra (31 Oct). Sent to cloud agent for fix.
```

### DFCT0032 — (no externalRef)
- Title: Vote tally/results panels have large empty space
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-31T15:23:07 | Updated: 2026-10-31T15:23:07
- Source: bot=POF link=
- Description:

```
Device test of 2cc7582 on Samsung S24 Ultra (31 Oct). Sent to cloud agent for fix.
```

### DFCT0033 — (no externalRef)
- Title: Final Accusation reveal off-centre, text overflow, broken avatar, wrong font
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-31T15:23:08 | Updated: 2026-10-31T15:23:08
- Source: bot=POF link=
- Description:

```
Device test of 2cc7582 on Samsung S24 Ultra (31 Oct). Sent to cloud agent for fix.
```

### DFCT0034 — (no externalRef)
- Title: Crash: ReferenceError theme is not defined when tapping Randomize personas (be03dd5)
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-31T16:09:05 | Updated: 2026-10-31T16:09:05
- Source: bot=POF link=
- Description:

```
UI Render Failed on S24 Ultra after be03dd5 persona avatar changes. Sent to cloud agent.
```

### DFCT0035 — POF-BUG-006
- Title: Security: resume rate limiter not attached; public round reads unthrottled
- Status: **Done** | done=True | progress=100 | priority=High
- Created: 2026-11-01T16:40:06 | Updated: 2026-11-01T16:40:06
- Source: bot=POF link=
- Description:

```
Wrong: resumeLimiter was defined but not attached to the POST resume route; public GET round and round/private were unthrottled.
Fix (commit 285f31f): attached resumeLimiter to POST resume; attached lookupLimiter (60/min) to round reads; extracted createRateLimiter to server/rateLimit.js with tests/server/rateLimit.test.mjs. Tests: 38/38 server, 46/46 app.

Source: Toolsmith docs drift report 2026-11-01, approved by Jubba. Branch cursor/ionos-web-deploy-6e4c (PR #111).
```

### DFCT0036 — POF-BUG-007
- Title: Docs: AGENTS.md claimed no tests
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-11-01T16:40:07 | Updated: 2026-11-01T16:40:07
- Source: bot=POF link=
- Description:

```
Docs fix, commit 637fdfe. Wrong: AGENTS.md said the project has no tests. Fix: documented test commands and CI.

Source: Toolsmith docs drift report 2026-11-01, approved by Jubba. Branch cursor/ionos-web-deploy-6e4c (PR #111).
```

### DFCT0037 — POF-BUG-008
- Title: Docs: README drift (env vars, file names, round types, What's Next)
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-11-01T16:40:07 | Updated: 2026-11-01T16:40:07
- Source: bot=POF link=
- Description:

```
Docs fix, commit 637fdfe. Wrong: README used LOBBY_REDIS_NAMESPACE (actual LOBBY_REDIS_KEY_PREFIX), copy.js (actual gameTextContent.js), listed 3 round types (actual 11), What's Next listed shipped items, env vars missing. Fix: corrected names/counts, marked shipped items, added missing env vars.

Source: Toolsmith docs drift report 2026-11-01, approved by Jubba. Branch cursor/ionos-web-deploy-6e4c (PR #111).
```

### DFCT0038 — POF-BUG-009
- Title: Docs: removed Grill 'Em still documented; new modes missing
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-11-01T16:40:08 | Updated: 2026-11-01T16:40:08
- Source: bot=POF link=
- Description:

```
Docs fix, commit 637fdfe. Wrong: Grill 'Em (removed) still in FEATURE_INVENTORY, PROJECT_CONTEXT, PRODUCT_REQUIREMENTS, PLAYTEST_READINESS; Double Take and Two Truths, One Fire missing. Fix: removed Grill 'Em, added both modes.

Source: Toolsmith docs drift report 2026-11-01, approved by Jubba. Branch cursor/ionos-web-deploy-6e4c (PR #111).
```

### DFCT0039 — POF-BUG-010
- Title: Docs: ~25 undocumented server routes; lobby/security docs inaccurate
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-11-01T16:40:09 | Updated: 2026-11-01T16:40:09
- Source: bot=POF link=
- Description:

```
Docs fix, commit 637fdfe. Wrong: ~25 routes not documented; LOBBY_ARCHITECTURE wrong on kick/host-only behaviour; ONLINE_SECURITY_MODEL outdated. Fix: routes inventoried in LOBBY_ARCHITECTURE and railway-deploy; kick/host-only corrected; ONLINE_SECURITY_MODEL updated.

Source: Toolsmith docs drift report 2026-11-01, approved by Jubba. Branch cursor/ionos-web-deploy-6e4c (PR #111).
```

### DFCT0040 — POF-BUG-011
- Title: Docs: CI overstated in BUILD_PIPELINE/TEST_STRATEGY/TECHNICAL_DEBT
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-11-01T16:40:10 | Updated: 2026-11-01T16:40:10
- Source: bot=POF link=
- Description:

```
Docs fix, commit 637fdfe. Wrong: docs claimed CI coverage that doesn't exist. Fix: replaced with actual CI table; noted CI does not run npm test (follow-up POF-ENH-005).

Source: Toolsmith docs drift report 2026-11-01, approved by Jubba. Branch cursor/ionos-web-deploy-6e4c (PR #111).
```

### DFCT0041 — POF-BUG-012
- Title: Docs: minor drift fixes across several docs
- Status: **Done** | done=True | progress=100 | priority=Low
- Created: 2026-11-01T16:40:10 | Updated: 2026-11-01T16:40:10
- Source: bot=POF link=
- Description:

```
Docs fix, commit 637fdfe. Wrong/fixed: ACCOUNT_AND_ENTITLEMENTS claimed an audit log (none); ARCHITECTURE src/App.jsx path; ionos-web-deploy build command; review SUMMARY; src/data/README module list.

Source: Toolsmith docs drift report 2026-11-01, approved by Jubba. Branch cursor/ionos-web-deploy-6e4c (PR #111).
```

### DFCT0042 — POF-BUG-013
- Title: Any player could advance the round phase, not just the host
- Status: **Done** | done=True | progress=100 | priority=High
- Created: 2026-11-01T16:46:52 | Updated: 2026-11-01T16:46:52
- Source: bot=POF link=
- Description:

```
Wrong: any player could advance the round phase.
Fix (commit 00c0342): advanceRoundPhase returns a host-only error / HTTP 403 for non-hosts; client gates advance controls to the host and shows 'Waiting for the host…' to guests; one-word timeouts unaffected; test added; LOBBY_ARCHITECTURE and ONLINE_SECURITY_MODEL updated. Tests: 41/41 server, 49/49 app.

Source: Toolsmith, approved by Jubba. Branch cursor/ionos-web-deploy-6e4c (PR #111).
```

### DFCT0043 — POF-BUG-014
- Title: Re-review of 637fdfe: 8 minor doc slips
- Status: **Done** | done=True | progress=100 | priority=Low
- Created: 2026-11-01T16:46:53 | Updated: 2026-11-01T16:46:53
- Source: bot=POF link=
- Description:

```
Wrong: re-review of docs commit 637fdfe found 8 minor slips.
Fixed in 052ea9c (+00c0342, 4a0b5f8): LOBBY_ARCHITECTURE function names (startLobby/createNextRound); BUILD_PIPELINE APK steps and media-validation trigger; TEST_STRATEGY billing via npm test; src/data/README DLC heading restored; Grill 'Em removed from MOBILE_DEPLOYMENT_READINESS, PLAYTEST_READINESS, BUG_LIST; README manifest.json example link; route-level 429 test added (tests/server/lobbyHttpRateLimit.test.mjs).

Source: Toolsmith, approved by Jubba. Branch cursor/ionos-web-deploy-6e4c (PR #111).
```

## Type: test (3)

### TEST0001 — seed:pants-on-fire:pof-test-1
- Title: Playwright E2E: core game loop
- Status: **In progress** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T19:44:01 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R6 (REQ0010) parentStory=seed:pants-on-fire:pof-req-4 (STRY0009)
- Source: bot=POF transcript link=
- Checklist: 1/2
  - [x] Suite scaffolded
  - [ ] Green on CI
- Description:

```
Home -> setup -> round -> vote -> reveal.

Source: POF transcript · Date: 2026-04-23
```

### TEST0002 — seed:pants-on-fire:pof-test-2
- Title: Release APK install + launch smoke test
- Status: **Done** | done=True | progress=100 | priority=Medium
- Created: 2026-10-27T19:44:01 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R3 (REQ0007) parentStory=seed:pants-on-fire:pof-req-3 (STRY0008)
- Source: bot=POF transcript (def-4/def-5 fixes) link=
- Checklist: 3/3
  - [x] Installs
  - [x] Launches
  - [x] Starts a game
- Description:

```
Install on device, launch, start a game (no blank screen / script error).

Source: POF transcript (def-4/def-5 fixes) · Date: 2026-04-23
```

### TEST0003 — seed:pants-on-fire:pof-test-3
- Title: Voice round device test
- Status: **Backlog** | done=False | progress=0 | priority=Medium
- Created: 2026-10-27T19:44:01 | Updated: 2026-10-27T20:48:29
- Links: requirement=seed:pants-on-fire:pof-R2 (REQ0006) parentStory=seed:pants-on-fire:pof-st-3 (STRY0012)
- Source: bot=needed link=
- Checklist: 0/2
  - [ ] Android
  - [ ] iOS
- Description:

```
Ask a question by voice and hear the answer.

Source: needed · Date: 2026-04-23
```
