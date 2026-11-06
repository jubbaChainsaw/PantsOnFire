/**
 * Ambient host stings: skip during discussion / one-word when party mic is hot.
 * Modular + instructional host voice uses shouldPlayBundledHostBanter (always on).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldPlayAmbientBundledHostBanter,
  shouldPlayBundledHostBanter,
} from '../../src/lib/hostBanterPlaybackPolicy.js';

test('modular / instructional bundled host banter is never blocked by phase', () => {
  assert.equal(shouldPlayBundledHostBanter(), true);
});

test('online clients still allow ambient host sting on picker when not in voice-hot phase', () => {
  assert.equal(
    shouldPlayAmbientBundledHostBanter({
      onlineMode: true,
      screen: 'round-type-choice',
    }),
    true,
  );
});

test('all clients skip ambient host sting during discussion screen', () => {
  assert.equal(
    shouldPlayAmbientBundledHostBanter({
      onlineMode: true,
      screen: 'discussion',
    }),
    false,
  );
});

test('all clients skip ambient host sting when round.phase is one-word', () => {
  assert.equal(
    shouldPlayAmbientBundledHostBanter({
      onlineMode: true,
      screen: 'reveal',
      roundPhase: 'one-word',
    }),
    false,
  );
});

test('local play still allows ambient host sting on picker screen', () => {
  assert.equal(
    shouldPlayAmbientBundledHostBanter({
      onlineMode: false,
      onlineRole: 'offline',
      screen: 'round-type-choice',
    }),
    true,
  );
});
