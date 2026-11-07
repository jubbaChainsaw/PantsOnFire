import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compareWebBuild,
  isAtLeastBundled,
  pickAutoGameSource,
  shellGateAllowsLiveWeb,
} from '../../nativeShell/gameSourceSelection.js';

test('compareWebBuild prefers newer semver then stamp', () => {
  assert.ok(
    compareWebBuild(
      { webVersion: '0.1.2', webBuildStamp: '2-abc' },
      { webVersion: '0.1.1', webBuildStamp: '9-zzz' },
    ) > 0,
  );
});

test('never treats older live as compatible with bundled floor', () => {
  const bundled = { webVersion: '0.1.20', webBuildStamp: '20-deadbee' };
  const olderLive = { webVersion: '0.1.0', webBuildStamp: '1-oldlive' };
  assert.equal(isAtLeastBundled(olderLive, bundled), false);
});

test('auto picks live when newest and allowed', () => {
  const bundled = { webVersion: '0.1.20', webBuildStamp: '20-deadbee' };
  const live = { webVersion: '0.1.21', webBuildStamp: '21-newlive' };
  const pick = pickAutoGameSource({
    bundledMeta: bundled,
    cachedMeta: null,
    liveMeta: live,
    liveAllowed: true,
    cachedIndexExists: false,
  });
  assert.equal(pick.kind, 'live');
});

test('auto keeps bundled when live is older', () => {
  const bundled = { webVersion: '0.1.20', webBuildStamp: '20-deadbee' };
  const live = { webVersion: '0.1.0', webBuildStamp: '1-oldlive' };
  const pick = pickAutoGameSource({
    bundledMeta: bundled,
    cachedMeta: null,
    liveMeta: live,
    liveAllowed: true,
    cachedIndexExists: false,
  });
  assert.equal(pick.kind, 'bundled');
});

test('shell gate blocks live when min shell not met', () => {
  assert.equal(
    shellGateAllowsLiveWeb(
      { minNativeShell: '9.9.9', webVersion: '0.1.99', liveWebAllowed: true },
      '0.1.0',
    ),
    false,
  );
});
