#!/usr/bin/env node
/**
 * Generate evidence-batch-02.json for remaining snapshot rows (non-keyword:
 * explicit defaults + per-number overrides). Run: node scripts/audit/generateEvidenceBatch02.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const auditDir = path.join(root, 'docs/audit/2026-11-06-jubba-full-audit');
const snapshotPath = path.join(auditDir, 'jubbaworld-snapshot-2026-11-06.json');
const batch01Path = path.join(auditDir, 'evidence-batch-01.json');
const outPath = path.join(auditDir, 'evidence-batch-02.json');

function baseRow(emptyDesc, extra = {}) {
  return {
    acceptanceBasis: emptyDesc ? 'inferred_from_title' : 'from_snapshot_description',
    acceptanceInferredFlag: emptyDesc,
    evidenceSource: 'repo_read_batch02',
    methodologyNote:
      'Batch 02: generator-authored structured overrides (not keyword heuristics). Count≠depth: this is not independent human/code-review examination. Tracker snapshot.done is organizational only — each row states repo/test vs device gap.',
    implementationRefs: [],
    testRefs: [],
    runtimeNotes: null,
    linksExistingTracker: [],
    ...extra,
  };
}

/** Overrides — file:line anchors where batch examined code/docs. */
const OVERRIDES = {
  DFCT0001: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote:
      'Settings screen uses structured toggle layout (`pof-settings-toggle-col`) and haptics/music switches in App.jsx; no automated UI test for “consistent” across every toggle.',
    implementationRefs: ['src/App.jsx:6720-7150 settings panel toggles and layout'],
    testRefs: ['tests/e2e/playwright/martin-smoke.spec.js — reaches Play flow, not full settings matrix'],
    nextAction: 'Optional Playwright: toggle each settings control and assert state persistence (ENHC0025 / client tests umbrella).',
    linksExistingTracker: ['REQ0005', 'ENHC0025'],
  },
  DFCT0002: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote:
      'APK size work lives in Android build + `scripts/buildMobileBundledWeb.mjs` asset stripping; current dist-android build logged byte reduction in script output — not a Play Console size report.',
    implementationRefs: [
      'scripts/buildMobileBundledWeb.mjs',
      'android/',
    ],
    testRefs: ['tests/e2e/playwright/mobile-bundled-dist-smoke.spec.js — bundled web loads'],
    nextAction: 'Compare AAB/APK sizes in Play Console vs acceptance target (device pipeline).',
    linksExistingTracker: ['REQ0007', 'STRY0008'],
  },
  DFCT0003: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Inventory “assumed fixed in port” — local setup uses `LocalSetupScreen` with `data-testid="start-match"`; no test asserting buttons never cover name fields.',
    implementationRefs: [
      'src/App.jsx:4625-5088 LocalSetupScreen — Create Pass the Phone Game / start-match',
    ],
    testRefs: [
      'tests/e2e/playwright/martin-smoke.spec.js:26-27 — click Play, expect getByTestId("start-match")',
    ],
    nextAction: 'Playwright viewport matrix: assert setup fields visible above docked buttons (REQ0005 / ENHC0025).',
    linksExistingTracker: ['REQ0005', 'REQ0008'],
  },
  DFCT0004: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      '`RoundTypeChoiceGrid` (4033-4095) + screen branch `screen === "round-type-choice"` (10899-10922); duplicate Hot Seat / missing art not asserted in tests — tracker In progress.',
    implementationRefs: [
      'src/App.jsx:4033-4095 RoundTypeChoiceGrid — data-testid="round-type-choice-grid", data-testid={`round-type-${type.id}`}',
      'src/App.jsx:10899-10922 round-type-choice screen + onSelectRoundType',
    ],
    testRefs: [
      'tests/e2e/playwright/mobile-bundled-dist-smoke.spec.js — forEach data-testid round-type-* / icon',
    ],
    nextAction: 'Visual E2E: assert ≥N distinct round-type ids visible; device pass if graphics loss reported (REQ0008).',
    linksExistingTracker: ['REQ0008', 'STRY0007'],
  },
  DFCT0005: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Host intro: `HostIntroScreen` uses `useHostSpeechAutoAdvance` + `HOST_DIALOGUE_TIMINGS.roundIntroAdvanceMs` fallback; “too slow” is subjective — not metered in CI.',
    implementationRefs: [
      'src/App.jsx:2582-2675 HostIntroScreen — speechSteps, useHostSpeechAutoAdvance, data-testid="host-intro-skip"',
      'src/pof-components.css — .pof-host-dialogue (wallpaper via BrandedScreen/TopFrame)',
    ],
    testRefs: ['tests/e2e/playwright/martin-smoke.spec.js — may skip intro via host-intro-skip when present'],
    nextAction: 'Device: measure tap-to-next vs auto-advance; tune HOST_DIALOGUE_TIMINGS if needed.',
    linksExistingTracker: ['REQ0008'],
  },
  DFCT0006: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote:
      'Bundled web + `scripts/verifyAndroidEmbeddedBundle.mjs` exist; “Unable to load script” class of issues addressed via bundle staging — release APK not rebuilt in this audit.',
    implementationRefs: [
      'scripts/buildMobileBundledWeb.mjs',
      'scripts/stageAndroidBundledWeb.mjs',
      'scripts/verifyAndroidEmbeddedBundle.mjs',
    ],
    testRefs: ['tests/e2e/playwright/mobile-bundled-dist-smoke.spec.js'],
    nextAction: 'Fresh assembleRelease + install smoke (TEST0002 linkage).',
    linksExistingTracker: ['REQ0007', 'TEST0002'],
  },
  DFCT0007: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Round/category tiles use flex + `ThemeArt` object-contain; inventory “uncertain” — mobile smoke checks broken images, not overflow per breakpoint.',
    implementationRefs: [
      'src/App.jsx:4067-4091 RoundTypeChoiceGrid button + ThemeArt scale-[1.03]',
      'src/App.jsx:4147-4165 CategoryChoiceGrid category tile + ThemeArt max-h clamps',
    ],
    testRefs: ['tests/e2e/playwright/mobile-bundled-dist-smoke.spec.js — expect(page.locator("img")).not broken naturalWidth'],
    nextAction: 'Playwright overflow assert on small viewports or manual sweep (REQ0008 / ENHC0025).',
    linksExistingTracker: ['REQ0008'],
  },
  DFCT0008: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Inventory cites timer regression (historical) — not re-isolated here. Client path: martin-smoke Play → start-match; online timer paths in `useTimedChoice` + `NeonTimerBar` (CategoryChoiceGrid).',
    implementationRefs: [
      'src/App.jsx:4108-4121 CategoryChoiceGrid — useTimedChoice + NeonTimerBar',
      'src/App.jsx:4042-4057 RoundTypeChoiceGrid — useTimedChoice when onlineMode',
    ],
    testRefs: [
      'tests/e2e/playwright/martin-smoke.spec.js:26-27',
      'tests/server/lobbyStore.test.mjs — lobby lifecycle (not same bug class)',
    ],
    nextAction: 'If recurrence: git bisect + minimal Playwright repro for offending timer.',
    linksExistingTracker: ['REQ0005', 'ENHC0025'],
  },
  DFCT0009: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote:
      'Public asset URLs + bundled web path handling (`src/lib/publicAssetUrl.js`); blank screen often WebView base URL — mobile smoke loads home.',
    implementationRefs: ['src/lib/publicAssetUrl.js', 'src/main.jsx'],
    testRefs: ['tests/e2e/playwright/mobile-bundled-dist-smoke.spec.js'],
    nextAction: 'Physical device file:// and play asset loader regression (REQ0007).',
    linksExistingTracker: ['REQ0007'],
  },
  DFCT0010: {
    ...baseRow(true),
    evidenceClassification: 'code_proven_partial',
    confidence: 'high',
    methodologyNote: 'Body/UI copy uses Inter per `.pof-desc` and settings copy in `src/pof-components.css`.',
    implementationRefs: ['src/pof-components.css:113-114 .pof-desc Inter'],
    testRefs: [],
    nextAction: 'None unless new body-text regression reported.',
    linksExistingTracker: [],
  },
  DFCT0011: {
    ...baseRow(true),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Card backs: `resolveCategoryChoiceCardArt` → `getRoundCardBackSrc`; tiles use `ThemeArt` — mobile smoke checks images load.',
    implementationRefs: [
      'src/App.jsx:2577-2581 resolveCategoryChoiceCardArt',
      'src/App.jsx:4159-4164 CategoryChoiceGrid ThemeArt for category icon',
    ],
    testRefs: ['tests/e2e/playwright/mobile-bundled-dist-smoke.spec.js — img naturalWidth assertions'],
    nextAction: 'Per-theme spot-check in dist-android APK (device).',
    linksExistingTracker: ['REQ0008'],
  },
  DFCT0012: {
    ...baseRow(true),
    evidenceClassification: 'code_proven_partial',
    confidence: 'high',
    methodologyNote: '`CategoryChoiceGrid` + `data-testid="category-choice-grid"` implements category grid.',
    implementationRefs: ['src/App.jsx:4097-4165 CategoryChoiceGrid'],
    testRefs: ['tests/e2e/playwright/martin-smoke.spec.js — reaches rules and round flow'],
    nextAction: 'Online mode category timer assert if needed (REQ0009).',
    linksExistingTracker: ['ENHC0011', 'REQ0005'],
  },
  DFCT0013: {
    ...baseRow(true),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Vote chips and buttons use overflow-wrap in CSS (`pof-vote-chip`); full matrix not enumerated.',
    implementationRefs: ['src/pof-components.css:68-69 pof-vote-chip'],
    testRefs: [],
    nextAction: 'Long-label regression tests (ENHC0025).',
    linksExistingTracker: ['ENHC0025'],
  },
  DFCT0014: {
    ...baseRow(true),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Wallpapers: `BrandedScreen` uses `backgroundImage` from props; neon UI refs in `src/data/uiNeonAssets.js`. Repeating-tile class of bug needs device screenshot.',
    implementationRefs: [
      'src/App.jsx:4018-4023 BrandedScreen wallpaper div backgroundRepeat no-repeat',
      'src/data/uiNeonAssets.js — UI_WALLPAPER_* exports',
    ],
    testRefs: [],
    nextAction: 'Device visual QA per theme (repeating artifact).',
    linksExistingTracker: ['REQ0008'],
  },
  DFCT0015: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Reveal host visual: `RevealPromptScreen` / host layers — black frame not reproduced in headless; needs device.',
    implementationRefs: [
      'src/App.jsx:2582-2700 HostIntroScreen — ThemeHostVisual + caption panel data-testid="host-intro-caption"',
    ],
    testRefs: [],
    nextAction: 'Device repro + screen recording (DFCT0028 cluster).',
    linksExistingTracker: ['REQ0005'],
  },
  DFCT0016: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote:
      'Category scroll container + safe-area bottom padding (`CategoryChoiceGrid` style + `category-choice-scroll`).',
    implementationRefs: ['src/App.jsx:4124-4130 category-choice-scroll paddingBottom safe-area'],
    testRefs: [],
    nextAction: 'Verify last row visible on small phones + landscape (device).',
    linksExistingTracker: ['ENHC0011'],
  },
  DFCT0017: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      '`data-category-count` reflects `categoryOptions.length`; six-category enhancement tracked separately (ENHC0011).',
    implementationRefs: ['src/App.jsx:4133-4136 data-category-count'],
    testRefs: [],
    nextAction: 'Assert six categories seeded for mode under test (REQ0005).',
    linksExistingTracker: ['ENHC0011'],
  },
  DFCT0018: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Choose-for-me bar is fixed header `data-testid="category-choice-random-bar"` above scroll — clip risk on short viewports.',
    implementationRefs: [
      'src/App.jsx:10961-10977 category-choice-random-bar + data-testid="choose-category-random"',
      'src/App.jsx:10978-10986 CategoryChoiceGrid wrapper',
    ],
    testRefs: [],
    nextAction: 'Playwright small viewport: assert bar + first category row both visible (ENHC0019).',
    linksExistingTracker: ['ENHC0019'],
  },
  DFCT0019: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote: 'Debug embed path: same bundle pipeline as DFCT0006; CI mentions in inventory.',
    implementationRefs: ['scripts/buildMobileBundledWeb.mjs', '.github/workflows/android-debug-apk.yml'],
    testRefs: ['tests/e2e/playwright/mobile-bundled-dist-smoke.spec.js'],
    nextAction: 'CI artifact install smoke (TEST0002).',
    linksExistingTracker: ['TEST0002', 'STRY0003'],
  },
  DFCT0020: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'high',
    methodologyNote: '`CARD_FIRE_FLAME_SOURCES` defined and used in App.jsx (Grill removal fix).',
    implementationRefs: ['src/App.jsx:319 CARD_FIRE_FLAME_SOURCES', 'src/App.jsx:2370 resolveBundledAssetSrc'],
    testRefs: [],
    nextAction: 'None unless flame assets change.',
    linksExistingTracker: [],
  },
  DFCT0021: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote: 'Fonts loaded in mobile smoke (`PoF Display`, `Vintage Cowboy`); 18+ toggle removed per ENHC0009 — grep settings.',
    implementationRefs: ['tests/e2e/playwright/mobile-bundled-dist-smoke.spec.js:assertGameFontsLoaded'],
    testRefs: ['tests/e2e/playwright/mobile-bundled-dist-smoke.spec.js'],
    nextAction: 'Physical APK visual QA for leftover 18+ branding.',
    linksExistingTracker: ['ENHC0009', 'REQ0007'],
  },
  DFCT0022: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Home uses `--pof-safe-top/bottom` padding on shell (`NeonHomeScreen`); exact balance vs bottom CTAs is device-dependent.',
    implementationRefs: [
      'src/components/neon/NeonHomeScreen.jsx:145-146 paddingTop/Bottom max(... var(--pof-safe-*) ...)',
      'src/pof-components.css:3-6 --pof-safe-* tokens',
    ],
    testRefs: [],
    nextAction: 'Device screenshot matrix vs design tokens (DFCT0028 cluster).',
    linksExistingTracker: ['DFCT0028'],
  },
  DFCT0023: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'high',
    methodologyNote:
      'Achievement toast has dismiss `X` and `data-testid="achievement-unlock-toast"` (addresses never-dismiss report).',
    implementationRefs: ['src/App.jsx:11614-11637 achievement unlock toast + dismiss button'],
    testRefs: [],
    nextAction: 'Playwright: trigger toast via `pof-e2e-achievement-toast` event if auto-hide timing needed.',
    linksExistingTracker: ['ENHC0025'],
  },
  DFCT0024: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Chain rounds branch in `getRoundScreenCopy` / reveal copy; countdown typography not isolated — compare NeonTimerBar vs host intro caption styling.',
    implementationRefs: [
      'src/App.jsx:1121-1128 getRoundScreenCopy chain branch',
      'src/App.jsx:4054-4056 NeonTimerBar in RoundTypeChoiceGrid',
      'src/pof-components.css:84-108 heading/body font rules',
    ],
    testRefs: [],
    nextAction: 'Device visual: Chain host vs selection timer numerals (STRY0010).',
    linksExistingTracker: ['STRY0010'],
  },
  DFCT0025: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Host audio files under `public/assets/audio/host/` + host line maps; sync to captions not asserted in tests.',
    implementationRefs: ['src/data/hostVoiceLineMap.js', 'public/assets/audio/host/'],
    testRefs: [],
    runtimeNotes: 'No automated assertion for audio/caption sync.',
    nextAction: 'Manual ear + waveform check or add ava media test stub (deferred).',
    linksExistingTracker: ['STRY0019'],
  },
  DFCT0026: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Inventory: missing MP3s for pairs/twotruths; data-driven host lines — verify file glob vs map.',
    implementationRefs: ['src/data/hostVoiceLineMap.js'],
    testRefs: [],
    nextAction: 'Add asset presence test or fill stingers (STRY0019).',
    linksExistingTracker: ['STRY0019', 'TEST0004'],
  },
  DFCT0027: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Tracker Done; font system documented in `pof-components.css` — full per-mode audit not automated (ENHC0024 partial).',
    implementationRefs: ['src/pof-components.css:84-114', 'ENHC0024 tracker'],
    testRefs: [],
    nextAction: 'Complete div-title CAPS (ENHC0024) + visual matrix.',
    linksExistingTracker: ['ENHC0024', 'CONV-REQ-ALL-CAPS'],
  },
  DFCT0028: {
    ...baseRow(false),
    evidenceClassification: 'blocked_device_external',
    confidence: 'high',
    methodologyNote:
      'Samsung S24 Ultra report in tracker — not reproduced in Linux CI; safe-area vars exist but device proof missing.',
    implementationRefs: [
      'src/pof-components.css:3-6 --pof-safe-*',
      'src/lib/safeAreaInsets.js',
    ],
    testRefs: [],
    runtimeNotes: 'No S24 in audit environment.',
    nextAction: 'Re-test on physical S24 after CSS pass; link DFCT0029-0034 cluster.',
    linksExistingTracker: ['DFCT0029', 'DFCT0030', 'DFCT0031', 'DFCT0032', 'DFCT0033', 'DFCT0034'],
  },
  DFCT0029: {
    ...baseRow(false),
    evidenceClassification: 'blocked_device_external',
    confidence: 'medium',
    methodologyNote:
      'Layout gap between host card and intro text — device-only verification; code path: `HostIntroScreen` + `TopFrame`.',
    implementationRefs: [
      'src/App.jsx:2582-2674 HostIntroScreen layout',
      'src/App.jsx:10993-11008 host-intro screen branch + onContinue',
    ],
    testRefs: [],
    nextAction: 'Device capture + CSS fix; grouped with DFCT0028.',
    linksExistingTracker: ['DFCT0028'],
  },
  DFCT0030: {
    ...baseRow(false),
    evidenceClassification: 'blocked_device_external',
    confidence: 'medium',
    methodologyNote:
      'Category header uses `pl-14 sm:pl-0` for round-owner pill — may clip on some notches; needs device.',
    implementationRefs: [
      'src/App.jsx:10932-10943 category-choice-header — pl-14 sm:pl-0',
    ],
    testRefs: [],
    nextAction: 'Device: confirm pill + h2 alignment; adjust safe-area padding (DFCT0028).',
    linksExistingTracker: ['DFCT0028'],
  },
  DFCT0031: {
    ...baseRow(false),
    evidenceClassification: 'blocked_device_external',
    confidence: 'medium',
    methodologyNote:
      '`PlayerPersonaAvatar` on results/scoreboard — broken image falls back to initials.',
    implementationRefs: [
      'src/App.jsx:6383-6389 ResultsScreen summary row — PlayerPersonaAvatar',
      'src/App.jsx:6433-6441 Vote Tally row — PlayerPersonaAvatar',
      'src/App.jsx:6471-6477 Scoreboard — PlayerPersonaAvatar',
    ],
    testRefs: [],
    nextAction: 'Device QA: broken personaImageSrc vs intended art (STRY0026).',
    linksExistingTracker: ['DFCT0028', 'STRY0026'],
  },
  DFCT0032: {
    ...baseRow(false),
    evidenceClassification: 'blocked_device_external',
    confidence: 'medium',
    methodologyNote:
      'Vote tally UI in `ResultsScreen` details stage — whitespace subjective on device.',
    implementationRefs: [
      'src/App.jsx:6419-6453 Vote Tally GlassPanel + sortedVoteRows map',
    ],
    testRefs: [],
    nextAction: 'Device UI polish (DFCT0028 batch).',
    linksExistingTracker: ['DFCT0028'],
  },
  DFCT0033: {
    ...baseRow(false),
    evidenceClassification: 'blocked_device_external',
    confidence: 'medium',
    methodologyNote:
      '`FinalAccusationReveal` (inline in App.jsx) — host + announcement bubble + liar badges.',
    implementationRefs: [
      'src/App.jsx:6187-6281 Final accusation block — ThemeHostVisual, announcement bubble, PlayerPersonaAvatar for liars',
    ],
    testRefs: [],
    nextAction: 'Device regression: centering/overflow on S24 (DFCT0028).',
    linksExistingTracker: ['DFCT0028'],
  },
  DFCT0034: {
    ...baseRow(false),
    evidenceClassification: 'blocked_device_external',
    confidence: 'high',
    methodologyNote:
      'Randomize all personas: `randomizeAllPlayersForTheme` calls `buildRandomizedPlayerIdentity` — historical ReferenceError on device build be03dd5 not reproduced here.',
    implementationRefs: [
      'src/App.jsx:4689-4702 randomizeAllPlayersForTheme',
      'src/App.jsx:4815-4822 Button Randomize all personas for this theme',
      'src/App.jsx:631-660 buildRandomizedPlayerIdentity',
    ],
    testRefs: [],
    nextAction: 'Repro on reported build/device + add regression test (ENHC0025).',
    linksExistingTracker: ['DFCT0028', 'ENHC0025'],
  },
  DFCT0037: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote:
      'README updated in historical commits; spot-check: round types list in README vs App — not re-diffed line-for-line in batch 02.',
    implementationRefs: ['README.md', 'docs/FEATURE_INVENTORY.md'],
    testRefs: [],
    nextAction: 'Automated doc drift check vs `ROUND_TYPE` list (optional).',
    linksExistingTracker: ['DFCT0038', 'DFCT0039'],
  },
  DFCT0038: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote: '`FEATURE_INVENTORY.md` lists modes; Grill removal — grep confirms no CARD_FIRE_FLAME undefined.',
    implementationRefs: ['docs/FEATURE_INVENTORY.md', 'README.md'],
    testRefs: [],
    nextAction: 'Periodic doc review with release.',
    linksExistingTracker: ['DFCT0037'],
  },
  DFCT0039: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'high',
    methodologyNote: '`LOBBY_ARCHITECTURE.md` inventories routes; server mounts match high-level list.',
    implementationRefs: ['docs/LOBBY_ARCHITECTURE.md', 'server/lobbyServer.js'],
    testRefs: ['tests/server/lobbyHttpRateLimit.test.mjs'],
    nextAction: 'Diff doc vs `app.get/post` list when routes added.',
    linksExistingTracker: ['STRY0002'],
  },
  DFCT0041: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      '“Minor slips” not enumerated — sibling doc defects have file anchors (DFCT0037-39); this row stays open-ended.',
    implementationRefs: [
      'README.md — round list / env (spot-check only)',
      'docs/FEATURE_INVENTORY.md — mode inventory',
      'docs/LOBBY_ARCHITECTURE.md — route list',
    ],
    testRefs: [],
    nextAction: 'Toolsmith pass: diff README FEATURE_INVENTORY LOBBY_ARCHITECTURE vs server route table.',
    linksExistingTracker: ['DFCT0039'],
  },
  ENHC0001: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote: 'PoF Display / Chewy assets in CSS and `public/assets/fonts` — Narrow variant coverage partial.',
    implementationRefs: ['src/pof-components.css', 'public/assets/fonts/'],
    testRefs: ['tests/e2e/playwright/mobile-bundled-dist-smoke.spec.js — font load'],
    nextAction: 'Typography spec for Narrow (ENHC0010).',
    linksExistingTracker: ['ENHC0010'],
  },
  ENHC0002: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote: 'App name in `app.json`; icon in android adaptive / assets.',
    implementationRefs: ['app.json:1-36', 'docs/store/graphics/icon-512.png'],
    testRefs: [],
    nextAction: 'Play Console icon upload verification (org).',
    linksExistingTracker: ['WTSK0005'],
  },
  ENHC0003: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Persona screen branch `screen === "persona"` (8629-8631, 10765+); profile menu navigates via `onSelectProfileMenu("persona")`.',
    implementationRefs: [
      'src/App.jsx:8629-8631 setScreen("persona")',
      'src/App.jsx:3232 onSelectProfileMenu → persona',
    ],
    testRefs: ['tests/e2e/playwright/martin-smoke.spec.js — Leaderboard/profile tab'],
    nextAction: 'E2E persona rename + uniqueness (ENHC0025).',
    linksExistingTracker: ['REQ0005'],
  },
  ENHC0004: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'high',
    methodologyNote: 'Lobby code uses countdown digit styling (audit fixed E2E selector `.pof-countdown-digit`).',
    implementationRefs: [
      'src/App.jsx:4444 .pof-countdown-digit — lobby / match context',
      'src/App.jsx:5406 .pof-countdown-digit — themed prompt card overlay countdown',
      'tests/e2e/playwright/web-player-website.spec.js — lobby code visibility',
    ],
    testRefs: ['tests/e2e/playwright/web-player-website.spec.js'],
    nextAction: 'None unless typography changes.',
    linksExistingTracker: [],
  },
  ENHC0005: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'high',
    methodologyNote: 'Headings PoF Display; body Inter via `.pof-desc` (see CSS).',
    implementationRefs: ['src/pof-components.css'],
    testRefs: [],
    nextAction: 'Regression if new components skip `.pof-desc`.',
    linksExistingTracker: [],
  },
  ENHC0006: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      '`AdminDialog` — custom category CRUD; gated by `premiumEnabled || categoryEditorUnlocked` (props from entitlements).',
    implementationRefs: [
      'src/App.jsx:7232-7323 AdminDialog — category list + add flow',
      'src/App.jsx:11603-11612 AdminDialog open + categoryEditorUnlocked',
    ],
    testRefs: [],
    nextAction: 'Entitlement matrix test (tests/server/entitlements + UI E2E).',
    linksExistingTracker: ['ENHC0013'],
  },
  ENHC0007: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Settings persist music/sfx/haptics via `audioSettings` state + `useEffect` syncing to sound engine (lines ~8301+); theme tune relative levels not metered in CI.',
    implementationRefs: [
      'src/App.jsx:6770-7050 SettingsScreen — SettingsToggleRow / Slider rows',
      'src/App.jsx:7575-7580 initial audioSettings from storage',
      'src/App.jsx:8301-8306 map audioSettings to sound engine payload',
    ],
    testRefs: [],
    runtimeNotes: 'No automated audio level assertion.',
    nextAction: 'Manual listen: menu vs gameplay mix (REQ0005).',
    linksExistingTracker: ['REQ0005'],
  },
  ENHC0008: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'high',
    methodologyNote:
      '`useTimedChoice` + `NeonTimerBar` in `CategoryChoiceGrid` for online (`ONLINE_SELECTION_TIMER_SEC`).',
    implementationRefs: [
      'src/App.jsx:4108-4121 useTimedChoice + NeonTimerBar',
    ],
    testRefs: ['tests/server/lobbyStore.test.mjs — online flow partial'],
    nextAction: 'Playwright two-browser online category pick.',
    linksExistingTracker: ['REQ0009'],
  },
  ENHC0009: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote: 'Settings toggles sound/music/haptics; 18+ removed from product.',
    implementationRefs: ['src/App.jsx:7041-7043 haptics toggle'],
    testRefs: [],
    nextAction: 'Confirm no 18+ remnant in store listing (WTSK0005).',
    linksExistingTracker: ['WTSK0005'],
  },
  ENHC0010: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote: 'Narrow font pipeline — partial vs ENHC0001; check font-face declarations.',
    implementationRefs: ['src/pof-components.css', 'public/assets/fonts/'],
    testRefs: [],
    nextAction: 'Visual audit Narrow on buttons (ENHC0001).',
    linksExistingTracker: ['ENHC0001'],
  },
  ENHC0011: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'high',
    methodologyNote:
      'Six categories + Choose for me: `CategoryChoiceGrid` + random pick hooks in App.',
    implementationRefs: ['src/App.jsx:4097-4170', 'src/App.jsx ~10975 choose for me'],
    testRefs: ['tests/e2e/playwright/martin-smoke.spec.js'],
    nextAction: 'Close DFCT0016-18 if QA clean.',
    linksExistingTracker: ['DFCT0016', 'DFCT0017', 'DFCT0018'],
  },
  ENHC0012: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Client round choice: `pickCompatibleRoundTypeId` + `getCompatibleRoundTypes` (1065-1087); server online authority still prompt-only (`buildAuthoritativeRound`).',
    implementationRefs: [
      'src/App.jsx:1065-1087 getCompatibleRoundTypes / pickCompatibleRoundTypeId',
      'server/storage/lobbyStore.js:353-378 buildAuthoritativeRound roundTypeId prompt',
    ],
    testRefs: [],
    nextAction: 'Align server when non-prompt rounds online (REQ0017, REQ0009).',
    linksExistingTracker: ['REQ0017', 'REQ0009'],
  },
  ENHC0013: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote: 'Neon store screens + Stripe routes (`server/stripeBillingRoutes.js`); sandbox tests exist.',
    implementationRefs: [
      'src/components/neon/NeonStoreScreen.jsx',
      'server/stripeBillingRoutes.js',
    ],
    testRefs: [
      'tests/server/stripeCatalog.test.mjs',
      'tests/server/entitlements.test.mjs',
    ],
    runtimeNotes: 'Live Play billing not exercised.',
    nextAction: 'RevenueCat + Play purchase QA on device (WTSK0006 checklist).',
    linksExistingTracker: ['WTSK0006', 'STRY0013'],
  },
  ENHC0014: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote: 'Two Truths data files under `src/data/twoTruthsOneFire` — count parity not asserted in CI.',
    implementationRefs: ['src/data/twoTruthsOneFire/'],
    testRefs: [],
    nextAction: 'Script: equal count per category lint.',
    linksExistingTracker: ['STRY0013'],
  },
  ENHC0015: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote: 'Mode logos in UI assets; ENHC0022 “fill card” still in progress.',
    implementationRefs: ['src/data/uiNeonAssets.js'],
    testRefs: ['tests/e2e/playwright/mobile-bundled-dist-smoke.spec.js — round-type icons'],
    nextAction: 'Visual fill-factor check (ENHC0022).',
    linksExistingTracker: ['ENHC0022'],
  },
  ENHC0016: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote: 'NeonStoreScreen collapsible sections — component-level.',
    implementationRefs: ['src/components/neon/NeonStoreScreen.jsx'],
    testRefs: [],
    nextAction: 'Playwright store navigation.',
    linksExistingTracker: ['ENHC0013'],
  },
  ENHC0017: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'UK editorial in prompt packs — sample strings are UK-flavoured; full pack not linguistically linted.',
    implementationRefs: [
      'src/data/packs/categoryPromptPacks.js — e.g. Travel / category strings (search UK spellings ad hoc)',
    ],
    testRefs: [],
    nextAction: 'Editorial checklist with style guide.',
    linksExistingTracker: ['ENHC0018'],
  },
  ENHC0018: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Two Truths content: `src/data/twoTruthsOneFire/**` — quality subjective; no automated quality gate.',
    implementationRefs: ['src/data/twoTruthsOneFire/categoryTopicNouns.js', 'src/data/twoTruthsOneFire/**'],
    testRefs: [],
    nextAction: 'Content review pass (STRY0013).',
    linksExistingTracker: ['STRY0013'],
  },
  ENHC0019: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote: 'Roulette highlight ids in CategoryChoiceGrid (`pof-choice-flash`).',
    implementationRefs: ['src/App.jsx:4142-4156 highlighted class'],
    testRefs: [],
    nextAction: 'E2E assert highlight lands on chosen id.',
    linksExistingTracker: ['TEST0001'],
  },
  ENHC0020: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Chain reaction prompts: pack data in `categoryPromptPacks.js` — fit vs mechanic is editorial.',
    implementationRefs: [
      'src/data/packs/categoryPromptPacks.js — search chain / reaction prompt ids',
    ],
    testRefs: [],
    nextAction: 'Content ticket per round family.',
    linksExistingTracker: ['REQ0005'],
  },
  ENHC0021: {
    ...baseRow(false),
    evidenceClassification: 'deferred',
    confidence: 'medium',
    methodologyNote: '“Extract as skills” is process/backlog — no code change in scope.',
    implementationRefs: [
      'docs/superpowers/plans/2026-11-06-jubba-full-audit.md — planning artifact only',
    ],
    testRefs: [],
    nextAction: 'Defer to post-release tooling (WTSK0001 logging related).',
    linksExistingTracker: ['WTSK0001'],
  },
  ENHC0022: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Round type cards: `RoundTypeChoiceGrid` uses `ThemeArt` `object-cover object-center scale-[1.03]` — fill vs letterbox device-dependent.',
    implementationRefs: [
      'src/App.jsx:4033-4095 RoundTypeChoiceGrid — min-h-0 flex-1 cards',
    ],
    testRefs: [],
    nextAction: 'Device QA with ENHC0015 assets (DFCT0028).',
    linksExistingTracker: ['ENHC0015', 'DFCT0028'],
  },
  REQ0005: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote:
      'Core loop: screen union LOCAL_GAME_PAUSE_SCREENS + ONLINE_* sets (349-423) drive phase gating; `syncOnlineRoundFromSnapshot` maps server phases to screens (9210-9293). E2E smokes cover subset.',
    implementationRefs: [
      'src/App.jsx:349-423 ONLINE_VOICE_ACTIVE_SCREENS / LOCAL_GAME_PAUSE_SCREENS',
      'src/App.jsx:9210-9293 syncOnlineRoundFromSnapshot phase→screen',
    ],
    testRefs: [
      'tests/e2e/playwright/martin-smoke.spec.js',
      'tests/e2e/playwright/mobile-bundled-dist-smoke.spec.js',
    ],
    nextAction: 'Expand Playwright per STRY0010 round families (TEST0001, TEST0004).',
    linksExistingTracker: ['STRY0010', 'STRY0011', 'TEST0001'],
  },
  REQ0006: {
    ...baseRow(false),
    evidenceClassification: 'missing',
    confidence: 'high',
    methodologyNote:
      "Historical Grill 'Em voice mode — `grill` round type absent in `ROUND_TYPES` / src grep; product voice is LiveKit party (`server/lobbyServer.js` `/api/lobbies/:code/voice/token`, `src/online/voicePartyTransport.js`).",
    implementationRefs: [
      'src/data/packs/categoryPromptPacks.js — MemesViralPromptRoundData only (word grill as content, not mode)',
      'server/lobbyServer.js:403-456 POST /api/lobbies/:code/voice/token',
      'src/online/voicePartyTransport.js — Room.connect',
    ],
    testRefs: [],
    nextAction: 'Tracker: close or rewrite REQ0006 to LiveKit voice scope.',
    linksExistingTracker: ['STRY0012', 'TEST0003'],
  },
  REQ0007: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote: 'Expo `app.json`, android package, WebView shell — APK workflows in `.github/workflows/`.',
    implementationRefs: ['app.json', '.github/workflows/android-debug-apk.yml', '.github/workflows/android-release-aab.yml'],
    testRefs: ['tests/e2e/playwright/mobile-bundled-dist-smoke.spec.js'],
    nextAction: 'EAS/Play pipeline checklist (REQ0012-REQ0016 org tasks).',
    linksExistingTracker: ['STRY0008', 'REQ0012', 'REQ0013'],
  },
  REQ0008: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote: 'Neon components under `src/components/neon/` + `pof-components.css`.',
    implementationRefs: ['src/components/neon/', 'src/pof-components.css'],
    testRefs: ['tests/e2e/playwright/mobile-bundled-dist-smoke.spec.js'],
    nextAction: 'Close DFCT0004/0005 when visual sign-off.',
    linksExistingTracker: ['STRY0006', 'STRY0007'],
  },
  REQ0010: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote: 'Node tests + Playwright + mobile smoke; `docs/TEST_STRATEGY.md` still partially stale on CI note.',
    implementationRefs: ['docs/TEST_STRATEGY.md', '.github/workflows/npm-test.yml'],
    testRefs: ['tests/**/*.test.mjs'],
    nextAction: 'Sync TEST_STRATEGY CI paragraph with npm-test.yml; ENHC0025 client tests.',
    linksExistingTracker: ['ENHC0023', 'ENHC0025', 'TEST0001'],
  },
  REQ0011: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote: 'IONOS deploy workflow, lobby server, Redis optional — see docs and `server/`.',
    implementationRefs: [
      '.github/workflows/deploy-ionos-web.yml',
      'server/lobbyServer.js',
    ],
    testRefs: ['tests/server/lobbyStore.test.mjs'],
    nextAction: 'Prod deploy verification outside audit.',
    linksExistingTracker: ['STRY0002', 'STRY0004', 'STRY0005'],
  },
  REQ0012: {
    ...baseRow(false),
    evidenceClassification: 'account_status_unknown',
    confidence: 'high',
    methodologyNote:
      'Repo expectation: release AAB workflow **requires** GitHub secrets ANDROID_KEYSTORE_* (`.github/workflows/android-release-aab.yml:84-98`). User context: Play internal draft + signing may already exist — **audit does not verify** org secrets or Play state.',
    implementationRefs: [
      '.github/workflows/android-release-aab.yml:84-98 Require Play upload signing secrets',
    ],
    testRefs: [],
    nextAction: 'Parent: mark REQ0012 satisfied in tracker if secrets + signing match production, or paste pointer to where secrets live (not in repo).',
    linksExistingTracker: ['STRY0017'],
  },
  REQ0013: {
    ...baseRow(false),
    evidenceClassification: 'account_status_unknown',
    confidence: 'high',
    methodologyNote:
      'Play Console app **existence** is not derivable from repo; user context reports internal draft **1.0.3 (v20)** — reconcile in tracker.',
    implementationRefs: ['app.json:22-24 android.package — intended application id'],
    testRefs: [],
    nextAction: 'Parent: confirm REQ0013 against Play Console (org-only); close or update externalRef.',
    linksExistingTracker: ['REQ0007'],
  },
  REQ0014: {
    ...baseRow(false),
    evidenceClassification: 'stale_tracker_mismatch',
    confidence: 'high',
    methodologyNote:
      '**Stale title in tracker:** Expo `android.package` is `app.pantsonfire.findtheliar` (`app.json:23`). Snapshot REQ0014 title says `app.pantsonfire.liar` — **do not rename package in audit**; human resolves tracker vs shipped id.',
    implementationRefs: ['app.json:22-24 android.package'],
    testRefs: [],
    nextAction: 'Parent: update REQ0014 title or close with rationale (no repo rename from audit).',
    linksExistingTracker: [],
  },
  REQ0015: {
    ...baseRow(false),
    evidenceClassification: 'account_status_unknown',
    confidence: 'high',
    methodologyNote:
      'Repo hosts static privacy page `public/privacy/index.html` + join-site links (`src/components/SiteLegalLinks.jsx`). Play Console “Data safety” URL **not verified** here — user context may already have published URL.',
    implementationRefs: [
      'public/privacy/index.html',
      'src/components/SiteLegalLinks.jsx:11-12 href `${base}/privacy`',
      'docs/store/play-listing.md:35 — references in-app links',
    ],
    testRefs: [],
    nextAction: 'Parent: confirm live URL in Console matches deployed site; close REQ0015 if done.',
    linksExistingTracker: ['WTSK0005'],
  },
  REQ0016: {
    ...baseRow(false),
    evidenceClassification: 'deferred',
    confidence: 'high',
    methodologyNote:
      'No `eas.json` in repo; Android CI uses `npx expo prebuild` + Gradle (`.github/workflows/android-release-aab.yml:72-79`). EAS project id may be **inapplicable** if releases are Gradle/GitHub-Actions only — **not verified**.',
    implementationRefs: [
      'glob: eas.json — absent in repo (audit)',
      '.github/workflows/android-release-aab.yml:72-79 Expo prebuild + bundle',
    ],
    testRefs: [],
    nextAction: 'Parent: close REQ0016 as N/A or document EAS only if OTA used.',
    linksExistingTracker: ['REQ0007'],
  },
  REQ0018: {
    ...baseRow(false),
    evidenceClassification: 'deferred',
    confidence: 'high',
    methodologyNote:
      'Dedicated “Meme Decoder” mode not found in `ROUND_TYPES`; meme **category** data exists (`MemesViralPromptRoundData`) — product hold is tracker state, not code absence of word meme.',
    implementationRefs: [
      'src/data/packs/categoryPromptPacks.js:53-65 MemesViralPromptRoundData',
    ],
    testRefs: [],
    nextAction: 'Defer until product rethink.',
    linksExistingTracker: [],
  },
  REQ0019: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'high',
    methodologyNote:
      '`gameSourcePreference.js` + settings copy; native host `__POF_NATIVE_HOST__` — selection semantics.',
    implementationRefs: [
      'src/lib/gameSourcePreference.js',
      'src/App.jsx:6986-6987 settings copy',
      'server/shellConfig.js',
    ],
    testRefs: ['tests/nativeShell/gameSourceSelection.test.mjs'],
    nextAction: 'WebView integration test on debug APK (TEST0005 harness scope).',
    linksExistingTracker: ['CONV-REQ-PROMPT-SOURCE-SELECTION'],
  },
  STRY0001: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'MCP availability is **Cursor host configuration** — not encoded in application tests.',
    implementationRefs: [
      'AGENTS.md — agent environment notes (no MCP manifest in repo root)',
    ],
    testRefs: [],
    nextAction: 'Owner: confirm Cursor team MCP enablement in product settings.',
    linksExistingTracker: ['REQ0011'],
  },
  STRY0002: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote: 'CORS, rate limits, entitlements routes — see LOBBY_ARCHITECTURE + tests.',
    implementationRefs: ['server/lobbyServer.js', 'server/stripeBillingRoutes.js', 'docs/LOBBY_ARCHITECTURE.md'],
    testRefs: ['tests/server/pofAuthJwt.test.mjs', 'tests/server/entitlements.test.mjs'],
    nextAction: 'Prod Redis + Postgres config validation.',
    linksExistingTracker: ['REQ0011'],
  },
  STRY0003: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote: '`.github/workflows/android-debug-apk.yml` builds APK pipeline.',
    implementationRefs: ['.github/workflows/android-debug-apk.yml'],
    testRefs: ['tests/e2e/playwright/mobile-bundled-dist-smoke.spec.js'],
    nextAction: 'Resolve WTSK0002 PR #112 workflow decision.',
    linksExistingTracker: ['WTSK0002'],
  },
  STRY0004: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote: 'Security model in docs + host-only advance + moderation routes.',
    implementationRefs: [
      'docs/LOBBY_ARCHITECTURE.md',
      'server/moderationRoutes.js',
      'server/lobbyServer.js',
    ],
    testRefs: ['tests/server/lobbyStore.test.mjs'],
    nextAction: 'Third-party security review (deferred).',
    linksExistingTracker: ['STRY0002'],
  },
  STRY0005: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote: 'Lobby deploy for sideload — same server codebase.',
    implementationRefs: ['server/lobbyServer.js'],
    testRefs: [],
    nextAction: 'Railway/hosting ops verification.',
    linksExistingTracker: ['REQ0011'],
  },
  STRY0006: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Neon UI components live under `src/components/neon/` (e.g. `NeonHomeScreen.jsx`, `NeonStoreScreen.jsx`); parity vs MagicPath is **design sign-off** not automated.',
    implementationRefs: [
      'src/components/neon/NeonHomeScreen.jsx',
      'src/components/neon/NeonStoreScreen.jsx',
    ],
    testRefs: ['tests/e2e/playwright/mobile-bundled-dist-smoke.spec.js — home UI smoke'],
    nextAction: 'Design sign-off vs MagicPath reference.',
    linksExistingTracker: ['REQ0008', 'STRY0014'],
  },
  STRY0007: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote:
      'Neon shell integrated: `NeonHomeScreen` imported and home branch in render tree — monolith file.',
    implementationRefs: [
      'src/App.jsx:248 import NeonHomeScreen',
      'src/App.jsx:10554+ <NeonHomeScreen ... /> render branch',
      'src/App.jsx:10484+ startupGraphicsReady / app shell',
    ],
    testRefs: ['tests/e2e/playwright/mobile-bundled-dist-smoke.spec.js'],
    nextAction: 'Regression sweep vs STRY0006.',
    linksExistingTracker: ['REQ0008'],
  },
  STRY0008: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote: 'Android debug workflow produces installable artifact.',
    implementationRefs: ['.github/workflows/android-debug-apk.yml', 'app.json'],
    testRefs: ['tests/e2e/playwright/mobile-bundled-dist-smoke.spec.js'],
    nextAction: 'Play internal track upload.',
    linksExistingTracker: ['REQ0007', 'TEST0002'],
  },
  STRY0009: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote: 'E2E exists but coverage gaps (Double Take skip, client unit gap).',
    implementationRefs: ['tests/e2e/playwright/'],
    testRefs: ['npm run test:e2e', 'tests/e2e/playwright/martin-smoke.spec.js'],
    nextAction: 'TEST0001 green CI + expand matrix.',
    linksExistingTracker: ['TEST0001', 'ENHC0025'],
  },
  STRY0010: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Client lists round types in `RoundTypeChoiceGrid`; server `buildAuthoritativeRound` still Hot Seat online — gap.',
    implementationRefs: [
      'src/App.jsx:4033-4095 RoundTypeChoiceGrid',
      'server/storage/lobbyStore.js:353-378 buildAuthoritativeRound',
    ],
    testRefs: ['tests/e2e/playwright/mobile-bundled-dist-smoke.spec.js — iterates round-type-icon-*'],
    nextAction: 'Server parity for non-prompt rounds online (REQ0017, REQ0009).',
    linksExistingTracker: ['REQ0017', 'REQ0009', 'REQ0005'],
  },
  STRY0011: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Rules splash: `RulesSplashScreen` + `data-testid="rules-continue"` (2788-2817); chaos banned words in reveal stack (1196-1249 sanitizeBannedWords).',
    implementationRefs: [
      'src/App.jsx:2788-2817 RulesSplashScreen — rules-continue',
      'src/App.jsx:1196-1249 bannedWords sanitizeBannedWords',
    ],
    testRefs: ['tests/e2e/playwright/martin-smoke.spec.js:53 rules-continue'],
    nextAction: 'E2E chaos mode path.',
    linksExistingTracker: ['REQ0005', 'STRY0010'],
  },
  STRY0012: {
    ...baseRow(false),
    evidenceClassification: 'missing',
    confidence: 'high',
    methodologyNote: 'Grill Em strand obsolete — see REQ0006.',
    implementationRefs: [
      'REQ0006 evidence — no grill round type in client routing',
      'server/lobbyServer.js:403-456 voice token (current voice stack)',
    ],
    testRefs: [],
    nextAction: 'Close or retarget STRY0012 to LiveKit voice chat.',
    linksExistingTracker: ['REQ0006', 'TEST0003'],
  },
  STRY0013: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'medium',
    methodologyNote:
      'Client phases `twotruths-input|voting|reveal` in `syncOnlineRoundFromSnapshot` (9257-9273); data under `src/data/twoTruthsOneFire/`; server gap REQ0017.',
    implementationRefs: [
      'src/App.jsx:9257-9273 twotruths phase branches',
      'src/data/twoTruthsOneFire/',
    ],
    testRefs: [],
    nextAction: 'Server + E2E online Two Truths (REQ0017).',
    linksExistingTracker: ['REQ0017', 'STRY0010'],
  },
  STRY0014: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'In-app store: `NeonStoreScreen.jsx` implements collapsible shop UI — MagicPath mockup equivalence is **subjective**.',
    implementationRefs: ['src/components/neon/NeonStoreScreen.jsx'],
    testRefs: [],
    nextAction: 'Martin feedback gate vs mockup.',
    linksExistingTracker: ['ENHC0013'],
  },
  STRY0015: {
    ...baseRow(false),
    evidenceClassification: 'code_proven_partial',
    confidence: 'high',
    methodologyNote: '`BugReportScreen` + queue client `src/lib/bugReportClient.js`.',
    implementationRefs: ['src/components/BugReportScreen.jsx', 'src/lib/bugReportClient.js'],
    testRefs: [],
    nextAction: 'E2E open bug report with mock API.',
    linksExistingTracker: ['ENHC0025'],
  },
  STRY0016: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'OTA via EAS not evidenced in repo (no eas.json); releases use GitHub + Gradle (`android-release-aab.yml`).',
    implementationRefs: ['app.json:1-37', '.github/workflows/android-release-aab.yml:1-80'],
    testRefs: [],
    nextAction: 'If OTA needed: add eas.json + channel policy; else close story as web shell only.',
    linksExistingTracker: ['REQ0007', 'REQ0016'],
  },
  STRY0017: {
    ...baseRow(true),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote: 'AAB workflow exists; placeholder signing — org acceptance.',
    implementationRefs: ['.github/workflows/android-release-aab.yml'],
    testRefs: [],
    nextAction: 'Production signing (REQ0012).',
    linksExistingTracker: ['REQ0012', 'STRY0008'],
  },
  STRY0018: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Theme host visuals/audio driven from `themeHosts.js` + `themeAssets.js` — per-theme QA not automated.',
    implementationRefs: ['src/data/themeHosts.js', 'src/data/themeAssets.js'],
    testRefs: [],
    nextAction: 'Content QA per theme.',
    linksExistingTracker: ['REQ0008'],
  },
  STRY0019: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote: 'Host lines + media — see hostVoiceLineMap + assets.',
    implementationRefs: ['src/data/hostVoiceLineMap.js'],
    testRefs: [],
    nextAction: 'DFCT0025/0026 audio QA.',
    linksExistingTracker: ['DFCT0025', 'DFCT0026'],
  },
  STRY0020: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Chaos banned words: `sanitizeBannedWords` + `BANNED_WORD_BANK` (1196-1249); server mirrors in `lobbyStore` `pickBannedWords` (~228-241).',
    implementationRefs: [
      'src/App.jsx:1196-1249 sanitizeBannedWords / BANNED_WORD_BANK',
      'server/storage/lobbyStore.js:228-241 pickBannedWords',
    ],
    testRefs: [],
    nextAction: 'Unit test banned word merge client vs server.',
    linksExistingTracker: ['STRY0011'],
  },
  STRY0021: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote: 'Round scoring server-side `scoreRoundServer` in lobbyStore.',
    implementationRefs: ['server/storage/lobbyStore.js:243-273 scoreRoundServer'],
    testRefs: ['tests/server/lobbyStore.test.mjs'],
    nextAction: 'Client display alignment tests.',
    linksExistingTracker: ['STRY0010'],
  },
  STRY0022: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Disconnect grace: `scheduleDisconnectGraceTimer` + socket `disconnect` handler (341-389, 1120-1134).',
    implementationRefs: [
      'server/lobbyServer.js:341-389 scheduleDisconnectGraceTimer',
      'server/lobbyServer.js:1120-1134 socket disconnect → scheduleDisconnectGraceTimer',
    ],
    testRefs: ['tests/server/lobbyStore.test.mjs'],
    nextAction: 'Soak test multi-tab disconnect.',
    linksExistingTracker: ['STRY0002'],
  },
  STRY0023: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Voice: `ONLINE_VOICE_ACTIVE_SCREENS` (349-358) + effect gates `setOnlineVoiceEnabled` (8399-8407).',
    implementationRefs: [
      'src/App.jsx:349-358 ONLINE_VOICE_ACTIVE_SCREENS',
      'src/App.jsx:8399-8407 useEffect onlineVoiceEnabled',
    ],
    testRefs: [],
    nextAction: 'E2E verify local pass-phone screens do not enable LiveKit connect.',
    linksExistingTracker: ['REQ0009'],
  },
  STRY0024: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote: 'Round chooser UI — round-type grid.',
    implementationRefs: [
      'src/App.jsx:10899-10920 screen round-type-choice + RoundTypeChoiceGrid',
    ],
    testRefs: ['tests/e2e/playwright/mobile-bundled-dist-smoke.spec.js'],
    nextAction: 'Unskip Double Take path (TEST0004).',
    linksExistingTracker: ['TEST0004'],
  },
  STRY0025: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Rules + settings: `RulesSplashScreen` + `SettingsScreen` (6770+) with `SettingsToggleRow` (6722+).',
    implementationRefs: [
      'src/App.jsx:10892-10897 rules screen branch',
      'src/App.jsx:6722-6767 SettingsToggleRow',
      'src/App.jsx:6770+ SettingsScreen',
    ],
    testRefs: ['tests/e2e/playwright/martin-smoke.spec.js:53 rules-continue'],
    nextAction: 'Snapshot all rule variants.',
    linksExistingTracker: ['REQ0005'],
  },
  STRY0026: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Host personas: `getThemePersonas` / `themeHosts.js`; voice export helper `scripts/lib/hostVoiceExportLib.cjs`.',
    implementationRefs: [
      'src/data/themeHosts.js',
      'scripts/lib/hostVoiceExportLib.cjs',
    ],
    testRefs: [],
    nextAction: 'Visual content QA vs theme packs.',
    linksExistingTracker: ['STRY0018'],
  },
  STRY0027: {
    ...baseRow(false),
    evidenceClassification: 'deferred',
    confidence: 'medium',
    methodologyNote: 'Infomercial script — marketing content; no script file in repo audit.',
    implementationRefs: ['docs/store/play-listing.md — marketing copy only'],
    testRefs: [],
    nextAction: 'Defer to marketing.',
    linksExistingTracker: [],
  },
  TEST0001: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'high',
    methodologyNote:
      'Playwright E2E runs locally; “Green on CI” depends on adding job — npm-test.yml covers unit only.',
    implementationRefs: ['playwright.config.js', '.github/workflows/npm-test.yml'],
    testRefs: ['tests/e2e/playwright/*.spec.js'],
    nextAction: 'Optional: add Playwright CI workflow (separate from ENHC0025).',
    linksExistingTracker: ['ENHC0023', 'STRY0009'],
  },
  TEST0002: {
    ...baseRow(false),
    evidenceClassification: 'blocked_device_external',
    confidence: 'medium',
    methodologyNote:
      'Tracker Done — physical install/launch not repeated in this audit (Linux agent).',
    implementationRefs: ['.github/workflows/android-debug-apk.yml'],
    testRefs: ['tests/e2e/playwright/mobile-bundled-dist-smoke.spec.js — proxy web only'],
    runtimeNotes: 'WebView install smoke ≠ APK install proof.',
    nextAction: 'Physical device repeat per release.',
    linksExistingTracker: ['REQ0007', 'STRY0008'],
  },
  TEST0003: {
    ...baseRow(false),
    evidenceClassification: 'blocked_device_external',
    confidence: 'high',
    methodologyNote: 'Voice round device test — needs real mic + LiveKit room.',
    implementationRefs: [
      'src/online/voicePartyTransport.js',
      'server/lobbyServer.js:403-456 /api/lobbies/:code/voice/token',
    ],
    testRefs: [],
    runtimeNotes: 'No automated voice round test in repo.',
    nextAction: 'Manual device script: join lobby, publish mic, verify others hear.',
    linksExistingTracker: ['STRY0012', 'CONV-REQ-VOICE-TURN-PHASE'],
  },
  WTSK0001: {
    ...baseRow(false),
    evidenceClassification: 'deferred',
    confidence: 'medium',
    methodologyNote: 'Retrospective chat logging — process backlog.',
    implementationRefs: ['docs/superpowers/plans/2026-11-06-jubba-full-audit.md — plan artifact'],
    testRefs: [],
    nextAction: 'Schedule during dev gap.',
    linksExistingTracker: [],
  },
  WTSK0003: {
    ...baseRow(false),
    evidenceClassification: 'partial',
    confidence: 'medium',
    methodologyNote:
      'Sandbox Stripe price + mapping in code/tests; live deploy explicitly out of scope for audit.',
    implementationRefs: ['server/stripeCatalog.js', 'tests/server/stripeCatalog.test.mjs'],
    testRefs: ['tests/server/stripeCatalog.test.mjs'],
    runtimeNotes: 'Railway healthy deploy cited in tracker — not re-verified live.',
    nextAction: 'Live migration per WTSK0006 checklist.',
    linksExistingTracker: ['WTSK0006'],
  },
};

function main() {
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const batch01 = JSON.parse(fs.readFileSync(batch01Path, 'utf8'));
  const batch01ItemNums = new Set(Object.keys(batch01.items || {}));

  const items = {};
  let filled = 0;
  for (const item of snapshot.items) {
    const num = item.number;
    const existing = batch01.items[num];
    if (
      existing &&
      existing.evidenceClassification &&
      existing.evidenceClassification !== 'pending_examination'
    ) {
      continue;
    }
    const emptyDesc = !String(item.description || '').trim();
    const row =
      OVERRIDES[num] ||
      baseRow(emptyDesc, {
        evidenceClassification: 'partial',
        confidence: 'low',
        methodologyNote:
          'Batch 02 default: no dedicated examination — replace if incorrect.',
        implementationRefs: [],
        testRefs: [],
        nextAction: `Triage ${num}: map to module + test (ENHC0025).`,
        linksExistingTracker: ['ENHC0025'],
      });
    row.number = num;
    row.title = item.title;
    row.type = item.type;
    items[num] = row;
    filled += 1;
  }

  const out = {
    schemaVersion: 1,
    auditBatchId: 'POF-AUDIT-2026-11-06-BATCH02',
    generatedAt: new Date().toISOString(),
    purpose:
      'Evidence for remaining snapshot rows; merged after batch 01 by buildJubbaWorldTraceability.mjs.',
    items,
    stats: {
      rowsWritten: filled,
      batch01ItemKeys: batch01ItemNums.size,
    },
  };

  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.error(`Wrote ${outPath} (${filled} items)`);
}

main();
