import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const workflowPath = path.join(repoRoot, '.github/workflows/e2e-playwright.yml');

function extractOnBlock(source) {
  const match = source.match(/^on:\n([\s\S]*?)(?=^concurrency:|^jobs:|$)/m);
  assert.ok(match, 'e2e-playwright.yml must declare on:');
  return match[1];
}

test('e2e-playwright.yml uses path filters, concurrency, and bounded job timeout', () => {
  const source = fs.readFileSync(workflowPath, 'utf8');
  const onBlock = extractOnBlock(source);
  assert.match(onBlock, /pull_request:/);
  assert.match(source, /pull_request:[\s\S]*?\n\s+paths:/);
  assert.match(source, /concurrency:/);
  assert.match(source, /cancel-in-progress:\s*true/);
  assert.match(source, /timeout-minutes:\s*28/);
  assert.doesNotMatch(onBlock, /workflow_dispatch:/, 'E2E must not be manually deploy-like');
  assert.doesNotMatch(source, /deploy-ionos|IONOS_SFTP|trigger-ionos/);
});

test('e2e-playwright.yml does not touch android or release workflows', () => {
  const source = fs.readFileSync(workflowPath, 'utf8');
  assert.doesNotMatch(source, /android-debug-apk|android-release/);
  assert.match(source, /npm run test:e2e/);
});
