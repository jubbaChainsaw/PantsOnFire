/**
 * t220u — modular banter planning (pure)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  planLiarRevealPluralBanter,
  planPickerTurnBanter,
  wasBanterDedupPlayed,
} from '../../src/lib/modularHostBanterEngine.js';

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

test('plural liar reveal subtitle lists names; plan has prefix segment', (t) => {
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

  const round = { id: 'rid-plural', roundNumber: 2 };
  const liars = [
    { id: 'a', name: 'Sam', personaId: '' },
    { id: 'b', name: 'Jo', personaId: '' },
  ];
  const plan = planLiarRevealPluralBanter({
    themeName: 'Default',
    round,
    liars,
    personaOnlyMode: false,
  });
  assert.ok(plan);
  assert.match(plan.composedSubtitle, /Sam/);
  assert.match(plan.composedSubtitle, /Jo/);
  assert.deepEqual(plan.subtitleSegments, ['The liars are…', 'Sam, Jo']);
  assert.ok(plan.segments[0].line.includes('liars'));
  plan.onCommit();
  assert.equal(planLiarRevealPluralBanter({ themeName: 'Default', round, liars, personaOnlyMode: false }), null);
});
