import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  aggregateDownloadProgress,
  createInitialPackDownloadState,
  transitionPackDownload,
} from '../../src/lib/contentPacks/downloadStateMachine.js';

test('download state machine progresses and retries', () => {
  let state = createInitialPackDownloadState();
  state = transitionPackDownload(state, {
    type: 'START',
    packId: 'theme-pirates',
    bytesTotal: 1000,
  });
  assert.equal(state.status, 'downloading');
  state = transitionPackDownload(state, {
    type: 'PROGRESS',
    bytesLoaded: 250,
    bytesTotal: 1000,
  });
  assert.equal(state.bytesLoaded, 250);
  state = transitionPackDownload(state, { type: 'VERIFY' });
  assert.equal(state.status, 'verifying');
  state = transitionPackDownload(state, { type: 'COMPLETE' });
  assert.equal(state.status, 'installed');
  state = transitionPackDownload(state, { type: 'FAIL', error: 'network' });
  assert.equal(state.status, 'error');
  state = transitionPackDownload(state, { type: 'RETRY' });
  assert.equal(state.status, 'downloading');
});

test('aggregateDownloadProgress sums active rows', () => {
  const agg = aggregateDownloadProgress({
    a: {
      status: 'downloading',
      bytesLoaded: 50,
      bytesTotal: 100,
    },
    b: {
      status: 'downloading',
      bytesLoaded: 25,
      bytesTotal: 100,
    },
  });
  assert.equal(agg.total, 200);
  assert.equal(agg.loaded, 75);
  assert.equal(agg.percent, 38);
  assert.equal(agg.anyActive, true);
});
