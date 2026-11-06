#!/usr/bin/env node
/**
 * Build traceability matrix rows from jubbaworld-snapshot JSON.
 * Heuristic classification — parent must review; not a substitute for product sign-off.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const snapshotPath = path.join(
  root,
  'docs/audit/2026-11-06-jubba-full-audit/jubbaworld-snapshot-2026-11-06.json',
);

/** Tag repo areas touched by automated tests (coarse). */
const testSuiteTags = {
  'tests/server/lobbyStore.test.mjs': ['online_lobby', 'vote_flow', 'resume', 'host_phase'],
  'tests/server/lobbyHttpRateLimit.test.mjs': ['rate_limits'],
  'tests/server/hostingGate.test.mjs': ['hosting_gate', 'install_token'],
  'tests/server/pofAuthJwt.test.mjs': ['auth_jwt'],
  'tests/server/entitlements.test.mjs': ['entitlements', 'revenuecat_webhook'],
  'tests/server/contentPackEntitlements.test.mjs': ['content_packs'],
  'tests/server/billingCatalog.test.mjs': ['billing_catalog'],
  'tests/server/stripeCatalog.test.mjs': ['stripe_sandbox_mapping'],
  'tests/server/rateLimit.test.mjs': ['rate_limits'],
  'tests/server/altCardUnlockService.test.mjs': ['alt_cards'],
  'tests/billing/googlePlayProductCatalog.test.mjs': ['google_play_ids'],
  'tests/nativeShell/gameSourceSelection.test.mjs': ['game_source_bundled_live'],
  'tests/e2e/playwright': ['playwright_ui_smoke'],
};

function collectTestFiles() {
  const out = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith('.test.mjs')) out.push(path.relative(root, p).replace(/\\/g, '/'));
    }
  }
  walk(path.join(root, 'tests'));
  return out;
}

const allTestFiles = collectTestFiles();

function tagsForTestFile(f) {
  for (const [k, tags] of Object.entries(testSuiteTags)) {
    if (f.startsWith(k) || f.includes(k)) return tags;
  }
  return ['node_test'];
}

/** Map POF-* external refs to coarse evidence hints */
const pofRefHints = {
  'POF-DEC-001': {
    note: 'Tracker shows Done but only PR #112 recommendation exists; Jubba decision pending per user',
    suggested: 'deferred',
    confidence: 'high',
  },
  'POF-ENH-DISPLAY-CAPS': {
    files: ['src/pof-components.css', 'src/components/ui/button.jsx'],
    suggested: 'partial',
    note: 'h1-h3 + chips + Chewy generator; div-based titles not fully covered',
    confidence: 'high',
  },
  'POF-FIX-STORE-GRAPHICS-FONT': {
    files: ['scripts/generatePlayStoreGraphics.mjs', 'public/assets/fonts/chewy/Chewy-Regular.ttf'],
    suggested: 'verified_partial',
    note: 'Generator verifyChewyPixels; visual sign-off manual',
    confidence: 'medium',
  },
  'POF-ENH-005': {
    files: ['.github/workflows/npm-test.yml'],
    suggested: 'verified',
    note: 'CI runs npm test on path-filtered PRs',
    confidence: 'high',
  },
  'POF-ENH-006': {
    files: ['src/data/packs/categoryPromptPacks.js'],
    suggested: 'partial',
    note: '13+ copy fix in data; no dedicated content test',
    confidence: 'medium',
  },
  'POF-ENH-007': {
    files: ['docs/store/play-listing.md', 'docs/store/graphics/'],
    suggested: 'partial',
    note: 'Marketing assets/docs; automated pixel checks for store generator only',
    confidence: 'low',
  },
  'POF-ENH-008': {
    suggested: 'deferred',
    note: 'Live Stripe/RevenueCat checklist — sandbox-only audit',
    confidence: 'high',
  },
};

/** Keyword buckets: [regex, classification, confidence, note, files[], tests[]] */
const keywordRules = [
  [
    /lobby|socket|join.*code|reconnect|resume|host.*auth|session token|online/i,
    'partial',
    'medium',
    'Server tests cover lobby lifecycle, seat hijack, resume tokens, host-only advance; client UX needs E2E pass',
    ['server/lobbyServer.js', 'server/storage/lobbyStore.js'],
    ['tests/server/lobbyStore.test.mjs'],
  ],
  [
    /rate.?limit|429|throttl/i,
    'partial',
    'high',
    'Unit tests + route wiring tests for resume/round read',
    ['server/rateLimit.js', 'server/lobbyServer.js'],
    ['tests/server/rateLimit.test.mjs', 'tests/server/lobbyHttpRateLimit.test.mjs'],
  ],
  [
    /install token|hosting gate|www\.pantsonfire|production web/i,
    'partial',
    'high',
    'hostingGate tests for install token behaviour',
    ['server/hostingGate.js'],
    ['tests/server/hostingGate.test.mjs'],
  ],
  [
    /stripe|revenue.?cat|entitlement|webhook|billing|purchase|tier|dlc/i,
    'partial',
    'medium',
    'Node tests for mapping, webhook replace, sandbox paths; not full mobile IAP',
    ['server/billing', 'src/billing'],
    [
      'tests/server/entitlements.test.mjs',
      'tests/server/stripeCatalog.test.mjs',
      'tests/billing/googlePlayProductCatalog.test.mjs',
    ],
  ],
  [
    /voice|livekit|mic|one.?word|audio/i,
    'untested',
    'low',
    'No automated voice pipeline tests in npm test; physical device not exercised this audit',
    ['src/App.jsx'],
    [],
  ],
  [
    /accessib|a11y|screen reader|contrast/i,
    'untested',
    'low',
    'No a11y automation in repo',
    [],
    [],
  ],
  [
    /apk|android|expo|webview|bundle/i,
    'partial',
    'medium',
    'Workflow + mobile dist smoke when dist-android built; not a Play Store submission proof',
    ['app/', 'android/', '.github/workflows/android-debug-apk.yml'],
    ['tests/e2e/playwright/mobile-bundled-dist-smoke.spec.js'],
  ],
  [
    /play store|graphics|screenshot|marketing/i,
    'partial',
    'medium',
    'Generator script + Chewy pixel sanity check',
    ['scripts/generatePlayStoreGraphics.mjs'],
    ['scripts/generatePlayStoreGraphics.mjs (verifyChewyPixels)'],
  ],
];

function applyKeywordHints(row, item) {
  const ext = String(item.externalRef || '');
  const num = item.number;
  if (ext === 'POF-DEC-001' || num === 'WTSK0002') return;
  const hay = `${item.title}\n${item.description || ''}`.toLowerCase();
  const matched = [];
  for (const rule of keywordRules) {
    const [re, classification, confidence, note, files, tests] = rule;
    if (re.test(hay)) {
      matched.push(re.source);
      if (row.evidenceClassification === 'untested' || classification === 'partial') {
        row.evidenceClassification = classification;
        row.confidence = confidence;
        row.nextAction = `${note} [keyword:${re.source.slice(0, 40)}]`;
        row.evidenceSource = `${row.evidenceSource}_keyword_hint`;
      }
      for (const f of files || []) {
        if (!row.suggestedFiles.includes(f)) row.suggestedFiles.push(f);
      }
      for (const t of tests || []) {
        if (!row.automatedTestsRelated.includes(t)) row.automatedTestsRelated.push(t);
      }
    }
  }
  row.keywordRuleMatches = matched;
}

/** Map conversation_requirements to richer hints */
const convHints = {
  'CONV-REQ-ALL-CAPS': {
    evidenceClassification: 'partial',
    confidence: 'high',
    suggestedFiles: ['src/pof-components.css', 'src/App.jsx'],
    automatedTestsRelated: [],
    nextAction: 'Extend ALL CAPS to div-based display titles or accept exception list',
  },
  'CONV-REQ-FONT-CHEWY': {
    evidenceClassification: 'partial',
    confidence: 'medium',
    suggestedFiles: ['scripts/generatePlayStoreGraphics.mjs'],
    automatedTestsRelated: ['scripts/generatePlayStoreGraphics.mjs (verifyChewyPixels)'],
    nextAction: 'Manual review of store PNGs / in-game Chewy where applicable',
  },
  'CONV-REQ-PASS-PHONE-AND-ONLINE': {
    evidenceClassification: 'partial',
    confidence: 'medium',
    suggestedFiles: ['src/App.jsx', 'server/storage/lobbyStore.js'],
    automatedTestsRelated: ['tests/server/lobbyStore.test.mjs', 'tests/e2e/playwright/web-player-website.spec.js'],
    nextAction: 'Full loop E2E per round type still partial (martin-smoke skips Double Take)',
  },
  'CONV-REQ-VOICE-TURN-PHASE': {
    evidenceClassification: 'untested',
    confidence: 'low',
    suggestedFiles: ['src/components/OneWordRoundScreen.jsx'],
    automatedTestsRelated: [],
    nextAction: 'Manual or device test: mic gating + discussion transition',
  },
  'CONV-REQ-REPORT-BLOCK-DELETE': {
    evidenceClassification: 'partial',
    confidence: 'low',
    suggestedFiles: ['src/App.jsx', 'server/'],
    automatedTestsRelated: [],
    nextAction: 'Code review paths; no dedicated compliance test suite',
  },
  'CONV-REQ-AGE-13-PLUS': {
    evidenceClassification: 'partial',
    confidence: 'medium',
    suggestedFiles: ['src/data/packs/categoryPromptPacks.js'],
    automatedTestsRelated: [],
    nextAction: 'Content audit + store declarations',
  },
  'CONV-REQ-PROMPT-SOURCE-SELECTION': {
    evidenceClassification: 'partial',
    confidence: 'medium',
    suggestedFiles: ['src/lib/gameSourcePreference.js', 'src/App.jsx'],
    automatedTestsRelated: ['tests/nativeShell/gameSourceSelection.test.mjs'],
    nextAction: 'Expand tests for edge cases if gaps found',
  },
  'CONV-REQ-NO-LIVE-WITHOUT-APPROVAL': {
    evidenceClassification: 'verified',
    confidence: 'high',
    suggestedFiles: [],
    automatedTestsRelated: [],
    nextAction: 'Process requirement — audit did not merge/deploy (compliant)',
  },
  'CONV-REQ-REVIEW-AS-PAGE': {
    evidenceClassification: 'partial',
    confidence: 'medium',
    suggestedFiles: ['docs/audit/2026-11-06-jubba-full-audit/'],
    automatedTestsRelated: [],
    nextAction: 'Parent composes review Page from audit artifacts',
  },
  'CONV-REQ-GRAPHICS-APPROVED': {
    evidenceClassification: 'partial',
    confidence: 'medium',
    suggestedFiles: ['docs/store/graphics/'],
    automatedTestsRelated: [],
    nextAction: 'Graphics approved for review — not deploy proof',
  },
};

function classifyItem(item) {
  const num = item.number;
  const desc = String(item.description || '').trim();
  const emptyDesc = desc.length === 0;
  const ext = String(item.externalRef || '');
  const trackerDone = item.done === true;
  const status = item.status;

  let evidence = 'tracker_only';
  let classification = 'untested';
  let confidence = 'low';
  let nextAction =
    'Review title/description vs code; add acceptance + test or manual QA checklist';
  const relatedTests = [];
  let relatedFiles = [];

  if (ext === 'POF-DEC-001' || num === 'WTSK0002') {
    classification = 'deferred';
    confidence = 'high';
    evidence = 'user_override_decision_pending';
    nextAction =
      'Jubba chooses PR #112 vs branch workflow; tracker Done is incorrect until decided — update status off Done';
  } else if (ext.startsWith('POF-') && pofRefHints[ext]) {
    const h = pofRefHints[ext];
    relatedFiles = [...(h.files || [])];
    if (h.suggested === 'verified') classification = 'verified';
    else if (h.suggested === 'partial') classification = 'partial';
    else if (h.suggested === 'deferred') classification = 'deferred';
    else if (h.suggested === 'verified_partial') classification = 'partial';
    else classification = 'partial';
    confidence = h.confidence || 'medium';
    nextAction = h.note || nextAction;
    evidence = 'repo_mapping_heuristic';
  }

  // Seed defects from bot — default untested even if Done
  if (trackerDone && classification === 'untested') {
    classification = 'untested';
    confidence = 'low';
    evidence = 'tracker_marked_done_without_this_audit';
    nextAction = 'Confirm with commit reference or re-test; do not inherit Done as verified';
  }

  if (emptyDesc) {
    nextAction = `[empty description] ${nextAction}`;
    evidence += '_empty_description';
  }

  const row = {
    jubbaWorldId: item.id,
    number: num,
    type: item.type,
    title: item.title,
    externalRef: ext || null,
    requirementRef: item.requirementRef || null,
    requirementNumber: item.requirementNumber || null,
    trackerStatus: status,
    trackerDone,
    trackerProgress: item.progress,
    priority: item.priority || null,
    emptyDescription: emptyDesc,
    acceptanceBasis: emptyDesc ? 'inferred_from_title_or_parent' : 'from_description_and_checklist',
    evidenceClassification: classification,
    confidence,
    evidenceSource: evidence,
    automatedTestsRelated: relatedTests,
    suggestedFiles: relatedFiles,
    nextAction,
    keywordRuleMatches: [],
  };

  applyKeywordHints(row, item);

  return row;
}

function conversationRows(snapshot) {
  const conv = snapshot.conversation_requirements_not_yet_filed_as_new_items || [];
  return conv.map((c) => {
    const h = convHints[c.id] || {};
    return {
      jubbaWorldId: null,
      number: null,
      type: 'conversation_requirement',
      title: c.statement?.slice(0, 200) || c.id,
      externalRef: c.id,
      requirementRef: null,
      requirementNumber: null,
      trackerStatus: 'n/a',
      trackerDone: null,
      trackerProgress: null,
      priority: null,
      emptyDescription: false,
      acceptanceBasis: 'conversation_inferred',
      evidenceClassification: h.evidenceClassification || 'partial',
      confidence: h.confidence || 'medium',
      evidenceSource: 'user_conversation_not_jubbaworld_item',
      automatedTestsRelated: h.automatedTestsRelated || [],
      suggestedFiles: h.suggestedFiles || [],
      relatedTrackerRefs: c.related_tracker || [],
      nextAction: h.nextAction || 'File as formal requirement/story if not redundant; map tests',
      keywordRuleMatches: [],
    };
  });
}

function main() {
  const raw = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const items = raw.items || [];
  if (items.length !== 119) {
    console.error(`Expected 119 items, got ${items.length}`);
    process.exit(1);
  }

  const rows = items.map((item) => {
    const base = classifyItem(item);
    const cl = item.checklist || [];
    base.checklistTotal = cl.length;
    base.checklistDone = cl.filter((x) => x.done).length;
    return base;
  });

  const convRows = conversationRows(raw);
  const numbers = new Set(rows.map((r) => r.number));
  if (numbers.size !== 119) {
    console.error('Duplicate item.number in snapshot');
    process.exit(1);
  }

  const auditRunEvidence = {
    npmTest: { command: 'npm test', note: 'Run during audit session' },
    npmTestServer: { command: 'npm run test:server' },
    playwrightE2e: { command: 'npm run test:e2e', note: 'After web-player selector fix' },
    mobileDistSmoke: {
      command: 'node scripts/buildMobileBundledWeb.mjs dist-android && npm run test:mobile-dist-smoke',
      note: 'dist-android gitignored; build run for audit only',
    },
  };

  const out = {
    schemaVersion: 2,
    auditId: 'POF-AUDIT-2026-11-06-JUBBA-FULL',
    generatedAt: new Date().toISOString(),
    methodologyNote:
      'Superpowers bundle text attached in docs/audit/.../SUPERPOWERS_SKILLS_BUNDLE.md; applied writing-plans + systematic-debugging + verify-before-completion by analogy',
    baseline: {
      snapshotPath: 'docs/audit/2026-11-06-jubba-full-audit/jubbaworld-snapshot-2026-11-06.json',
      fetchedAt: raw.meta?.fetched_at_utc,
      itemCount: 119,
      conversationRequirementCount: convRows.length,
      matrixRowCount: 119 + convRows.length,
    },
    counts: raw.counts,
    limitations: raw.meta?.limitations || [],
    trackerInconsistencies: raw.notable_inconsistencies || [],
    auditRunEvidence,
    testInventory: {
      nodeTestFiles: allTestFiles,
      testFileTagSample: Object.fromEntries(
        allTestFiles.slice(0, 20).map((f) => [f, tagsForTestFile(f)]),
      ),
    },
    rows,
    conversationRequirementRows: convRows,
  };

  const outPath = path.join(root, 'docs/audit/2026-11-06-jubba-full-audit/traceability-FULL.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Wrote ${outPath} (${rows.length} items + ${convRows.length} conv rows)`);
}

main();
