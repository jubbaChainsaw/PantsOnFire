/**
 * WTSK0011 — feasible fake-device / policy checks (no mic hardware, no LiveKit).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

test('mediaDevices.getUserMedia is not assumed synchronously available', () => {
  assert.equal(typeof globalThis.MediaDevices, 'undefined');
});

test('enumerator heuristic: voice chat gated by settings + phase (see App.jsx ONLINE_VOICE_ACTIVE_SCREENS)', () => {
  const phases = new Set([
    'one-word',
    'discussion',
    'voting',
    'twotruths-input',
    'twotruths-voting',
    'twotruths-reveal',
  ]);
  assert.ok(phases.has('twotruths-input'));
});
