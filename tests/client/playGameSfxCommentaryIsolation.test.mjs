/**
 * Game SFX and ambient host banter policy: commentary OFF must not gate playGameSfx.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { playGameSfx } from '../../src/lib/playGameSfx.js';
import {
  shouldPlayAmbientBundledHostBanter,
  shouldPlayBundledHostBanter,
} from '../../src/lib/hostBanterPlaybackPolicy.js';

let playCalls;

test.beforeEach(() => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  playCalls = [];
  globalThis.Audio = class {
    constructor() {
      this.volume = 1;
      this.src = '';
    }
    play() {
      playCalls.push(this);
      return Promise.resolve();
    }
  };
  localStorage.removeItem('imposter-audio-settings-v1');
  localStorage.setItem('pof-settings', JSON.stringify({ sfx: true, sfxVol: 80, music: true }));
});

test('playGameSfx plays when sfx enabled regardless of discussion / one-word ambient policy', () => {
  assert.equal(shouldPlayBundledHostBanter(), true);
  assert.equal(
    shouldPlayAmbientBundledHostBanter({ onlineMode: false, screen: 'discussion' }),
    false,
  );
  assert.equal(
    shouldPlayAmbientBundledHostBanter({
      onlineMode: false,
      screen: 'reveal',
      roundPhase: 'one-word',
    }),
    false,
  );

  const ok = playGameSfx('/assets/sfx/test-tap.mp3', { volume: 0.5 });
  assert.equal(ok, true);
  assert.equal(playCalls.length, 1);
  assert.ok(playCalls[0].volume > 0);
});

test('playGameSfx is a no-op when sfx toggle is off', () => {
  localStorage.setItem('pof-settings', JSON.stringify({ sfx: false, sfxVol: 80, music: true }));
  const ok = playGameSfx('/assets/sfx/test-tap.mp3');
  assert.equal(ok, false);
  assert.equal(playCalls.length, 0);
});
