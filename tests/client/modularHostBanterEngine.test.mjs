/**
 * t220u — modular banter planning (pure)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { planPickerTurnBanter, wasBanterDedupPlayed } from '../../src/lib/modularHostBanterEngine.js';

test('planPickerTurnBanter returns composed subtitle and commits dedup', (t) => {
  const prev = globalThis.sessionStorage;
  const s = new Map();
  globalThis.sessionStorage = {
    getItem: (k) => (s.has(k) ? s.get(k) : null),
    setItem: (k, v) => {
      s.set(k, v);
    },
  };
  t.after(() => {
    globalThis.sessionStorage = prev;
  });

  const round = { id: 'rid-1', roundNumber: 1, chooserId: 'p1' };
  const players = [{ id: 'p1', name: 'Alex', personaId: '' }];
  const plan = planPickerTurnBanter({
    themeName: 'Default',
    round,
    chooser: players[0],
    personaOnlyMode: false,
  });
  assert.ok(plan);
  assert.ok(plan.composedSubtitle.includes('Alex'));
  assert.equal(wasBanterDedupPlayed(plan.dedupKey), false);
  plan.onCommit();
  assert.equal(wasBanterDedupPlayed(plan.dedupKey), true);
  assert.equal(planPickerTurnBanter({ themeName: 'Default', round, chooser: players[0], personaOnlyMode: false }), null);
});
