/**
 * t215u: Deterministic persona name catalog + TTS clip-count / character-basis analysis (read-only export).
 *
 * Usage: node scripts/exportPersonaNameCostAnalysis.mjs
 *
 * Writes:
 *   docs/analysis/persona-name-catalog.json
 *   docs/analysis/persona-name-catalog.csv
 *   docs/analysis/persona-name-cost-basis-summary.json
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

import { THEME_META } from '../src/data/themes.js';
import { toCanonicalThemeName } from '../src/data/themeAliases.js';
import { THEME_DLC_PACK_BY_THEME, SECRET_THEME_NAMES, CORE_THEME_NAMES } from '../src/data/themeCatalog.js';
import {
  getThemePersonas,
  listPersonaPoolThemeNames,
} from '../src/data/themePersonas.js';
import { buildPersonaCalloutSpokenLine } from '../src/data/hostPersonaCallouts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const OUT_DIR = path.join(REPO_ROOT, 'docs/analysis');
const JSON_OUT = path.join(OUT_DIR, 'persona-name-catalog.json');
const CSV_OUT = path.join(OUT_DIR, 'persona-name-catalog.csv');
const SUMMARY_OUT = path.join(OUT_DIR, 'persona-name-cost-basis-summary.json');

const CARRIER_PHRASE = 'Your turn, ';

/** Honorifics / titles that bind to the following name token for address (not blind first-token). */
const PREFIX_TWO_TOKEN = new Set(
  [
    'master',
    'admiral',
    'captain',
    'commander',
    'cmdr',
    'sergeant',
    'sarge',
    'lieutenant',
    'lt',
    'ensign',
    'colonel',
    'general',
    'major',
    'marshal',
    'sheriff',
    'deputy',
    'officer',
    'inspector',
    'agent',
    'detective',
    'professor',
    'doctor',
    'dr',
    'nurse',
    'matron',
    'consultant',
    'registrar',
    'surgeon',
    'therapist',
    'midwife',
    'paramedic',
    'medic',
    'porter',
    'judge',
    'bailiff',
    'clerk',
    'counsel',
    'paralegal',
    'pastor',
    'reverend',
    'rev',
    'sir',
    'dame',
    'lord',
    'lady',
    'king',
    'queen',
    'prince',
    'princess',
    'duke',
    'duchess',
    'baron',
    'baroness',
    'count',
    'countess',
    'regent',
    'father',
    'mother',
    'sister',
    'brother',
    'uncle',
    'aunt',
    'miss',
    'mister',
    'mr',
    'mrs',
    'ms',
    'mx',
    'ada',
    'da',
    'ringmaster',
    'squire',
    'page',
    'friar',
    'blacksmith',
    'archer',
    'knight',
  ].map((s) => s.toLowerCase()),
);

const ARTICLES = new Set(['the', 'a', 'an']);

/** Leading role/epithet bits — pair with the next token (given name) instead of using the epithet alone. */
const EPITHET_LEADING_PREFIXES = new Set(
  [
    'big',
    'little',
    'young',
    'old',
    'silent',
    'mad',
    'raging',
    'dirty',
    'neon',
    'ultra',
    'pc',
  ].map((s) => s.toLowerCase()),
);

function gitHead() {
  try {
    return execSync('git rev-parse HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function themeAvailability(themeName) {
  const hasMeta = Object.prototype.hasOwnProperty.call(THEME_META, themeName);
  if (CORE_THEME_NAMES.includes(themeName)) {
    return {
      variant: 'core',
      unlock: 'always_unlocked',
      packId: null,
      secretReferralOnly: false,
      inThemeMeta: hasMeta,
    };
  }
  const packId = THEME_DLC_PACK_BY_THEME[themeName] || null;
  const secret = SECRET_THEME_NAMES.includes(themeName);
  return {
    variant: 'dlc',
    unlock: secret ? 'referral_achievement_secret_only' : 'purchase_pack_or_achievement',
    packId,
    secretReferralOnly: secret,
    inThemeMeta: hasMeta,
  };
}

function tokenizeSpokenFull(spokenFull) {
  return String(spokenFull || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Rule-based "spoken first address" — not a blind split; flags ambiguous epithets.
 */
function deriveSpokenFirstGivenName(spokenFull) {
  const tokens = tokenizeSpokenFull(spokenFull);
  if (!tokens.length) {
    return {
      spokenFirstAddress: '',
      firstNameRule: 'empty',
      firstNameNeedsHumanReview: true,
      firstNameReviewReason: 'No tokens after normalizing display name.',
    };
  }

  const lower0 = tokens[0].toLowerCase().replace(/[.]/g, '');

  if (lower0 === 'old' && tokens[1] && tokens[1].toLowerCase() === 'man' && tokens.length >= 3) {
    return {
      spokenFirstAddress: `${tokens[0]} ${tokens[1]} ${tokens[2]}`.trim(),
      firstNameRule: 'old_man_compound_skip_article_like',
      firstNameNeedsHumanReview: true,
      firstNameReviewReason:
        '"Old Man …" style label — bundled first three tokens; confirm spoken address (may prefer shorter).',
    };
  }

  if (EPITHET_LEADING_PREFIXES.has(lower0) && tokens.length >= 2) {
    return {
      spokenFirstAddress: `${tokens[0]} ${tokens[1]}`.trim(),
      firstNameRule: 'epithet_plus_given',
      firstNameNeedsHumanReview: true,
      firstNameReviewReason:
        'Leading epithet/callsign before given name — two-token short address; confirm for TTS.',
    };
  }

  if (PREFIX_TWO_TOKEN.has(lower0) && tokens.length >= 2) {
    const t1 = tokens[1];
    const lower1 = t1.toLowerCase();
    if (ARTICLES.has(lower1) && tokens.length >= 3) {
      return {
        spokenFirstAddress: `${tokens[0]} ${tokens[2]}`.trim(),
        firstNameRule: 'title_article_skip',
        firstNameNeedsHumanReview: true,
        firstNameReviewReason:
          'Title + article + name pattern — middle token dropped for address; confirm spoken form.',
      };
    }
    return {
      spokenFirstAddress: `${tokens[0]} ${tokens[1]}`.trim(),
      firstNameRule: 'title_plus_following_token',
      firstNameNeedsHumanReview: false,
      firstNameReviewReason: '',
    };
  }

  if (tokens.length >= 3 && ARTICLES.has(tokens[1].toLowerCase())) {
    const rest = tokens.slice(2).join(' ');
    return {
      spokenFirstAddress: `${tokens[0]} ${rest}`.trim(),
      firstNameRule: 'given_article_epithet_rest',
      firstNameNeedsHumanReview: true,
      firstNameReviewReason:
        'Pattern like "Gregor the Overthinker" — article skipped; spoken short form uses given name + epithet tail.',
    };
  }

  return {
    spokenFirstAddress: tokens[0],
    firstNameRule: 'first_token',
    firstNameNeedsHumanReview: false,
    firstNameReviewReason: '',
  };
}

function normKey(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function sumLengths(strings) {
  return strings.reduce((acc, s) => acc + String(s || '').length, 0);
}

function minimalUniquePrefixByTokens(tokens, disambiguateAgainst) {
  const n = tokens.length;
  for (let len = 1; len <= n; len += 1) {
    const cand = tokens.slice(0, len).join(' ');
    const key = normKey(cand);
    const matches = disambiguateAgainst.filter((t) => normKey(t.slice(0, len).join(' ')) === key);
    if (matches.length <= 1) return { minimalSpoken: cand, prefixTokenCount: len };
  }
  return { minimalSpoken: tokens.join(' '), prefixTokenCount: n };
}

function csvEscape(field) {
  const s = String(field ?? '');
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildRows() {
  const poolKeys = listPersonaPoolThemeNames();
  const seenIds = new Set();
  const rows = [];

  for (const poolThemeName of poolKeys) {
    const list = getThemePersonas(poolThemeName) || [];
    const availability = themeAvailability(poolThemeName);
    const canonicalTheme = toCanonicalThemeName(poolThemeName);
    for (const p of list) {
      if (!p || seenIds.has(p.id)) continue;
      seenIds.add(p.id);
      const displayName = String(p.name || '').trim();
      const spokenFullHuman = buildPersonaCalloutSpokenLine(displayName);
      const firstDer = deriveSpokenFirstGivenName(spokenFullHuman);
      rows.push({
        personaId: p.id,
        displayName,
        spokenFullHuman,
        canonicalThemeName: canonicalTheme,
        poolThemeName,
        poolIsAliasOfCanonical: poolThemeName !== canonicalTheme,
        imageSrc: p.imageSrc || '',
        ...firstDer,
        themeAvailability: availability,
        source: 'src/data/themePersonas.js + src/data/dlcPersonaRoster.json (DLC pools)',
      });
    }
  }
  rows.sort((a, b) => a.personaId.localeCompare(b.personaId));
  return rows;
}

function groupByKey(rows, keyFn) {
  const map = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(r);
  }
  return map;
}

function main() {
  const commit = gitHead();
  const rows = buildRows();

  const fullKeys = rows.map((r) => normKey(r.spokenFullHuman));
  const allFullTokens = rows.map((r) => tokenizeSpokenFull(r.spokenFullHuman));

  const minimalRows = rows.map((r) => {
    const tokens = tokenizeSpokenFull(r.spokenFullHuman);
    const { minimalSpoken, prefixTokenCount } = minimalUniquePrefixByTokens(
      tokens,
      allFullTokens,
    );
    return {
      ...r,
      minimalUniqueSpoken: minimalSpoken,
      minimalUniquePrefixTokenCount: prefixTokenCount,
    };
  });

  const distinctSpokenFull = new Set(rows.map((r) => normKey(r.spokenFullHuman)));
  const distinctSpokenFirst = new Set(
    rows.map((r) => normKey(r.spokenFirstAddress)).filter(Boolean),
  );
  const distinctMinimal = new Set(
    minimalRows.map((r) => normKey(r.minimalUniqueSpoken)).filter(Boolean),
  );

  const fullCollisions = [...groupByKey(rows, (r) => normKey(r.spokenFullHuman)).entries()].filter(
    ([, arr]) => arr.length > 1,
  );
  const firstCollisions = [...groupByKey(rows, (r) => normKey(r.spokenFirstAddress)).entries()].filter(
    ([k, arr]) => k && arr.length > 1,
  );

  const summary = {
    schemaVersion: 1,
    taskId: 't215u',
    generatedAt: new Date().toISOString(),
    gitCommit: commit,
    sourcePaths: [
      'src/data/themePersonas.js',
      'src/data/dlcPersonaRoster.json',
      'src/data/dlcCuratedPersonas.js',
      'src/data/names.js',
      'src/data/themeAliases.js',
      'src/data/themeCatalog.js',
      'src/data/themes.js',
      'src/data/hostPersonaCallouts.js (spoken full = strip decorative quotes only)',
    ],
    counts: {
      personaRowsTotal: rows.length,
      distinctPersonaIds: rows.length,
      distinctSpokenFullStrings: distinctSpokenFull.size,
      distinctSpokenFirstAddressStrings: distinctSpokenFirst.size,
      distinctMinimalUniqueSpokenStrings: distinctMinimal.size,
      rowsFlaggedFirstNameHumanReview: rows.filter((r) => r.firstNameNeedsHumanReview).length,
    },
    characterTotalsBareName: {
      description:
        'Sum of string lengths (Unicode code units) for each strategy — bare spoken text only, no carrier phrase.',
      spokenFullSumChars: sumLengths(rows.map((r) => r.spokenFullHuman)),
      spokenFirstAddressSumChars: sumLengths(rows.map((r) => r.spokenFirstAddress)),
      minimalUniqueSpokenSumChars: sumLengths(minimalRows.map((r) => r.minimalUniqueSpoken)),
    },
    optionalCarrierPhrase: {
      text: CARRIER_PHRASE,
      carrierCharLength: CARRIER_PHRASE.length,
      note:
        'If each clip uses "Your turn, " before the name, multiply: per persona, add carrierCharLength to the chosen bare string length for script character input; sum over personas = sum(bare) + personaRowsTotal * carrierCharLength.',
    },
    duplicateGroups: {
      spokenFullHuman: fullCollisions.map(([k, arr]) => ({
        normalizedSpokenFull: k,
        count: arr.length,
        personaIds: arr.map((r) => r.personaId).sort(),
      })),
      spokenFirstAddress: firstCollisions.map(([k, arr]) => ({
        normalizedFirstAddress: k,
        count: arr.length,
        personaIds: arr.map((r) => r.personaId).sort(),
      })),
    },
    scopeNotes: {
      curatedAndDlcJson:
        'Finite known personas from curated arrays in themePersonas.js and DLC roster JSON (per theme pool).',
      proceduralThemes:
        'Themes without a curated pool use buildProceduralThemePersonas: PROCEDURAL_PERSONA_COUNT (25) × per NAME_POOLS entries in names.js — deterministic finite set per export.',
      userCustomNames:
        'Players can type display names in-app (e.g. setup / online). Those are unbounded and not included in this catalog — only selectable persona definitions.',
      hostPersonaCalloutThemes:
        'Ian Poster persona callouts (bundled MP3) are registered only for HOST_PERSONA_CALLOUT_THEME_NAMES in hostPersonaCallouts.js; this export lists all persona definitions regardless.',
    },
    clipCountBasis: {
      spokenFull: {
        distinctStrings: distinctSpokenFull.size,
        clipsIfOnePerDistinctString: distinctSpokenFull.size,
      },
      spokenFirstAddress: {
        distinctStrings: distinctSpokenFirst.size,
        clipsIfOnePerDistinctString: distinctSpokenFirst.size,
        caveat:
          'Ambiguous lobby collisions: two players can pick different personas that share the same spokenFirstAddress — short form clips would collide in the same session.',
      },
      minimalUniqueSpoken: {
        distinctStrings: distinctMinimal.size,
        clipsIfOnePerDistinctString: distinctMinimal.size,
        algorithm:
          'Per persona, extend prefix tokens from spoken full until the prefix is unique among all personas (same normalization as map lookup).',
      },
    },
    monetizationNote: 'No pricing or currency estimates — parent uses vendor pricing separately.',
  };

  mkdirSync(OUT_DIR, { recursive: true });

  const catalogPayload = {
    schemaVersion: 1,
    taskId: 't215u',
    gitCommit: commit,
    generatedAt: summary.generatedAt,
    personas: minimalRows,
  };

  writeFileSync(JSON_OUT, `${JSON.stringify(catalogPayload, null, 2)}\n`, 'utf8');

  const csvHeader = [
    'personaId',
    'displayName',
    'spokenFullHuman',
    'spokenFirstAddress',
    'firstNameRule',
    'firstNameNeedsHumanReview',
    'firstNameReviewReason',
    'minimalUniqueSpoken',
    'minimalUniquePrefixTokenCount',
    'poolThemeName',
    'canonicalThemeName',
    'poolIsAliasOfCanonical',
    'themeUnlockVariant',
    'themePackId',
    'secretReferralOnly',
    'imageSrc',
  ];
  const csvLines = [
    csvHeader.join(','),
    ...minimalRows.map((r) =>
      [
        r.personaId,
        r.displayName,
        r.spokenFullHuman,
        r.spokenFirstAddress,
        r.firstNameRule,
        r.firstNameNeedsHumanReview,
        r.firstNameReviewReason,
        r.minimalUniqueSpoken,
        r.minimalUniquePrefixTokenCount,
        r.poolThemeName,
        r.canonicalThemeName,
        r.poolIsAliasOfCanonical,
        r.themeAvailability.variant,
        r.themeAvailability.packId ?? '',
        r.themeAvailability.secretReferralOnly,
        r.imageSrc,
      ]
        .map(csvEscape)
        .join(','),
    ),
  ];
  writeFileSync(CSV_OUT, `${csvLines.join('\n')}\n`, 'utf8');

  writeFileSync(SUMMARY_OUT, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${path.relative(REPO_ROOT, JSON_OUT)} (${rows.length} personas)`);
  console.log(`Wrote ${path.relative(REPO_ROOT, CSV_OUT)}`);
  console.log(`Wrote ${path.relative(REPO_ROOT, SUMMARY_OUT)}`);
}

main();
