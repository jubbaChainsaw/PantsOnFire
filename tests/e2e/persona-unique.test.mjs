import test from 'node:test';
import assert from 'node:assert/strict';
import { pickRandomThemePersona } from '../../src/data/themePersonas.js';

test('pickRandomThemePersona avoids duplicate names when pool allows', () => {
  const used = new Set();
  for (let i = 0; i < 15; i += 1) {
    const persona = pickRandomThemePersona('Default', [...used]);
    if (!persona) break;
    assert.ok(!used.has(persona.name));
    used.add(persona.name);
  }
  assert.ok(used.size >= 10, 'expected many unique draws from Default pool');
});

test('pickRandomThemePersona returns null when all names excluded', () => {
  const pool = [];
  for (let i = 0; i < 50; i += 1) {
    const p = pickRandomThemePersona('Default', pool.map((x) => x.name));
    if (!p) break;
    pool.push(p);
  }
  const next = pickRandomThemePersona(
    'Default',
    pool.map((p) => p.name),
  );
  assert.equal(next, null);
});
