import { useCallback, useEffect, useMemo, useState } from 'react';
import { CONTENT_PACK_MESSAGE, CONTENT_PACK_STORAGE_KEYS, DEFAULT_MANIFEST_URL } from '../lib/contentPacks/constants.js';
import { fetchPackDownloadGrant } from '../lib/contentPacks/downloadApi.js';
import { getLobbyApiBase } from '../lib/lobbyApiEnv.js';
import { isWebJoinOnlyMode } from '../lib/webPlayerMode.js';
import {
  filterDownloadablePacks,
  formatPackSize,
  isProtectedContentPack,
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

function isContentPackPromptDismissed() {
  try {
    const raw = localStorage.getItem(CONTENT_PACK_STORAGE_KEYS.promptDismissed);
    if (raw == null) return false;
    if (raw === 'true' || raw === 'false') return raw === 'true';
    return Boolean(JSON.parse(raw));
  } catch {
    return false;
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

export function useContentPacks({
  unlockedThemePackIds = [],
  accessToken = '',
  /** When true (e.g. home screen), open the first-run prompt once manifest + missing packs are known. */
  shouldAutoPrompt = false,
} = {}) {
  const webJoinOnly = isWebJoinOnlyMode();
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
      let parsed = parseContentPackManifest(json);
      if (!webJoinOnly) {
        try {
          const protectedRes = await fetch(`${getLobbyApiBase()}/content-packs/protected`, {
            cache: 'no-store',
          });
          if (protectedRes.ok) {
            const protectedJson = await protectedRes.json();
            const stubs = (protectedJson?.packs || []).map((entry) => ({
              id: entry.id,
              name: entry.name,
              kind: 'theme',
              entitlementPackId: entry.entitlementPackId,
              tier: 'paid',
              access: 'protected',
              version: '1.0.0',
              sizeBytes: 0,
              sha256: '',
            }));
            parsed = {
              ...parsed,
              packs: [...parsed.packs, ...stubs],
            };
          }
        } catch {
          /* offline — public free packs only */
        }
      }
      setManifest(parsed);
      setManifestError('');
    } catch (error) {
      setManifestError(String(error?.message || error));
    }
  }, [webJoinOnly]);

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
    if (isContentPackPromptDismissed() || missingPacks.length === 0) return;
    setPromptOpen(true);
  }, [missingPacks.length]);

  useEffect(() => {
    if (!shouldAutoPrompt || !manifest) return;
    maybeOpenPrompt();
  }, [shouldAutoPrompt, manifest, missingPacks.length, maybeOpenPrompt]);

  const dismissPrompt = useCallback(() => {
    setStored(CONTENT_PACK_STORAGE_KEYS.promptDismissed, true);
    setPromptOpen(false);
  }, []);

  const reopenPrompt = useCallback(() => {
    if (missingPacks.length === 0) return;
    setPromptOpen(true);
  }, [missingPacks.length]);

  const downloadPack = useCallback(
    async (pack) => {
      if (!manifest || !pack) return;
      if (webJoinOnly) {
        setDownloadByPackId((cur) => ({
          ...cur,
          [pack.id]: transitionPackDownload(cur[pack.id] || createInitialPackDownloadState(), {
            type: 'FAIL',
            error: 'downloads-disabled-web-join-only',
          }),
        }));
        return;
      }
      setDownloadByPackId((cur) => ({
        ...cur,
        [pack.id]: transitionPackDownload(createInitialPackDownloadState(), {
          type: 'START',
          packId: pack.id,
          bytesTotal: pack.sizeBytes,
        }),
      }));

      let downloadUrl = packDownloadUrl(manifest, pack);
      let resolvedPack = { ...pack };
      const needsApi = isProtectedContentPack(pack) || !downloadUrl;
      if (needsApi) {
        const token = String(accessToken || '').trim();
        if (!token) {
          setDownloadByPackId((cur) => ({
            ...cur,
            [pack.id]: transitionPackDownload(cur[pack.id] || createInitialPackDownloadState(), {
              type: 'FAIL',
              error: 'auth-required',
            }),
          }));
          return;
        }
        try {
          const grant = await fetchPackDownloadGrant(pack.id, token);
          downloadUrl = String(grant?.url || '').trim();
          resolvedPack = {
            ...pack,
            sizeBytes: grant?.sizeBytes || pack.sizeBytes,
            sha256: grant?.sha256 || pack.sha256,
            version: grant?.version || pack.version,
          };
          if (!downloadUrl) throw new Error('download-url-missing');
        } catch (error) {
          setDownloadByPackId((cur) => ({
            ...cur,
            [pack.id]: transitionPackDownload(cur[pack.id] || createInitialPackDownloadState(), {
              type: 'FAIL',
              error: String(error?.code || error?.message || error),
            }),
          }));
          return;
        }
      }

      if (isNativeContentPackBridgeAvailable()) {
        requestContentPackDownload(resolvedPack, manifest, { downloadUrl });
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
    [manifest, accessToken, webJoinOnly],
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
    reopenPrompt,
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
