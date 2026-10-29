import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Purchases from 'react-native-purchases';
import * as FileSystem from 'expo-file-system/legacy';
import { unzip } from 'fflate';
import Constants from 'expo-constants';

const DEFAULT_WEB_URL = Platform.select({
  android: 'http://10.0.2.2:5173',
  ios: 'http://localhost:5173',
  default: 'http://localhost:5173',
});

const BUNDLED_ANDROID_GAME_URI = 'file:///android_asset/pof-web/index.html';
const PRODUCTION_GAME_URL =
  String(process.env.EXPO_PUBLIC_PRODUCTION_GAME_URL || '').trim() ||
  'https://www.pantsonfire.app/';
const SHELL_VERSION =
  String(process.env.EXPO_PUBLIC_SHELL_VERSION || Constants.expoConfig?.version || '0.1.0').trim();

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

const PACKS_ROOT = `${FileSystem.documentDirectory}pof-content-packs/`;

function base64ToUint8Array(b64) {
  const binary = global.atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function uint8ToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return global.btoa(binary);
}

/** CI / release APKs load bundled assets, not the dev server. */
const useBundledAndroidWeb =
  Platform.OS === 'android' &&
  (Boolean(process.env.EXPO_PUBLIC_GAME_URL) ||
    process.env.EXPO_PUBLIC_USE_BUNDLED_WEB === '1' ||
    !__DEV__);

const configuredGameUrl = process.env.EXPO_PUBLIC_GAME_URL || null;

function compareSemver(a = '', b = '') {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}

async function resolveAndroidGameUrl() {
  if (configuredGameUrl) return configuredGameUrl;
  if (!useBundledAndroidWeb) return DEFAULT_WEB_URL;
  if (__DEV__) return DEFAULT_WEB_URL;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(`${PRODUCTION_GAME_URL.replace(/\/$/, '')}/shell-version.json`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const json = await res.json();
      const minShell = String(json?.minNativeShell || json?.minShell || '').trim();
      if (!minShell || compareSemver(SHELL_VERSION, minShell) >= 0) {
        return PRODUCTION_GAME_URL;
      }
    }
  } catch {
    /* offline or incompatible — fall back to bundled web */
  }
  return BUNDLED_ANDROID_GAME_URI;
}

async function ensureMicPermission() {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
  if (granted) return true;
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
    title: 'Microphone access',
    message: 'Pants on Fire uses your microphone for online lobby voice chat (LiveKit).',
    buttonPositive: 'Allow',
    buttonNegative: 'Deny',
  });
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

function injectNativeContentPackEvent(webViewRef, detail) {
  const payload = JSON.stringify(detail || {});
  webViewRef.current?.injectJavaScript(
    `(function(){try{window.dispatchEvent(new CustomEvent('pof-content-pack-native',{detail:${payload}}));}catch(e){}})();true;`,
  );
}

async function listInstalledPackIds() {
  const ids = [];
  try {
    const entries = await FileSystem.readDirectoryAsync(PACKS_ROOT);
    for (const entry of entries) {
      const metaPath = `${PACKS_ROOT}${entry}/pack-meta.json`;
      const info = await FileSystem.getInfoAsync(metaPath);
      if (info.exists) ids.push(entry);
    }
  } catch {
    /* empty */
  }
  return ids;
}

async function writeUnzippedPack(packId, zipBytes, onProgress) {
  const tempZip = `${FileSystem.cacheDirectory}pof-pack-${packId}.zip`;
  const stagingDir = `${FileSystem.cacheDirectory}pof-pack-stage-${packId}/`;
  const finalDir = `${PACKS_ROOT}${packId}/`;

  await FileSystem.deleteAsync(stagingDir, { idempotent: true });
  await FileSystem.deleteAsync(finalDir, { idempotent: true });
  await FileSystem.makeDirectoryAsync(stagingDir, { intermediates: true });
  await FileSystem.makeDirectoryAsync(PACKS_ROOT, { intermediates: true });

  const files = await new Promise((resolve, reject) => {
    unzip(zipBytes, (error, data) => {
      if (error) reject(error);
      else resolve(data);
    });
  });

  const names = Object.keys(files);
  let written = 0;
  for (const name of names) {
    if (name.endsWith('/')) continue;
    const target = `${stagingDir}${name}`;
    const slash = target.lastIndexOf('/');
    if (slash > 0) {
      await FileSystem.makeDirectoryAsync(target.slice(0, slash), { intermediates: true });
    }
    const b64 = uint8ToBase64(files[name]);
    await FileSystem.writeAsStringAsync(target, b64, { encoding: FileSystem.EncodingType.Base64 });
    written += 1;
    if (onProgress && names.length > 0) {
      onProgress(written, names.length);
    }
  }

  await FileSystem.moveAsync({ from: stagingDir, to: finalDir });
  await FileSystem.deleteAsync(tempZip, { idempotent: true });
}

const activeDownloads = new Map();

async function handleContentPackMessage(webViewRef, msg) {
  if (Platform.OS !== 'android') return;

  if (msg.type === CONTENT_PACK_MESSAGE.LIST) {
    const installedPackIds = await listInstalledPackIds();
    injectNativeContentPackEvent(webViewRef, {
      type: CONTENT_PACK_MESSAGE.LIST_RESULT,
      installedPackIds,
    });
    return;
  }

  if (msg.type === CONTENT_PACK_MESSAGE.DELETE) {
    const packId = String(msg.packId || '').trim();
    if (!packId) return;
    await FileSystem.deleteAsync(`${PACKS_ROOT}${packId}/`, { idempotent: true });
    const installedPackIds = await listInstalledPackIds();
    injectNativeContentPackEvent(webViewRef, {
      type: CONTENT_PACK_MESSAGE.LIST_RESULT,
      installedPackIds,
    });
    return;
  }

  if (msg.type === CONTENT_PACK_MESSAGE.CANCEL) {
    const packId = String(msg.packId || '').trim();
    const job = activeDownloads.get(packId);
    if (job?.cancel) job.cancel();
    activeDownloads.delete(packId);
    return;
  }

  if (msg.type === CONTENT_PACK_MESSAGE.DOWNLOAD) {
    const pack = msg.pack || {};
    const packId = String(pack.id || '').trim();
    const baseUrl = String(msg.baseUrl || pack.baseUrl || '').trim();
    const file = String(pack.file || '').trim();
    if (!packId || !baseUrl || !file) {
      injectNativeContentPackEvent(webViewRef, {
        type: CONTENT_PACK_MESSAGE.ERROR,
        packId,
        error: 'download-params-missing',
      });
      return;
    }

    if (activeDownloads.has(packId)) return;
    let cancelled = false;
    activeDownloads.set(packId, {
      cancel: () => {
        cancelled = true;
      },
    });

    const url = `${baseUrl.replace(/\/?$/, '/')}${file.replace(/^\//, '')}`;
    try {
      injectNativeContentPackEvent(webViewRef, {
        type: CONTENT_PACK_MESSAGE.PROGRESS,
        packId,
        bytesLoaded: 0,
        bytesTotal: Number(pack.sizeBytes) || 0,
      });

      const download = FileSystem.createDownloadResumable(url, `${FileSystem.cacheDirectory}${packId}.zip`, {}, (progress) => {
        if (cancelled) return;
        injectNativeContentPackEvent(webViewRef, {
          type: CONTENT_PACK_MESSAGE.PROGRESS,
          packId,
          bytesLoaded: progress.totalBytesWritten,
          bytesTotal: progress.totalBytesExpectedToWrite || Number(pack.sizeBytes) || 0,
        });
      });
      const result = await download.downloadAsync();
      if (cancelled || !result?.uri) throw new Error('download-cancelled');

      injectNativeContentPackEvent(webViewRef, {
        type: CONTENT_PACK_MESSAGE.STATE,
        packId,
        status: 'verifying',
      });

      const b64 = await FileSystem.readAsStringAsync(result.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const zipBytes = base64ToUint8Array(b64);
      await writeUnzippedPack(packId, zipBytes, (loaded, total) => {
        injectNativeContentPackEvent(webViewRef, {
          type: CONTENT_PACK_MESSAGE.PROGRESS,
          packId,
          bytesLoaded: loaded,
          bytesTotal: total,
        });
      });

      await FileSystem.writeAsStringAsync(
        `${PACKS_ROOT}${packId}/pack-meta.json`,
        JSON.stringify({
          packId,
          version: pack.version || '1.0.0',
          sha256: pack.sha256 || '',
          installedAt: new Date().toISOString(),
        }),
      );

      injectNativeContentPackEvent(webViewRef, {
        type: CONTENT_PACK_MESSAGE.STATE,
        packId,
        status: 'installed',
      });
      injectNativeContentPackEvent(webViewRef, {
        type: CONTENT_PACK_MESSAGE.LIST_RESULT,
        installedPackIds: await listInstalledPackIds(),
      });
    } catch (error) {
      injectNativeContentPackEvent(webViewRef, {
        type: CONTENT_PACK_MESSAGE.ERROR,
        packId,
        error: String(error?.message || error),
      });
      await FileSystem.deleteAsync(`${PACKS_ROOT}${packId}/`, { idempotent: true });
    } finally {
      activeDownloads.delete(packId);
    }
  }
}

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

export default function App() {
  const webViewRef = useRef(null);
  const [gameUrl, setGameUrl] = useState(
    () => configuredGameUrl || (useBundledAndroidWeb ? BUNDLED_ANDROID_GAME_URI : DEFAULT_WEB_URL),
  );
  const [urlReady, setUrlReady] = useState(() => Boolean(configuredGameUrl) || !useBundledAndroidWeb);

  useEffect(() => {
    const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
    if (!apiKey) return undefined;
    try {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN);
      Purchases.configure({ apiKey });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[Purchases] configure failed', error);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (configuredGameUrl) return undefined;
    let mounted = true;
    (async () => {
      await ensureMicPermission();
      const resolved = await resolveAndroidGameUrl();
      if (!mounted) return;
      setGameUrl(resolved);
      setUrlReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onWebMessage = useCallback((event) => {
    try {
      const msg = JSON.parse(String(event?.nativeEvent?.data || '{}'));
      if (msg.type === 'POF_SET_USER' && msg.userId) {
        Purchases.logIn(String(msg.userId)).catch(() => {});
      }
      if (msg.type === 'POF_REFRESH_ENTITLEMENTS') {
        Purchases.syncPurchases().catch(() => {});
      }
      if (String(msg.type || '').startsWith('POF_CONTENT_PACK_')) {
        void handleContentPackMessage(webViewRef, msg);
      }
    } catch {
      /* ignore malformed messages */
    }
  }, []);

  const webViewProps = useMemo(
    () => ({
      mediaCapturePermissionGrantType: 'grant',
      allowsInlineMediaPlayback: true,
      javaScriptCanOpenWindowsAutomatically: true,
      geolocationEnabled: false,
      onPermissionRequest: (request) => {
        try {
          request.grant(request.resources);
        } catch {
          /* ignore */
        }
      },
    }),
    [],
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {__DEV__ ? (
        <View style={styles.header}>
          <Text style={styles.title}>Pants on Fire! Find the Liar</Text>
          <Text style={styles.subtitle}>Dev shell — {gameUrl}</Text>
        </View>
      ) : null}
      {!urlReady ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#67e8f9" size="large" />
          <Text style={styles.loadingText}>Loading game…</Text>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: gameUrl }}
          style={styles.webview}
          originWhitelist={['https://*', 'http://*', 'file://*']}
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          setSupportMultipleWindows={false}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          mediaPlaybackRequiresUserAction={false}
          onMessage={onWebMessage}
          {...webViewProps}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#120038',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    color: '#facc15',
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: '#67e8f9',
    marginTop: 2,
    fontSize: 12,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#67e8f9',
    fontSize: 14,
  },
  webview: {
    flex: 1,
    backgroundColor: '#120038',
  },
});
