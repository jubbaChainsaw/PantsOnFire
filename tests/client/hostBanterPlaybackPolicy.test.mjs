/**
 * Online bundled host banter: host-only + no overlap with discussion/one-word party voice phases.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldPlayBundledHostBanter } from '../../src/lib/hostBanterPlaybackPolicy.js';

test('online clients still allow banter on picker when not in voice-hot phase', () => {
  assert.equal(
    shouldPlayBundledHostBanter({
      onlineMode: true,
      screen: 'round-type-choice',
    }),
    true,
  );
});

test('all clients skip banter during discussion screen', () => {
  assert.equal(
    shouldPlayBundledHostBanter({
      onlineMode: true,
      screen: 'discussion',
    }),
    false,
  );
});

test('all clients skip banter when round.phase is one-word', () => {
  assert.equal(
    shouldPlayBundledHostBanter({
      onlineMode: true,
      screen: 'reveal',
      roundPhase: 'one-word',
    }),
    false,
  );
});

test('local play still allows banter on picker screen', () => {
  assert.equal(
    shouldPlayBundledHostBanter({
      onlineMode: false,
      onlineRole: 'offline',
      screen: 'round-type-choice',
    }),
    true,
  );
});
