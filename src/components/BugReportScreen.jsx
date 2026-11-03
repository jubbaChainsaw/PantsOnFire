import { useCallback, useEffect, useMemo, useState } from 'react';
import { Camera, Send } from 'lucide-react';
import {
  buildBugReportPayload,
  flushBugReportQueue,
  submitBugReportWithQueue,
} from '../lib/bugReportClient.js';
import { UI_WALLPAPER_IN_GAME_SRC } from '../data/uiAssets.js';
import { resolveBundledAssetSrc } from '../lib/publicAssetUrl.js';
import { neonThemeVars } from '../data/uiNeonAssets.js';

async function captureScreenshotDataUrl() {
  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(document.body, {
      useCORS: true,
      allowTaint: true,
      logging: false,
      scale: Math.min(2, window.devicePixelRatio || 1),
    });
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return '';
  }
}

export function BugReportScreen({
  onBack,
  theme = 'Default',
  appContext = {},
  nativeBridge = null,
}) {
  const [description, setDescription] = useState('');
  const [screenshotDataUrl, setScreenshotDataUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [autoCaptured, setAutoCaptured] = useState(false);

  const wallSrc = useMemo(
    () => resolveBundledAssetSrc(UI_WALLPAPER_IN_GAME_SRC),
    [],
  );

  useEffect(() => {
    void flushBugReportQueue().then((r) => {
      if (r.flushed) setStatus(`Sent ${r.flushed} queued report(s).`);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const shot = await captureScreenshotDataUrl();
      if (cancelled || !shot) return;
      setScreenshotDataUrl(shot);
      setAutoCaptured(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const gatherDiagnostics = useCallback(async () => {
    const bridge = nativeBridge || {};
    return {
      appVersion: bridge.appVersion || appContext.appVersion || 'web',
      buildVersion: bridge.buildVersion || appContext.buildVersion || '',
      runtimeVersion: bridge.runtimeVersion || appContext.runtimeVersion || '',
      otaUpdateId: bridge.otaUpdateId || appContext.otaUpdateId || '',
      deviceModel: bridge.deviceModel || appContext.deviceModel || navigator.userAgent,
      osName: bridge.osName || appContext.osName || '',
      osVersion: bridge.osVersion || appContext.osVersion || '',
    };
  }, [appContext, nativeBridge]);

  const onSubmit = useCallback(async () => {
    const text = description.trim();
    if (!text) {
      setStatus('Please describe what went wrong.');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      const diagnostics = await gatherDiagnostics();
      const payload = buildBugReportPayload({
        description: text,
        screenshotDataUrl,
        context: {
          screen: appContext.screen || '',
          roundPhase: appContext.roundPhase || '',
          roundType: appContext.roundType || '',
          lobbyIdAnon: appContext.lobbyIdAnon || '',
          theme,
        },
        diagnostics,
      });
      const result = await submitBugReportWithQueue(payload);
      if (result.ok) {
        setStatus('Thanks — your report was sent.');
        setDescription('');
      } else if (result.queued) {
        setStatus('Offline — report saved and will retry when online.');
      } else {
        setStatus(result.error || 'Could not send report.');
      }
    } catch (err) {
      setStatus(String(err?.message || err));
    } finally {
      setBusy(false);
    }
  }, [appContext, description, gatherDiagnostics, screenshotDataUrl, theme]);

  return (
    <div
      className="relative min-h-[100dvh] overflow-x-hidden text-white"
      style={neonThemeVars()}
    >
      <div
        className="pof-wall fixed inset-0"
        style={{
          backgroundImage: wallSrc ? `url("${wallSrc}")` : undefined,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center top',
        }}
      />
      <div className="fixed inset-0 bg-black/55" />
      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 py-6">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="pof-btn pof-btn-steel pof-btn-sm pof-focus px-4"
            onClick={onBack}
          >
            Back
          </button>
          <div className="pof-heading text-sm text-cyan-200">Report a bug</div>
          <div className="w-16" />
        </div>

        <div className="pof-glass mt-4 flex flex-1 flex-col rounded-[1.75rem] p-5">
          <p className="pof-ui-copy text-sm leading-relaxed text-white/95">
            Tell us what happened. We attach app version, device info, and your
            current screen automatically. Screenshot is optional.
          </p>

          <label className="pof-ui-copy mt-4 block text-left text-sm font-semibold text-cyan-100">
            Description
          </label>
          <textarea
            className="pof-ui-copy mt-2 min-h-[8rem] w-full resize-y rounded-xl border border-cyan-300/40 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-300"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you expect? What happened instead?"
            data-testid="bug-report-description"
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="pof-btn pof-btn-blue pof-btn-sm pof-btn-wrap pof-focus px-4"
              onClick={async () => {
                const shot = await captureScreenshotDataUrl();
                setScreenshotDataUrl(shot || '');
                setAutoCaptured(Boolean(shot));
              }}
            >
              <Camera className="mr-2 inline h-4 w-4" />
              {screenshotDataUrl ? 'Retake screenshot' : 'Capture screenshot'}
            </button>
            {autoCaptured && screenshotDataUrl && (
              <span className="pof-ui-muted text-xs">Screen captured</span>
            )}
          </div>

          {screenshotDataUrl && (
            <img
              src={screenshotDataUrl}
              alt="Screenshot preview"
              className="mt-3 max-h-40 w-full rounded-xl border border-white/15 object-contain bg-black/30"
            />
          )}

          {status && (
            <p className="pof-ui-copy mt-4 text-sm text-amber-100">{status}</p>
          )}

          <button
            type="button"
            className="pof-btn pof-btn-fire pof-btn-wrap pof-focus mt-6"
            disabled={busy}
            data-testid="bug-report-submit"
            onClick={onSubmit}
          >
            <Send className="mr-2 inline h-5 w-5" />
            {busy ? 'Sending…' : 'Send report'}
          </button>
        </div>
      </div>
    </div>
  );
}
