#!/usr/bin/env node
/**
 * Adds InternalStoragePathHandler (/dlc/) for downloaded content packs.
 */
const fs = require('node:fs');
const path = require('node:path');

const clientPath = path.join(
  __dirname,
  '../node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewClient.java',
);

if (!fs.existsSync(clientPath)) {
  console.warn('RNCWebViewClient.java not found; skip DLC patch');
  process.exit(0);
}

let src = fs.readFileSync(clientPath, 'utf8');
if (src.includes('pofDlcPathHandler')) {
  console.log('WebView DLC path handler already patched');
  process.exit(0);
}

if (!src.includes('pofAssetLoader')) {
  console.warn('Run patch-rn-webview-asset-loader.cjs first');
  process.exit(1);
}

if (!src.includes('import java.io.File;')) {
  src = src.replace(
    'import androidx.webkit.WebViewAssetLoader;\n',
    `import androidx.webkit.WebViewAssetLoader;
import java.io.File;
`,
  );
}

src = src.replace(
  `new WebViewAssetLoader.AssetsPathHandler(view.getContext().getApplicationContext()))
                .build();`,
  `new WebViewAssetLoader.AssetsPathHandler(view.getContext().getApplicationContext()))
                .addPathHandler(
                    "/dlc/",
                    new WebViewAssetLoader.InternalStoragePathHandler(
                        view.getContext().getApplicationContext(),
                        new File(
                            view.getContext().getFilesDir(),
                            "pof-content-packs")))
                .build();`,
);

src = src.replace(
  'private WebViewAssetLoader getPofAssetLoader(WebView view) {',
  'private WebViewAssetLoader getPofAssetLoader(WebView view) { // pofDlcPathHandler',
);

fs.writeFileSync(clientPath, src);
console.log('Patched WebView asset loader with /dlc/ internal storage handler');
