import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  filterDownloadablePacks,
  formatPackSize,
  parseContentPackManifest,
  sumPackBytes,
} from '../../src/lib/contentPacks/manifest.js';

test('parseContentPackManifest accepts bundled manifest', () => {
  const raw = JSON.parse(
    readFileSync(new URL('../../public/content-packs/manifest.json', import.meta.url), 'utf8'),
  );
  const manifest = parseContentPackManifest(raw);
  assert.equal(manifest.version, 1);
  assert.ok(manifest.packs.length >= 4);
  assert.ok(manifest.baseUrl.includes('content-packs'));
});

test('filterDownloadablePacks hides paid packs without entitlement', () => {
  const packs = [
    {
      id: 'theme-free',
      name: 'Free',
      kind: 'theme',
      tier: 'free',
      version: '1',
      sizeBytes: 1,
      sha256: 'a'.repeat(64),
      file: 'a.zip',
    },
    {
      id: 'dlc-paid',
      name: 'Paid',
      kind: 'theme',
      tier: 'paid',
      entitlementPackId: 'ye-olde-baloney',
      version: '1',
      sizeBytes: 2,
      sha256: 'b'.repeat(64),
      file: 'b.zip',
    },
  ];
  const none = filterDownloadablePacks(packs, { unlockedPackIds: [] });
  assert.equal(none.length, 1);
  assert.equal(none[0].id, 'theme-free');
  const both = filterDownloadablePacks(packs, {
    unlockedPackIds: ['ye-olde-baloney'],
  });
  assert.equal(both.length, 2);
});

test('formatPackSize and sumPackBytes', () => {
  assert.match(formatPackSize(1536), /KB/);
  assert.equal(sumPackBytes([{ sizeBytes: 10 }, { sizeBytes: 5 }]), 15);
});
