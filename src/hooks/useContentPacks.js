import { useCallback, useEffect, useMemo, useState } from 'react';
import { CONTENT_PACK_MESSAGE, CONTENT_PACK_STORAGE_KEYS, DEFAULT_MANIFEST_URL } from '../lib/contentPacks/constants.js';
import {
  filterDownloadablePacks,
  formatPackSize,
  packDownloadUrl,
  parseContentPackManifest,
  sumPackBytes,
} from '../lib/contentPacks/manifest.js';
import {
  aggregateDownloadProgress,
  createInitialPackDownloadState,
  transitionPackDownload,
} from '../lib/contentPacks/downloadStateMachine.js';
import {
  isNativeContentPackBridgeAvailable,
  requestContentPackCancel,
  requestContentPackDelete,
  requestContentPackDownload,
  requestInstalledContentPacks,
  subscribeContentPackNativeEvents,
} from '../lib/contentPacks/nativeBridge.js';
import { setContentPackInstallRegistry } from '../lib/contentPacks/resolveAsset.js';
function getStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

function buildSlugMap(packs) {
  const map = {};
  packs.forEach((pack) => {
    if (pack.themeSlug) map[pack.themeSlug] = pack.id;
  });
  return map;
}

export function useContentPacks({ unlockedThemePackIds = [] } = {}) {
  const [manifest, setManifest] = useState(null);
  const [manifestError, setManifestError] = useState('');
  const [installedPackIds, setInstalledPackIds] = useState([]);
  const [downloadByPackId, setDownloadByPackId] = useState({});
  const [promptOpen, setPromptOpen] = useState(false);
  const [batchActive, setBatchActive] = useState(false);

  const refreshManifest = useCallback(async () => {
    try {
      const res = await fetch(DEFAULT_MANIFEST_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`manifest-http-${res.status}`);
      const json = await res.json();
      setManifest(parseContentPackManifest(json));
      setManifestError('');
    } catch (error) {
      setManifestError(String(error?.message || error));
    }
  }, []);

  useEffect(() => {
    refreshManifest();
  }, [refreshManifest]);

  useEffect(() => {
    requestInstalledContentPacks();
    return subscribeContentPackNativeEvents((detail) => {
      if (detail.type === CONTENT_PACK_MESSAGE.LIST_RESULT) {
        const ids = Array.isArray(detail.installedPackIds) ? detail.installedPackIds : [];
        setInstalledPackIds(ids);
        if (manifest) {
          setContentPackInstallRegistry({
            installedIds: ids,
            slugToPackId: buildSlugMap(manifest.packs),
          });
        }
      }
      if (detail.type === CONTENT_PACK_MESSAGE.PROGRESS && detail.packId) {
        setDownloadByPackId((cur) => ({
          ...cur,
          [detail.packId]: transitionPackDownload(
            cur[detail.packId] || createInitialPackDownloadState(),
            {
              type: 'PROGRESS',
              bytesLoaded: detail.bytesLoaded,
              bytesTotal: detail.bytesTotal,
            },
          ),
        }));
      }
      if (detail.type === CONTENT_PACK_MESSAGE.STATE && detail.packId) {
        const status = detail.status === 'installed' ? 'installed' : 'verifying';
        setDownloadByPackId((cur) => ({
          ...cur,
          [detail.packId]: transitionPackDownload(cur[detail.packId] || createInitialPackDownloadState(), {
            type: status === 'installed' ? 'COMPLETE' : 'VERIFY',
            packId: detail.packId,
          }),
        }));
        if (status === 'installed') {
          setInstalledPackIds((prev) => [...new Set([...prev, detail.packId])]);
        }
      }
      if (detail.type === CONTENT_PACK_MESSAGE.ERROR && detail.packId) {
        setDownloadByPackId((cur) => ({
          ...cur,
          [detail.packId]: transitionPackDownload(cur[detail.packId] || createInitialPackDownloadState(), {
            type: 'FAIL',
            error: detail.error,
          }),
        }));
      }
    });
  }, [manifest]);

  useEffect(() => {
    if (!manifest) return;
    setContentPackInstallRegistry({
      installedIds: installedPackIds,
      slugToPackId: buildSlugMap(manifest.packs),
    });
  }, [manifest, installedPackIds]);

  const downloadablePacks = useMemo(() => {
    if (!manifest) return [];
    return filterDownloadablePacks(manifest.packs, { unlockedPackIds: unlockedThemePackIds });
  }, [manifest, unlockedThemePackIds]);

  const missingPacks = useMemo(
    () => downloadablePacks.filter((pack) => !installedPackIds.includes(pack.id)),
    [downloadablePacks, installedPackIds],
  );

  const totalMissingBytes = useMemo(() => sumPackBytes(missingPacks), [missingPacks]);

  const progress = useMemo(
    () => aggregateDownloadProgress(downloadByPackId),
    [downloadByPackId],
  );

  const maybeOpenPrompt = useCallback(() => {
    const dismissed = Boolean(getStored(CONTENT_PACK_STORAGE_KEYS.promptDismissed, false));
    if (dismissed || missingPacks.length === 0) return;
    setPromptOpen(true);
  }, [missingPacks.length]);

  const dismissPrompt = useCallback(() => {
    setStored(CONTENT_PACK_STORAGE_KEYS.promptDismissed, true);
    setPromptOpen(false);
  }, []);

  const downloadPack = useCallback(
    (pack) => {
      if (!manifest || !pack) return;
      setDownloadByPackId((cur) => ({
        ...cur,
        [pack.id]: transitionPackDownload(createInitialPackDownloadState(), {
          type: 'START',
          packId: pack.id,
          bytesTotal: pack.sizeBytes,
        }),
      }));
      if (isNativeContentPackBridgeAvailable()) {
        requestContentPackDownload(pack, manifest);
        return;
      }
      setDownloadByPackId((cur) => ({
        ...cur,
        [pack.id]: transitionPackDownload(cur[pack.id], {
          type: 'FAIL',
          error: 'native-bridge-unavailable',
        }),
      }));
    },
    [manifest],
  );

  const downloadAllMissing = useCallback(async () => {
    setBatchActive(true);
    for (const pack of missingPacks) {
      downloadPack(pack);
      // Native serializes one at a time in handler; web shows errors per pack.
      await new Promise((r) => setTimeout(r, 0));
    }
    setBatchActive(false);
  }, [missingPacks, downloadPack]);

  const retryPack = useCallback(
    (pack) => {
      if (!pack) return;
      setDownloadByPackId((cur) => ({
        ...cur,
        [pack.id]: transitionPackDownload(cur[pack.id] || createInitialPackDownloadState(), {
          type: 'RETRY',
        }),
      }));
      downloadPack(pack);
    },
    [downloadPack],
  );

  const deletePack = useCallback((packId) => {
    requestContentPackDelete(packId);
    setInstalledPackIds((prev) => prev.filter((id) => id !== packId));
    setDownloadByPackId((cur) => {
      const next = { ...cur };
      delete next[packId];
      return next;
    });
  }, []);

  const cancelPack = useCallback((packId) => {
    requestContentPackCancel(packId);
    setDownloadByPackId((cur) => ({
      ...cur,
      [packId]: transitionPackDownload(cur[packId] || createInitialPackDownloadState(), {
        type: 'PAUSE',
      }),
    }));
  }, []);

  return {
    manifest,
    manifestError,
    downloadablePacks,
    missingPacks,
    installedPackIds,
    totalMissingBytes,
    totalMissingLabel: formatPackSize(totalMissingBytes),
    downloadByPackId,
    progress,
    promptOpen,
    setPromptOpen,
    maybeOpenPrompt,
    dismissPrompt,
    downloadPack,
    downloadAllMissing,
    retryPack,
    deletePack,
    cancelPack,
    batchActive,
    packDownloadUrl: (pack) => (manifest ? packDownloadUrl(manifest, pack) : ''),
    refreshManifest,
    isNativeBridge: isNativeContentPackBridgeAvailable(),
  };
}
