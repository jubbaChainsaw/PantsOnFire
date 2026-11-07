const BLOCKED_WORDS = [
  'fuck',
  'fucking',
  'fucker',
  'shit',
  'shitty',
  'bitch',
  'bastard',
  'asshole',
  'cunt',
  'dick',
  'piss',
  'whore',
  'slut',
  'nigger',
  'nigga',
  'faggot',
  'retard',
];

const wordPattern = new RegExp(
  `\\b(${BLOCKED_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'gi',
);

export function containsProfanity(text) {
  const raw = String(text || '');
  if (!raw.trim()) return false;
  return wordPattern.test(raw);
}

export function filterProfanity(text) {
  const raw = String(text || '');
  if (!raw.trim()) return raw;
  return raw.replace(wordPattern, (match) => '*'.repeat(Math.min(match.length, 8)));
}

export function sanitizeDisplayName(name) {
  const trimmed = filterProfanity(String(name || '').trim()).slice(0, 32);
  return trimmed || 'Player';
}
