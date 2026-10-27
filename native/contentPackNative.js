import * as FileSystem from 'expo-file-system';
import { unzipSync } from 'fflate';
import { Platform } from 'react-native';
const CONTENT_PACK_MESSAGE = {
  LIST: 'POF_CONTENT_PACK_LIST',
  LIST_RESULT: 'POF_CONTENT_PACK_LIST_RESULT',
  DOWNLOAD: 'POF_CONTENT_PACK_DOWNLOAD',
  CANCEL: 'POF_CONTENT_PACK_CANCEL',
  DELETE: 'POF_CONTENT_PACK_DELETE',
  PROGRESS: 'POF_CONTENT_PACK_PROGRESS',
  STATE: 'POF_CONTENT_PACK_STATE',
  ERROR: 'POF_CONTENT_PACK_ERROR',
};

const ROOT_DIR = `${FileSystem.documentDirectory}pof-content-packs`;
const META_FILE = `${ROOT_DIR}/installed.json`;

/** @type {Map<string, { cancel?: () => void }>} */
const activeDownloads = new Map();

/** @type {Array<{ pack: object, baseUrl: string }>} */
const downloadQueue = [];
let queueRunning = false;

async function runDownloadQueue(webViewRef) {
  if (queueRunning) return;
  queueRunning = true;
  while (downloadQueue.length) {
    const job = downloadQueue.shift();
    if (!job) break;
    await downloadPack(webViewRef, job.pack, job.baseUrl);
  }
  queueRunning = false;
}

async function ensureRootDir() {
  const info = await FileSystem.getInfoAsync(ROOT_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(ROOT_DIR, { intermediates: true });
  }
}

async function readInstalledMeta() {
  try {
    const info = await FileSystem.getInfoAsync(META_FILE);
    if (!info.exists) return { packs: {} };
    const raw = await FileSystem.readAsStringAsync(META_FILE);
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : { packs: {} };
  } catch {
    return { packs: {} };
  }
}

async function writeInstalledMeta(meta) {
  await ensureRootDir();
  await FileSystem.writeAsStringAsync(META_FILE, JSON.stringify(meta));
}

function injectEvent(webViewRef, detail) {
  if (!webViewRef?.current) return;
  const payload = JSON.stringify(detail || {}).replace(/</g, '\\u003c');
  webViewRef.current.injectJavaScript(
    `(function(){window.dispatchEvent(new CustomEvent('pof-content-pack-native',{detail:${payload}}));})();true;`,
  );
}

function base64ToUint8Array(base64) {
  const atobFn = global.atob;
  if (!atobFn) throw new Error('atob-unavailable');
  const binary = atobFn(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function sha256Hex(bytes) {
  if (global.crypto?.subtle?.digest) {
    const hash = await global.crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return '';
}

async function extractZipToPackDir(packId, zipBytes, expectedSha256) {
  if (expectedSha256) {
    const actual = await sha256Hex(zipBytes);
    if (actual && actual !== expectedSha256.toLowerCase()) {
      throw new Error('sha256-mismatch');
    }
  }
  const entries = unzipSync(zipBytes);
  const packDir = `${ROOT_DIR}/${packId}`;
  await FileSystem.deleteAsync(packDir, { idempotent: true });
  await FileSystem.makeDirectoryAsync(packDir, { intermediates: true });
  const writes = Object.entries(entries).map(async ([relPath, data]) => {
    if (!data || !data.length) return;
    const target = `${packDir}/${relPath}`;
    const parent = target.replace(/\/[^/]+$/, '');
    await FileSystem.makeDirectoryAsync(parent, { intermediates: true });
    let binary = '';
    for (let i = 0; i < data.length; i += 1) binary += String.fromCharCode(data[i]);
    const base64 = global.btoa(binary);
    await FileSystem.writeAsStringAsync(target, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  });
  await Promise.all(writes);
}

export async function listInstalledContentPacks(webViewRef) {
  const meta = await readInstalledMeta();
  const packIds = Object.keys(meta.packs || {});
  injectEvent(webViewRef, {
    type: CONTENT_PACK_MESSAGE.LIST_RESULT,
    installedPackIds: packIds,
    packs: meta.packs,
  });
}

async function downloadPack(webViewRef, pack, baseUrl) {
  if (!pack?.id || Platform.OS !== 'android') {
    injectEvent(webViewRef, {
      type: CONTENT_PACK_MESSAGE.ERROR,
      packId: pack?.id,
      error: 'unsupported-platform',
    });
    return;
  }
  await ensureRootDir();
  const file = String(pack.file || '').replace(/^\//, '');
  const url = `${String(baseUrl || '').replace(/\/?$/, '/')}${file}`;
  const zipPath = `${ROOT_DIR}/${pack.id}.zip.partial`;
  const packId = pack.id;

  const progress = (bytesLoaded, bytesTotal) => {
    injectEvent(webViewRef, {
      type: CONTENT_PACK_MESSAGE.PROGRESS,
      packId,
      bytesLoaded,
      bytesTotal: bytesTotal || pack.sizeBytes || 0,
    });
  };

  try {
    const callback = (downloadProgress) => {
      progress(
        downloadProgress.totalBytesWritten,
        downloadProgress.totalBytesExpectedToWrite,
      );
    };
    const resumable = FileSystem.createDownloadResumable(
      url,
      zipPath,
      {},
      callback,
    );
    activeDownloads.set(packId, {
      cancel: () => {
        resumable.pauseAsync().catch(() => {});
      },
    });
    const result = await resumable.downloadAsync();
    activeDownloads.delete(packId);
    if (!result?.uri) throw new Error('download-empty');

    const base64 = await FileSystem.readAsStringAsync(result.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const zipBytes = base64ToUint8Array(base64);
    injectEvent(webViewRef, {
      type: CONTENT_PACK_MESSAGE.STATE,
      packId,
      status: 'verifying',
    });
    await extractZipToPackDir(packId, zipBytes, pack.sha256);
    await FileSystem.deleteAsync(result.uri, { idempotent: true });

    const meta = await readInstalledMeta();
    meta.packs = meta.packs || {};
    meta.packs[packId] = {
      version: pack.version,
      installedAt: Date.now(),
      themeSlug: pack.themeSlug || null,
    };
    await writeInstalledMeta(meta);
    injectEvent(webViewRef, {
      type: CONTENT_PACK_MESSAGE.STATE,
      packId,
      status: 'installed',
    });
    await listInstalledContentPacks(webViewRef);
  } catch (error) {
    activeDownloads.delete(packId);
    injectEvent(webViewRef, {
      type: CONTENT_PACK_MESSAGE.ERROR,
      packId,
      error: String(error?.message || error),
    });
  }
}

export async function deleteContentPack(webViewRef, packId) {
  if (!packId) return;
  const packDir = `${ROOT_DIR}/${packId}`;
  await FileSystem.deleteAsync(packDir, { idempotent: true });
  const meta = await readInstalledMeta();
  if (meta.packs?.[packId]) {
    delete meta.packs[packId];
    await writeInstalledMeta(meta);
  }
  await listInstalledContentPacks(webViewRef);
}

export function handleContentPackWebMessage(webViewRef, msg) {
  if (!msg?.type) return;
  switch (msg.type) {
    case CONTENT_PACK_MESSAGE.LIST:
      listInstalledContentPacks(webViewRef).catch(() => {});
      break;
    case CONTENT_PACK_MESSAGE.DOWNLOAD:
      downloadQueue.push({ pack: msg.pack, baseUrl: msg.baseUrl });
      runDownloadQueue(webViewRef).catch(() => {});
      break;
    case CONTENT_PACK_MESSAGE.CANCEL:
      activeDownloads.get(msg.packId)?.cancel?.();
      activeDownloads.delete(msg.packId);
      break;
    case CONTENT_PACK_MESSAGE.DELETE:
      deleteContentPack(webViewRef, msg.packId).catch(() => {});
      break;
    default:
      break;
  }
}
