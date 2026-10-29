import React, { useCallback, useEffect } from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import Purchases from 'react-native-purchases';

const DEFAULT_WEB_URL = Platform.select({
  android: 'http://10.0.2.2:5173',
  ios: 'http://localhost:5173',
  default: 'http://localhost:5173',
});

const BUNDLED_ANDROID_GAME_URI = 'file:///android_asset/pof-web/index.html';

/** CI / test APKs set EXPO_PUBLIC_USE_BUNDLED_WEB=1 so debug builds load assets, not 10.0.2.2:5173. */
const useBundledAndroidWeb =
  Platform.OS === 'android' &&
  (Boolean(process.env.EXPO_PUBLIC_GAME_URL) ||
    process.env.EXPO_PUBLIC_USE_BUNDLED_WEB === '1' ||
    !__DEV__);

const GAME_URL =
  process.env.EXPO_PUBLIC_GAME_URL ||
  (useBundledAndroidWeb ? BUNDLED_ANDROID_GAME_URI : null) ||
  DEFAULT_WEB_URL;

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

export default function App() {
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

  const onWebMessage = useCallback((event) => {
    try {
      const msg = JSON.parse(String(event?.nativeEvent?.data || '{}'));
      if (msg.type === 'POF_SET_USER' && msg.userId) {
        Purchases.logIn(String(msg.userId)).catch(() => {});
      }
      if (msg.type === 'POF_REFRESH_ENTITLEMENTS') {
        Purchases.syncPurchases().catch(() => {});
      }
    } catch {
      /* ignore malformed messages */
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {__DEV__ ? (
        <View style={styles.header}>
          <Text style={styles.title}>Pants on Fire! Find the Liar</Text>
          <Text style={styles.subtitle}>Dev shell — {GAME_URL}</Text>
        </View>
      ) : null}
      <WebView
        source={{ uri: GAME_URL }}
        style={styles.webview}
        originWhitelist={['https://*', 'http://*', 'file://*']}
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        setSupportMultipleWindows={false}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction
        onMessage={onWebMessage}
      />
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
  webview: {
    flex: 1,
    backgroundColor: '#120038',
  },
});
