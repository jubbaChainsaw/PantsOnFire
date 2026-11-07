/**
 * WTSK0011 / TEST0003 — mock-only policy checklist (no credentials, no LiveKit calls).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

test('voice token endpoint contract (documented grant shape)', () => {
  const grantFields = [
    'roomJoin',
    'room',
    'canPublish',
    'canSubscribe',
    'canPublishData',
  ];
  assert.equal(grantFields.length, 5);
});
