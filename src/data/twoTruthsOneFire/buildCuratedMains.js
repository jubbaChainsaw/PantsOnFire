/** Turn curated phrase tails into full prompt mains (single prefix only — no clause gluing). */
export function phraseToMain(phrase) {
  const trimmed = String(phrase || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('Name three ')) return trimmed;
  return `Name three ${trimmed}`;
}

export function dedupeMains(mains) {
  const seen = new Set();
  const out = [];
  for (const main of mains) {
    const key = main.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(main.trim());
  }
  return out;
}
