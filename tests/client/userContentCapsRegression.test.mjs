/**
 * User-submitted copy (Two Truths lines, etc.) must not ride display .pof-heading caps.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const NEON_USER_CONTENT_SOURCES = [
  'src/components/neon/NeonTwoTruthsVotingScreen.jsx',
  'src/components/neon/NeonTwoTruthsRevealScreen.jsx',
];

for (const rel of NEON_USER_CONTENT_SOURCES) {
  test(`${rel} renders player truths/lies with .pof-body, not bare .pof-heading`, () => {
    const source = fs.readFileSync(path.join(repoRoot, rel), 'utf8');
    assert.match(
      source,
      /pof-body[\s\S]*\{text\}/,
      'user-authored line text must use .pof-body',
    );
    assert.doesNotMatch(
      source,
      /className="[^"]*pof-heading[^"]*"[^>]*>\s*\{text\}/,
      'user line text must not use .pof-heading alone',
    );
  });
}

test('NeonTwoTruthsVotingScreen keeps author display names in preserve-heading-case', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'src/components/neon/NeonTwoTruthsVotingScreen.jsx'),
    'utf8',
  );
  assert.match(
    source,
    /pof-heading pof-preserve-heading-case[\s\S]*\{author\.name\}/,
    'player names opt out of ALL-CAPS headings',
  );
});
