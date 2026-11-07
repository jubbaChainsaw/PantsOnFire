/**
 * t221u — per-device host commentary persistence
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadHostCommentaryEnabled,
  saveHostCommentaryEnabled,
} from '../../src/lib/hostCommentarySettings.js';

test('host commentary defaults on when storage empty', () => {
  const prev = globalThis.localStorage;
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => {
      store.set(k, v);
    },
  };
  try {
    assert.equal(loadHostCommentaryEnabled(), true);
  } finally {
    globalThis.localStorage = prev;
  }
});

test('save and load host commentary off', () => {
  const prev = globalThis.localStorage;
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => {
      store.set(k, v);
    },
  };
  try {
    saveHostCommentaryEnabled(false);
    assert.equal(loadHostCommentaryEnabled(), false);
    saveHostCommentaryEnabled(true);
    assert.equal(loadHostCommentaryEnabled(), true);
  } finally {
    globalThis.localStorage = prev;
  }
});
