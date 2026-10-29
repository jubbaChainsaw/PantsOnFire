import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = readFileSync(
  path.join(root, 'src/hooks/useTimedChoice.js'),
  'utf8',
);

test('useTimedChoice does not reference durationSec in its own default params (TDZ)', () => {
  assert.doesNotMatch(
    source,
    /durationSec\s*=\s*[\s\S]*?\?\s*durationSec/,
    'default param must not self-reference durationSec',
  );
  assert.doesNotMatch(
    source,
    /flashLastSec\s*=\s*[\s\S]*?\?\s*flashLastSec/,
    'default param must not self-reference flashLastSec',
  );
});
