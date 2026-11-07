import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const workflowPath = path.join(repoRoot, '.github/workflows/deploy-ionos-web.yml');

function extractOnBlock(source) {
  const match = source.match(/^on:\n([\s\S]*?)(?=^concurrency:|^jobs:|$)/m);
  assert.ok(match, 'deploy-ionos-web.yml must declare on:');
  return match[1];
}

test('deploy-ionos-web.yml is manual workflow_dispatch only (no automatic push deploy)', () => {
  const source = fs.readFileSync(workflowPath, 'utf8');
  const onBlock = extractOnBlock(source);

  assert.match(onBlock, /workflow_dispatch:/, 'expected workflow_dispatch trigger');
  assert.match(source, /^\s+ref:/m, 'expected ref input for manual deploy');
  assert.doesNotMatch(onBlock, /^\s+push:/m, 'push must not trigger production IONOS deploy');
  assert.doesNotMatch(source, /trigger-ionos-web-deploy/, 'must not reference path trigger file');
});

test('deploy-ionos-web.yml still uploads and verifies live stamps when run manually', () => {
  const source = fs.readFileSync(workflowPath, 'utf8');
  assert.match(source, /ionosUploadDist\.sh/, 'SFTP upload step preserved');
  assert.match(source, /Verify live www\.pantsonfire\.app build stamps/, 'post-deploy verification preserved');
  assert.match(source, /github\.event\.inputs\.ref/, 'checkout respects manual ref input');
});
