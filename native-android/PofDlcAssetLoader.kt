package app.pantsonfire.findtheliar

import android.content.Context
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import androidx.webkit.WebViewAssetLoader
import java.io.File
import java.io.FileInputStream

/**
 * Serves downloaded packs at https://appassets.androidplatform.net/dlc/{packId}/assets/...
 */
object PofDlcAssetLoader {
  private var loader: WebViewAssetLoader? = null

  @JvmStatic
  fun ensureInitialized(context: Context) {
    if (loader != null) return
    val appContext = context.applicationContext
    loader =
      WebViewAssetLoader.Builder()
        .setDomain("appassets.androidplatform.net")
        .addPathHandler("/dlc/", PofDlcPathHandler(appContext))
        .build()
  }

  @JvmStatic
  fun shouldInterceptRequest(request: WebResourceRequest?): WebResourceResponse? {
    val active = loader ?: return null
    val url = request?.url ?: return null
    return active.shouldInterceptRequest(url)
  }

  private class PofDlcPathHandler(private val context: Context) : WebViewAssetLoader.PathHandler {
    override fun handle(path: String): WebResourceResponse? {
      val relative = path.trimStart('/')
      val packRoot = File(context.filesDir, "pof-content-packs")
      val target = File(packRoot, relative)
      if (!target.isFile) return null
      val mime =
        when {
          target.name.endsWith(".webp", true) -> "image/webp"
          target.name.endsWith(".png", true) -> "image/png"
          target.name.endsWith(".jpg", true) || target.name.endsWith(".jpeg", true) -> "image/jpeg"
          target.name.endsWith(".svg", true) -> "image/svg+xml"
          target.name.endsWith(".webm", true) -> "video/webm"
          target.name.endsWith(".mp4", true) -> "video/mp4"
          target.name.endsWith(".mp3", true) -> "audio/mpeg"
          target.name.endsWith(".wav", true) -> "audio/wav"
          target.name.endsWith(".js", true) -> "application/javascript"
          target.name.endsWith(".css", true) -> "text/css"
          target.name.endsWith(".json", true) -> "application/json"
          else -> "application/octet-stream"
        }
      return WebResourceResponse(mime, null, FileInputStream(target))
    }
  }
}
