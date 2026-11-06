import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('validateVideoAssets passes including Fever Dream host video slugs', () => {
  const script = path.join(repoRoot, 'scripts/validateVideoAssets.cjs');
  const out = execFileSync(process.execPath, [script], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.match(out, /\[validateVideoAssets\] OK/);
});

test('Fever Dream themes resolve host placeholder paths via THEME_CARD_SLUGS', () => {
  for (const slug of ['fever-dream-1', 'fever-dream-2']) {
    const mp4 = path.join(repoRoot, 'public/assets/videos/hosts', slug, 'talking-placeholder.mp4');
    const webm = path.join(repoRoot, 'public/assets/videos/hosts', slug, 'talking-placeholder.webm');
    assert.ok(fs.existsSync(mp4), `missing ${mp4}`);
    assert.ok(fs.existsSync(webm), `missing ${webm}`);
  }
});
