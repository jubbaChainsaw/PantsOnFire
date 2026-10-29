import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAltCardUnlockKeys,
  grantAltCardUnlockForTheme,
} from '../../server/altCardUnlockService.js';

test('grantAltCardUnlockForTheme adds canonical theme keys idempotently', async () => {
  const store = new Map();
  const userId = 'user-alt-1';
  const first = await grantAltCardUnlockForTheme(store, userId, 'Fever Dream Vol. 1');
  assert.equal(first.newlyUnlocked, true);
  assert.ok(first.unlockedThemeKeys.includes('Fever Dream Vol. 1'));
  const second = await grantAltCardUnlockForTheme(store, userId, 'Fever Dream Vol. 1');
  assert.equal(second.newlyUnlocked, false);
  const keys = await getAltCardUnlockKeys(store, userId);
  assert.deepEqual(keys, first.unlockedThemeKeys);
});
