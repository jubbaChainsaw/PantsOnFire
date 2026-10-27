/** Aggressive de-spam filters for legacy phrase tails. */
import { validateTwoTruthsPromptMain } from '../../src/data/twoTruthsOneFirePrompts.js';

const GLOBAL_BAD = [
  /\bnot horror\b/i,
  /\bJapanese original\b/i,
  /own-brand products|meal deal sandwiches|ready meals/i,
  /\bfrom the (19|20)\d0s\b/i,
  /\bLeague (One|Two) (managers|stadiums)\b/i,
  /\bNational League (managers|stadiums)\b/i,
  /\b(Primeira Liga|Eredivisie|Ligue 1|Bundesliga|Serie A|La Liga) (managers|stadiums)\b/i,
  /\bScottish Premiership (managers|stadiums)\b/i,
  /\bWomen's Super League (managers|stadiums)\b/i,
  /\bChampionship (managers|stadiums)\b/i,
  /\broommate\b/i,
  /\bthat (are|feel|would|spell|belong|sound|remind|split|instantly)\b/i,
  /\byou would (not |never |put |rate |strike |ban |defend |recommend )/i,
  /\bfrom a (hotel|festival|messy|chaotic|lads)/i,
  /\bcollaborations?\b/i,
  /\b(prism|NSA|inquiry witnesses|passenger rights|hidden fee)\b/i,
  /\bgimmicks\b/i,
  /\bknown faults\b/i,
  /\b stories$/i,
  /\b tales$/i,
  /\b horror stories$/i,
  /\bclubs in the UK$/i,
  /\b(beginner kit items|competitions|famous magazines|YouTube channels)\b/i,
  /\b(composition tips|filter choices|caption ideas|common mistakes)\b/i,
  /\b(key works|logo colours|officer duties)\b/i,
  /\bpeople share\b/i,
  /\bhorror stories people\b/i,
  /\bmacro photos\b/i,
  /\bfilter era\b/i,
  /\bresponsibilities\b/i,
  /\bpeople warn about\b/i,
  /\bconfusion$/i,
  /\bmeltdowns\b/i,
  /\boverlay styles\b/i,
  /\bfamous directors\b/i,
  /\bphrases$/i,
];

export function isValidPhrase(phrase) {
  const t = String(phrase || '').trim();
  if (!t) return false;
  if (GLOBAL_BAD.some((re) => re.test(t))) return false;
  const main = t.startsWith('Name three ') ? t : `Name three ${t}`;
  return validateTwoTruthsPromptMain(main) === null;
}

const CROSS_SUFFIX_GROUPS = [
  ['cheeses', 'breads', 'street foods', 'curry dishes', 'desserts', 'snacks'],
  ['capital cities'],
  ['delay excuses', 'queue horror stories', 'lost luggage stories'],
  ['flatmate arguments', 'passive-aggressive notes', 'cleaning rota disputes', 'bill-split fights'],
  ['confusion countries', 'surprise countries', 'mistake countries'],
];

function removeCrossSuffixSpam(phrases) {
  const drop = new Set();
  for (const suffixGroup of CROSS_SUFFIX_GROUPS) {
    for (const suffix of suffixGroup) {
      const matches = phrases.filter((p) => p.toLowerCase().endsWith(suffix));
      if (matches.length >= 4) {
        const keep = matches.find((p) => /^(british|uk|european|things)\b/i.test(p)) || matches[0];
        for (const m of matches) {
          if (m !== keep) drop.add(m.toLowerCase());
        }
      }
    }
  }
  return phrases.filter((p) => !drop.has(p.toLowerCase()));
}

function removeStudioFilmsSpam(phrases) {
  const studioFilms = phrases.filter((p) => /\bfilms$/i.test(p) && /\b(Animation|Studio|Production|Works|Entertainment)\b/i.test(p));
  if (studioFilms.length >= 4) {
    const keep = studioFilms.find((p) => /Studio Ghibli/i.test(p)) || studioFilms[0];
    const drop = new Set(studioFilms.filter((p) => p !== keep).map((p) => p.toLowerCase()));
    return phrases.filter((p) => !drop.has(p.toLowerCase()));
  }
  return phrases;
}

function removeThemeSongPairs(phrases) {
  const drop = new Set();
  for (const p of phrases) {
    if (/\btheme songs$/i.test(p)) {
      const base = p.replace(/\s+theme songs$/i, '');
      const charVersion = `${base} characters`;
      if (phrases.some((x) => x.toLowerCase() === charVersion.toLowerCase())) {
        drop.add(p.toLowerCase());
      }
    }
  }
  return phrases.filter((p) => !drop.has(p.toLowerCase()));
}

function removeFilmsDirectorsVillainsTropesSpam(phrases) {
  const suffixes = new Set(['films', 'directors', 'villains', 'tropes']);
  const byStem = new Map();
  for (const p of phrases) {
    const parts = p.trim().split(/\s+/);
    const last = parts[parts.length - 1]?.toLowerCase();
    if (!suffixes.has(last)) continue;
    const stem = parts.slice(0, -1).join(' ').toLowerCase();
    if (!stem) continue;
    if (!byStem.has(stem)) byStem.set(stem, []);
    byStem.get(stem).push(p);
  }
  const drop = new Set();
  for (const items of byStem.values()) {
    if (items.length >= 3) {
      const keep =
        items.find((i) => /\bfilms$/i.test(i)) ||
        items.find((i) => /\bcharacters$/i.test(i)) ||
        items[0];
      for (const item of items) {
        if (item !== keep) drop.add(item.toLowerCase());
      }
    }
  }
  return phrases.filter((p) => !drop.has(p.toLowerCase()));
}

export function cleanLegacyPhrases(phrases) {
  let list = phrases.map((s) => String(s).trim()).filter(isValidPhrase);
  list = removeCrossSuffixSpam(list);
  list = removeStudioFilmsSpam(list);
  list = removeThemeSongPairs(list);
  list = removeFilmsDirectorsVillainsTropesSpam(list);
  const seen = new Set();
  const out = [];
  for (const p of list) {
    const k = p.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }
  return out;
}
