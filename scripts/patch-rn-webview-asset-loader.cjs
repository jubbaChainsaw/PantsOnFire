#!/usr/bin/env node
/**
 * Patches react-native-webview to serve android_asset via WebViewAssetLoader.
 */
const fs = require('node:fs');
const path = require('node:path');

const clientPath = path.join(
  __dirname,
  '../node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewClient.java',
);

if (!fs.existsSync(clientPath)) {
  console.warn('RNCWebViewClient.java not found; skip asset loader patch');
  process.exit(0);
}

let src = fs.readFileSync(clientPath, 'utf8');
if (src.includes('pofAssetLoader')) {
  console.log('WebView asset loader already patched');
  process.exit(0);
}

src = src.replace(
  'import android.webkit.WebViewClient;\n',
  `import android.webkit.WebViewClient;
import android.net.Uri;
import androidx.webkit.WebViewAssetLoader;
`,
);

src = src.replace(
  'protected @Nullable RNCBasicAuthCredential basicAuthCredential = null;\n',
  `protected @Nullable RNCBasicAuthCredential basicAuthCredential = null;
    private @Nullable WebViewAssetLoader pofAssetLoader = null;

    private WebViewAssetLoader getPofAssetLoader(WebView view) {
        if (pofAssetLoader == null) {
            pofAssetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler(
                    "/",
                    new WebViewAssetLoader.AssetsPathHandler(view.getContext().getApplicationContext()))
                .build();
        }
        return pofAssetLoader;
    }
`,
);

const intercept = `
    @Override
    @Nullable
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            WebResourceResponse response =
                getPofAssetLoader(view).shouldInterceptRequest(request.getUrl());
            if (response != null) {
                return response;
            }
        }
        return super.shouldInterceptRequest(view, request);
    }

    @Override
    @Nullable
    public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
        WebResourceResponse response =
            getPofAssetLoader(view).shouldInterceptRequest(Uri.parse(url));
        if (response != null) {
            return response;
        }
        return super.shouldInterceptRequest(view, url);
    }

`;

src = src.replace(
  '    @Override\n    public void onPageFinished(WebView webView, String url) {',
  `${intercept}    @Override\n    public void onPageFinished(WebView webView, String url) {`,
);

fs.writeFileSync(clientPath, src);
console.log('Patched RNCWebViewClient with WebViewAssetLoader (assets/)');
