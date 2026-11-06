#!/usr/bin/env node
/**
 * Build traceability matrix from jubbaworld-snapshot JSON + evidence-batch-*.json.
 * Merges all `evidence-batch-*.json` in lexical order (batch01, batch02, …); later files override item numbers.
 * Does NOT keyword-classify items.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const auditDir = path.join(root, 'docs/audit/2026-11-06-jubba-full-audit');
const snapshotPath = path.join(auditDir, 'jubbaworld-snapshot-2026-11-06.json');

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
  return out.sort();
}

const allTestFiles = collectTestFiles();

function listEvidenceBatchFiles() {
  if (!fs.existsSync(auditDir)) return [];
  return fs
    .readdirSync(auditDir)
    .filter((name) => /^evidence-batch-.*\.json$/.test(name))
    .sort()
    .map((name) => path.join(auditDir, name));
}

function loadEvidenceMap() {
  const paths = listEvidenceBatchFiles();
  if (!paths.length) {
    return { items: {}, conversationRequirements: {}, sources: [], batchMeta: [] };
  }
  const items = {};
  const conversationRequirements = {};
  const batchMeta = [];
  for (const p of paths) {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    batchMeta.push({
      file: path.relative(root, p).replace(/\\/g, '/'),
      auditBatchId: raw.auditBatchId || raw.auditContinuationId || null,
      generatedAt: raw.generatedAt || null,
      stats: raw.stats || null,
    });
    for (const [num, row] of Object.entries(raw.items || {})) {
      items[num] = { ...(items[num] || {}), ...row };
    }
    for (const [key, row] of Object.entries(raw.conversationRequirements || {})) {
      conversationRequirements[key] = { ...(conversationRequirements[key] || {}), ...row };
    }
  }
  return { items, conversationRequirements, sources: paths.map((p) => path.relative(root, p).replace(/\\/g, '/')), batchMeta };
}

function rowFromEvidenceItem(item, ev) {
  const emptyDesc = !String(item.description || '').trim();
  const ext = String(item.externalRef || '');

  if (ev) {
    return {
      jubbaWorldId: item.id,
      number: item.number,
      type: item.type,
      title: item.title,
      externalRef: ext || null,
      requirementRef: item.requirementRef || null,
      requirementNumber: item.requirementNumber || null,
      trackerStatus: item.status,
      trackerDone: item.done,
      trackerProgress: item.progress,
      priority: item.priority || null,
      emptyDescription: emptyDesc,
      acceptanceBasis: ev.acceptanceBasis || (emptyDesc ? 'inferred_from_title' : 'from_snapshot_description'),
      acceptanceInferredFlag: ev.acceptanceInferredFlag ?? emptyDesc,
      evidenceClassification: ev.evidenceClassification,
      confidence: ev.confidence,
      evidenceSource: ev.evidenceSource,
      methodologyNote: ev.methodologyNote,
      implementationRefs: ev.implementationRefs || [],
      testRefs: ev.testRefs || [],
      runtimeNotes: ev.runtimeNotes ?? null,
      linksExistingTracker: ev.linksExistingTracker || [],
      nextAction: ev.nextAction,
    };
  }

  return {
    jubbaWorldId: item.id,
    number: item.number,
    type: item.type,
    title: item.title,
    externalRef: ext || null,
    requirementRef: item.requirementRef || null,
    requirementNumber: item.requirementNumber || null,
    trackerStatus: item.status,
    trackerDone: item.done,
    trackerProgress: item.progress,
    priority: item.priority || null,
    emptyDescription: emptyDesc,
    acceptanceBasis: emptyDesc ? 'inferred_from_title' : 'from_snapshot_description',
    evidenceClassification: 'missing_evidence_row',
    confidence: 'n/a',
    evidenceSource: 'evidence_json_incomplete',
    methodologyNote: 'Add this number to evidence-batch-*.json',
    implementationRefs: [],
    testRefs: [],
    linksExistingTracker: [],
    runtimeNotes: null,
    nextAction: 'Add batched examination entry',
  };
}

function conversationRows(snapshot, convEvidence) {
  const conv = snapshot.conversation_requirements_not_yet_filed_as_new_items || [];
  return conv.map((c) => {
    const keyUnderscore = c.id.replace(/-/g, '_');
    const ev = convEvidence[keyUnderscore] || convEvidence[c.id] || null;
    if (ev) {
      return {
        jubbaWorldId: null,
        number: null,
        type: 'conversation_requirement',
        title: c.statement?.slice(0, 200) || c.id,
        externalRef: c.id,
        trackerStatus: 'n/a',
        trackerDone: null,
        acceptanceBasis: 'conversation_inferred',
        evidenceClassification: ev.evidenceClassification,
        confidence: ev.confidence,
        evidenceSource: ev.evidenceSource,
        methodologyNote: ev.methodologyNote,
        implementationRefs: ev.implementationRefs || [],
        testRefs: ev.testRefs || [],
        relatedTrackerRefs: c.related_tracker || [],
        linksExistingTracker: ev.linksExistingTracker || [],
        nextAction: ev.nextAction,
      };
    }
    return {
      jubbaWorldId: null,
      number: null,
      type: 'conversation_requirement',
      title: c.statement?.slice(0, 200) || c.id,
      externalRef: c.id,
      trackerStatus: 'n/a',
      acceptanceBasis: 'conversation_inferred',
      evidenceClassification: 'missing_evidence_row',
      evidenceSource: 'evidence_json_incomplete',
      nextAction: 'Add CONV block to evidence-batch-*.json',
      implementationRefs: [],
      testRefs: [],
      linksExistingTracker: [],
    };
  });
}

function summarizeClassifications(rows) {
  const counts = {};
  for (const r of rows) {
    const k = r.evidenceClassification || 'unknown';
    counts[k] = (counts[k] || 0) + 1;
  }
  return counts;
}

function main() {
  const raw = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const items = raw.items || [];
  if (items.length !== 119) {
    console.error(`Expected 119 items, got ${items.length}`);
    process.exit(1);
  }

  const { items: evItems, conversationRequirements: convEv, sources, batchMeta } = loadEvidenceMap();

  const rows = items.map((item) => {
    const ev = evItems[item.number];
    const base = rowFromEvidenceItem(item, ev);
    const cl = item.checklist || [];
    base.checklistTotal = cl.length;
    base.checklistDone = cl.filter((x) => x.done).length;
    return base;
  });

  const convRows = conversationRows(raw, convEv);

  const numbers = new Set(rows.map((r) => r.number));
  if (numbers.size !== 119) {
    console.error('Duplicate item.number in snapshot');
    process.exit(1);
  }

  const auditRunEvidence = {
    npmTest: { command: 'npm test', note: 'Node tests under tests/**/*.test.mjs' },
    npmTestServer: { command: 'npm run test:server', note: 'tests/server/*.test.mjs' },
    playwrightE2e: { command: 'npm run test:e2e' },
    mobileDistSmoke: {
      command: 'node scripts/buildMobileBundledWeb.mjs dist-android && npm run test:mobile-dist-smoke',
      note: 'dist-android gitignored; Vite preview may log ECONNREFUSED for /api/* without lobby server',
    },
  };

  const itemClassifications = summarizeClassifications(rows);
  const convClassifications = summarizeClassifications(convRows);

  const out = {
    schemaVersion: 3,
    auditId: 'POF-AUDIT-2026-11-06-JUBBA-FULL',
    generatedAt: new Date().toISOString(),
    methodologyNote:
      'Superpowers bundle: docs/audit/2026-11-06-jubba-full-audit/SUPERPOWERS_SKILLS_BUNDLE.md. Rows merge snapshot + evidence-batch-*.json (lexical merge order). No keyword heuristics. Independent code reviewer: not available this run.',
    baseline: {
      snapshotPath: 'docs/audit/2026-11-06-jubba-full-audit/jubbaworld-snapshot-2026-11-06.json',
      snapshotProvenanceCopyPath:
        'docs/audit/2026-11-06-jubba-full-audit/jubbaworld-snapshot-upload-provenance-8c20.json',
      fetchedAt: raw.meta?.fetched_at_utc,
      itemCount: 119,
      conversationRequirementCount: convRows.length,
      matrixRowCount: 119 + convRows.length,
    },
    evidenceBatchFiles: sources,
    evidenceBatchMerge: batchMeta,
    itemClassificationCounts: itemClassifications,
    conversationClassificationCounts: convClassifications,
    counts: raw.counts,
    limitations: raw.meta?.limitations || [],
    trackerInconsistencies: raw.notable_inconsistencies || [],
    auditRunEvidence,
    testInventory: {
      nodeTestFiles: allTestFiles,
    },
    rows,
    conversationRequirementRows: convRows,
  };

  const outPath = path.join(auditDir, 'traceability-FULL.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Wrote ${outPath} (${rows.length} items + ${convRows.length} conv rows)`);
  console.log('Evidence files:', sources.join(', ') || '(none)');
  console.log('Item classification counts:', JSON.stringify(itemClassifications));
}

main();
