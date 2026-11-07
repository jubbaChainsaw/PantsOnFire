import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const lobbyServerPath = path.join(repoRoot, 'server/lobbyServer.js');

test('POF_E2E_LOBBY only relaxes limits when env is exactly "1"', () => {
  const source = fs.readFileSync(lobbyServerPath, 'utf8');
  assert.match(
    source,
    /POF_E2E_LOBBY[\s\S]*?===\s*'1'/,
    'E2E flag must be strict string match',
  );
  assert.match(source, /rateMax\(10,\s*80\)/);
  assert.match(source, /rateMax\(20,\s*240\)/);
  assert.doesNotMatch(
    source,
    /joinLobbyLimiter[\s\S]*?max:\s*240(?![\s\S]*rateMax)/,
    'production join max must go through rateMax',
  );
});

test('Playwright boot enables POF_E2E_LOBBY on lobby process only', () => {
  const cfg = fs.readFileSync(path.join(repoRoot, 'playwright.config.js'), 'utf8');
  assert.match(cfg, /POF_E2E_LOBBY=1/);
  assert.doesNotMatch(cfg, /POF_E2E_LOBBY=1[\s\S]*npm run dev/);
});
