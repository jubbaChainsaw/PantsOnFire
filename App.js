import React, { useCallback, useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => {});
import {
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Purchases from 'react-native-purchases';

const DEFAULT_WEB_URL = Platform.select({
  android: 'http://10.0.2.2:5173',
  ios: 'http://localhost:5173',
  default: 'http://localhost:5173',
});

const BUNDLED_WEB_URL =
  Platform.OS === 'android'
    ? 'https://appassets.androidplatform.net/pof-web/index.html'
    : DEFAULT_WEB_URL;

const USE_BUNDLED_WEB =
  process.env.EXPO_PUBLIC_USE_BUNDLED_WEB === '1' ||
  process.env.EXPO_PUBLIC_USE_BUNDLED_WEB === 'true';

const GAME_URL =
  process.env.EXPO_PUBLIC_GAME_URL ||
  (USE_BUNDLED_WEB ? BUNDLED_WEB_URL : DEFAULT_WEB_URL);

const isBundledFileWeb =
  Platform.OS === 'android' &&
  typeof GAME_URL === 'string' &&
  (GAME_URL.startsWith('file:///android_asset/') ||
    GAME_URL.includes('appassets.androidplatform.net'));

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
      if (msg.type === 'POF_HAPTIC') {
        const pattern = msg.pattern;
        if (Array.isArray(pattern)) {
          Vibration.vibrate(pattern);
        } else if (typeof pattern === 'number') {
          Vibration.vibrate(pattern);
        } else {
          Vibration.vibrate(12);
        }
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
        originWhitelist={
          isBundledFileWeb
            ? ['file://*', 'https://*', 'http://*']
            : ['https://*', 'http://localhost*', 'http://10.0.2.2*']
        }
        allowFileAccess
        allowFileAccessFromFileURLs={isBundledFileWeb}
        allowUniversalAccessFromFileURLs={isBundledFileWeb}
        setSupportMultipleWindows={false}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        mediaPlaybackRequiresUserAction={false}
        onMessage={onWebMessage}
        onError={(e) => {
          // eslint-disable-next-line no-console
          console.error('[WebView]', e.nativeEvent);
        }}
        onHttpError={(e) => {
          // eslint-disable-next-line no-console
          console.error('[WebView HTTP]', e.nativeEvent);
        }}
        onConsoleMessage={(e) => {
          // eslint-disable-next-line no-console
          console.log('[WebViewConsole]', e.nativeEvent.message);
        }}
        onLoadEnd={() => {
          SplashScreen.hideAsync().catch(() => {});
        }}
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
