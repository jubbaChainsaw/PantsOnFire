#!/usr/bin/env node
/**
 * Patches react-native-webview to intercept appassets.androidplatform.net/dlc URLs.
 * Run after `expo prebuild --platform android`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const clientPath = path.resolve(
  'node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewClient.java',
);

if (!existsSync(clientPath)) {
  console.error('react-native-webview RNCWebViewClient.java not found — run npm ci first.');
  process.exit(1);
}

let source = readFileSync(clientPath, 'utf8');

if (source.includes('PofDlcAssetLoader')) {
  console.log('WebView asset loader patch already applied.');
  process.exit(0);
}

const importBlock =
  'import android.webkit.WebResourceRequest;\nimport android.webkit.WebResourceResponse;\n';

if (!source.includes('WebResourceResponse')) {
  source = source.replace(
    'import android.webkit.WebResourceRequest;',
    importBlock,
  );
}

const hookMethod = `
    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        WebResourceResponse dlcResponse = app.pantsonfire.findtheliar.PofDlcAssetLoader.shouldInterceptRequest(request);
        if (dlcResponse != null) {
            return dlcResponse;
        }
        return super.shouldInterceptRequest(view, request);
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
        return super.shouldInterceptRequest(view, url);
    }
`;

if (!source.includes('shouldInterceptRequest(WebView view, WebResourceRequest request)')) {
  source = source.replace(
    'public class RNCWebViewClient extends WebViewClient {',
    `public class RNCWebViewClient extends WebViewClient {${hookMethod}`,
  );
}

writeFileSync(clientPath, source);
console.log('Patched RNCWebViewClient for DLC WebViewAssetLoader.');

const templateLoader = path.resolve('native-android/PofDlcAssetLoader.kt');
const destLoader = path.resolve(
  'android/app/src/main/java/app/pantsonfire/findtheliar/PofDlcAssetLoader.kt',
);
if (existsSync(templateLoader)) {
  mkdirSync(path.dirname(destLoader), { recursive: true });
  writeFileSync(destLoader, readFileSync(templateLoader, 'utf8'));
}

const mainApp = path.resolve(
  'android/app/src/main/java/app/pantsonfire/findtheliar/MainApplication.kt',
);
if (existsSync(mainApp)) {
  let kt = readFileSync(mainApp, 'utf8');
  if (!kt.includes('PofDlcAssetLoader.ensureInitialized')) {
    kt = kt.replace(
      'loadReactNative(this)',
      'PofDlcAssetLoader.ensureInitialized(this)\n    loadReactNative(this)',
    );
    writeFileSync(mainApp, kt);
  }
}

const buildGradle = path.resolve('android/app/build.gradle');
if (existsSync(buildGradle)) {
  let gradle = readFileSync(buildGradle, 'utf8');
  if (!gradle.includes('androidx.webkit:webkit')) {
    gradle = gradle.replace(
      'implementation("com.facebook.react:react-android")',
      'implementation("com.facebook.react:react-android")\n    implementation("androidx.webkit:webkit:1.14.0")',
    );
    writeFileSync(buildGradle, gradle);
  }
}

console.log('MainApplication + webkit dependency updated (if needed).');
