/**
 * Commentary OFF gates host Ian Audio only; BGM and online party voice policy stay independent.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncMusicForScreen } from '../../src/lib/pofFx.js';
import { onlinePhaseAllowsPartyVoice } from '../../src/lib/onlineVoicePolicy.js';
import {
  shouldPlayAmbientBundledHostBanter,
  shouldPlayBundledHostBanter,
} from '../../src/lib/hostBanterPlaybackPolicy.js';
import { playGameSfx } from '../../src/lib/playGameSfx.js';
import { JSDOM } from 'jsdom';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('pofFx music sync and playGameSfx do not import host commentary context', () => {
  const pofFx = fs.readFileSync(path.join(repoRoot, 'src/lib/pofFx.js'), 'utf8');
  const imports = pofFx
    .split('\n')
    .filter((line) => line.trimStart().startsWith('import '))
    .join('\n');
  assert.doesNotMatch(imports, /HostCommentary/);
  const playGame = fs.readFileSync(path.join(repoRoot, 'src/lib/playGameSfx.js'), 'utf8');
  assert.doesNotMatch(
    playGame
      .split('\n')
      .filter((line) => line.trimStart().startsWith('import '))
      .join('\n'),
    /HostCommentary/,
  );
  assert.doesNotThrow(() => syncMusicForScreen('discussion'));
  assert.doesNotThrow(() => syncMusicForScreen('voting'));
});

test('ambient host banter off on discussion does not block party voice screens or instructional banter', () => {
  assert.equal(
    shouldPlayAmbientBundledHostBanter({ onlineMode: true, screen: 'discussion' }),
    false,
  );
  assert.equal(shouldPlayBundledHostBanter(), true);
  assert.equal(onlinePhaseAllowsPartyVoice(true, 'discussion'), true);
  assert.equal(onlinePhaseAllowsPartyVoice(true, 'one-word'), true);
  assert.equal(onlinePhaseAllowsPartyVoice(true, 'voting'), true);
});

test('commentary-off does not disable playGameSfx (player UI SFX path)', () => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  localStorage.setItem('pof-settings', JSON.stringify({ sfx: true, music: true }));
  let playCalls = 0;
  globalThis.Audio = class {
    play() {
      playCalls += 1;
      return Promise.resolve();
    }
  };
  assert.equal(playGameSfx('/assets/sfx/ui-tap.mp3'), true);
  assert.equal(playCalls, 1);
});
