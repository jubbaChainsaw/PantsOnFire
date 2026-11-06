/**
 * Commentary OFF: stops new host Audio play() (modular + parallel hook probe).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act, useState } from 'react';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import { HostCommentaryProvider, useHostCommentary } from '../../src/context/HostCommentaryContext.js';
import {
  useIanPosterHostVoicePlayback,
  useModularHostBanterQueue,
} from '../../src/lib/hostSpeechPlayback.js';
import { planLiarRevealSingularBanter } from '../../src/lib/modularHostBanterEngine.js';

let playCalls;
let pauseCalls;
let roots = [];

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
  });
}

test.beforeEach(() => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
  });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.sessionStorage = dom.window.sessionStorage;

  playCalls = [];
  pauseCalls = [];
  globalThis.Audio = class {
    constructor() {
      this.preload = '';
      this.src = '';
    }
    load() {}
    play() {
      playCalls.push(this);
      return Promise.resolve();
    }
    pause() {
      pauseCalls.push(this);
    }
    addEventListener() {}
    removeEventListener() {}
  };
});

test.afterEach(async () => {
  for (const r of roots) {
    await act(() => {
      r.unmount();
    });
  }
  roots = [];
});

function CommentaryHarness() {
  const { setHostCommentaryEnabled } = useHostCommentary();
  const [plan] = useState(() =>
    planLiarRevealSingularBanter({
      themeName: 'Default',
      round: { id: 'commentary-test-round', roundNumber: 1 },
      liar: { name: 'Pat', personaId: '', id: 'p1' },
      personaOnlyMode: false,
    }),
  );
  const { segmentIndex, segmentCount } = useModularHostBanterQueue({
    plan,
    themeName: 'Default',
    lineKeyPrefix: 'ct',
  });
  useIanPosterHostVoicePlayback({
    enabled: true,
    line: 'Discussion time!',
    lineKey: 'probe-sfx-line',
    themeName: 'Default',
    audioSrcCandidates: ['/assets/sfx/discussion-placeholder.mp3'],
    fallbackDurationMs: 5000,
  });
  return React.createElement(
    'div',
    null,
    React.createElement('span', { 'data-testid': 'banter-segment' }, `${segmentIndex}/${segmentCount}`),
    React.createElement(
      'button',
      {
        type: 'button',
        'data-testid': 'commentary-off',
        onClick: () => setHostCommentaryEnabled(false),
      },
      'mute',
    ),
  );
}

test('commentary off pauses active host Audio, clears modular queue, and blocks new play()', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);

  await act(() => {
    root.render(
      React.createElement(
        HostCommentaryProvider,
        null,
        React.createElement(CommentaryHarness, null),
      ),
    );
  });
  await flushMicrotasks();
  const before = playCalls.length;
  assert.ok(before >= 1, 'expected initial host playback');
  const pauseCountBeforeMute = pauseCalls.length;
  assert.match(
    container.querySelector('[data-testid="banter-segment"]').textContent,
    /^0\//,
    'modular queue should start at first segment',
  );

  await act(() => {
    container.querySelector('[data-testid="commentary-off"]').click();
  });
  await flushMicrotasks();
  assert.ok(
    pauseCalls.length > pauseCountBeforeMute,
    'mute must pause at least one active host Audio element',
  );
  assert.equal(
    container.querySelector('[data-testid="banter-segment"]').textContent,
    '0/2',
    'modular queue index must reset when commentary stops',
  );
  assert.equal(
    playCalls.length,
    before,
    'commentary off must not start additional host Audio',
  );
});
