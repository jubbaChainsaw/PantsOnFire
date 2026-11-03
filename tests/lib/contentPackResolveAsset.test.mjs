import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  resolveBundledAssetSrc,
  setContentPackInstallRegistry,
} from '../../src/lib/contentPacks/resolveAsset.js';

test('resolveBundledAssetSrc maps installed theme assets to /dlc/ URLs', () => {
  setContentPackInstallRegistry({
    installedIds: ['theme-murder-mystery'],
    slugToPackId: { 'murder-mystery': 'theme-murder-mystery' },
  });
  const url = resolveBundledAssetSrc('/assets/themes/murder-mystery/hosts/persona-host-idle.png');
  assert.match(url, /appassets\.androidplatform\.net\/dlc\/theme-murder-mystery\//);
  assert.match(url, /murder-mystery\/hosts\/persona-host-idle\.png/);
  setContentPackInstallRegistry({ installedIds: [], slugToPackId: {} });
});
