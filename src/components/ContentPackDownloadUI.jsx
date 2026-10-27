import React from 'react';
import { Download, HardDrive, RefreshCw, Trash2, X } from 'lucide-react';
import { Button } from './ui/button.jsx';

function GlassPanel({ children, className = '' }) {
  return <div className={`border border-white/10 bg-black/30 backdrop-blur-md ${className}`}>{children}</div>;
}
import { formatPackSize } from '../lib/contentPacks/manifest.js';

function PackProgressBar({ percent }) {
  const safe = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-yellow-300 transition-all duration-300"
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

export function ContentPackPromptModal({
  open,
  totalLabel,
  packCount,
  progress,
  onDownload,
  onLater,
  downloading,
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      data-testid="content-pack-prompt"
    >
      <GlassPanel className="w-full max-w-md rounded-[2rem] border border-cyan-300/30 bg-black/60 p-6 shadow-[0_0_40px_rgba(34,211,238,0.25)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200/90">
              Extra content
            </div>
            <h2 className="pof-heading mt-2 text-2xl text-white">Download theme packs?</h2>
            <p className="pof-desc mt-2 text-sm text-white/75">
              The offline app ships with the Default theme only. Grab {packCount} free pack
              {packCount === 1 ? '' : 's'} ({totalLabel}) for full personas, hosts, and art.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full border border-white/15 bg-white/5 p-2 text-white/80"
            onClick={onLater}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {downloading ? (
          <div className="mt-5">
            <div className="text-xs uppercase tracking-widest text-fuchsia-200/90">Downloading</div>
            <PackProgressBar percent={progress.percent} />
            <p className="mt-2 text-xs text-white/60">
              {formatPackSize(progress.loaded)} / {formatPackSize(progress.total)}
            </p>
          </div>
        ) : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            className="flex-1 rounded-2xl border border-cyan-300/40 bg-cyan-500/25 py-3 font-black uppercase tracking-wider text-cyan-50"
            onClick={onDownload}
            data-testid="content-pack-download-btn"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button
            className="flex-1 rounded-2xl border border-white/15 bg-white/5 py-3 font-black uppercase tracking-wider text-white/85"
            onClick={onLater}
            data-testid="content-pack-later-btn"
          >
            Later
          </Button>
        </div>
      </GlassPanel>
    </div>
  );
}

export function ContentPackSettingsPanel({
  packs,
  installedPackIds,
  downloadByPackId,
  onDownload,
  onDelete,
  onRetry,
  onOpenDownloadOffer,
  missingPackCount = 0,
  isNativeBridge,
}) {
  const installed = new Set(installedPackIds || []);
  return (
    <GlassPanel
      className="rounded-[2.2rem] border-fuchsia-300/25 bg-black/25 p-5"
      data-testid="content-pack-settings"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-fuchsia-200/90">
          <HardDrive className="h-4 w-4" />
          Downloaded content
        </div>
        {missingPackCount > 0 && onOpenDownloadOffer ? (
          <Button
            type="button"
            className="rounded-xl border border-cyan-300/35 bg-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-50"
            onClick={onOpenDownloadOffer}
            data-testid="content-pack-open-offer-btn"
          >
            <Download className="mr-1 h-3.5 w-3.5" />
            Download packs ({missingPackCount})
          </Button>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-white/75">
        Manage optional theme and picture packs stored on this device.
        {!isNativeBridge ? ' Downloads require the Android app shell.' : ''}
      </p>
      <ul className="mt-4 space-y-3">
        {packs.map((pack) => {
          const state = downloadByPackId[pack.id];
          const isInstalled = installed.has(pack.id);
          const isError = state?.status === 'error';
          const isDownloading = state?.status === 'downloading' || state?.status === 'verifying';
          const percent =
            state?.bytesTotal > 0
              ? Math.round((state.bytesLoaded / state.bytesTotal) * 100)
              : 0;
          return (
            <li
              key={pack.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
              data-testid={`content-pack-row-${pack.id}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-white">{pack.name}</div>
                  <div className="text-xs text-white/55">
                    {formatPackSize(pack.sizeBytes)} · {pack.tier === 'paid' ? 'DLC' : 'Free'}
                    {isInstalled ? ' · Installed' : ''}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!isInstalled ? (
                    <Button
                      className="rounded-xl border border-cyan-300/35 bg-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-50"
                      onClick={() => onDownload(pack)}
                    >
                      Download
                    </Button>
                  ) : (
                    <Button
                      className="rounded-xl border border-red-300/35 bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-100"
                      onClick={() => onDelete(pack.id)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  )}
                  {isError ? (
                    <Button
                      className="rounded-xl border border-yellow-300/35 bg-yellow-500/15 px-3 py-1.5 text-xs font-bold text-yellow-50"
                      onClick={() => onRetry(pack)}
                    >
                      <RefreshCw className="mr-1 h-3.5 w-3.5" />
                      Retry
                    </Button>
                  ) : null}
                </div>
              </div>
              {isDownloading ? <PackProgressBar percent={percent} /> : null}
              {isError ? (
                <p className="mt-2 text-xs text-red-200/90">{state.error || 'Download failed'}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </GlassPanel>
  );
}
