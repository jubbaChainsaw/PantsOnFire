import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Star, Check } from 'lucide-react';
import { getStoreThemeThumbSrc } from '../../data/themeAssets.js';
import { getThemeOptions, THEME_DLC_PACK_BY_THEME } from '../../data/themeCatalog.js';
import {
  contentPackIdsForDlcPack,
  coreThemeContentPackId,
} from '../../lib/contentPacks/storeThemeDownloads.js';
import { tapFx } from '../../lib/pofFx.js';
import { DownloadBadge, StoreActionChip } from './neonStoreUi.jsx';

function StoreThemeImage({ src, alt = '', className = '', testId }) {
  const fallback = getStoreThemeThumbSrc('Default');
  const [activeSrc, setActiveSrc] = useState(src || fallback);
  return (
    <img
      src={activeSrc}
      alt={alt}
      className={className}
      data-testid={testId}
      onError={() => {
        if (activeSrc !== fallback) setActiveSrc(fallback);
      }}
    />
  );
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'owned', label: 'Owned' },
  { id: 'free', label: 'Free' },
  { id: 'premium', label: 'Premium' },
];

export default function NeonStoreThemesPanel({
  coreThemeNames = [],
  dlcThemePacks = [],
  unlockedThemePackIds = [],
  allDlcIncluded = false,
  disableDlcDemo = false,
  contentPackManifest = null,
  installedContentPackIds = [],
  onDownloadContentPack = () => {},
  onUnlockThemePack = () => {},
  downloadByPackId = {},
}) {
  const unlocked = useMemo(() => new Set(unlockedThemePackIds || []), [unlockedThemePackIds]);
  const installed = useMemo(() => new Set(installedContentPackIds || []), [installedContentPackIds]);
  const [filter, setFilter] = useState('all');
  const [featIndex, setFeatIndex] = useState(0);
  const carouselRef = useRef(null);

  const themeRows = useMemo(() => {
    const options = getThemeOptions([...unlocked]);
    return options.map((opt) => {
      const packId = opt.packId || THEME_DLC_PACK_BY_THEME[opt.name] || null;
      const pack = packId ? dlcThemePacks.find((p) => p.id === packId) : null;
      const isFree = !opt.isDlc;
      const isOwned = isFree || allDlcIncluded || opt.isUnlocked;
      return {
        name: opt.name,
        isFree,
        isOwned,
        isDlc: opt.isDlc,
        packId,
        pack,
        thumb: getStoreThemeThumbSrc(opt.name),
        contentPackId: coreThemeContentPackId(opt.name, contentPackManifest),
      };
    });
  }, [unlocked, allDlcIncluded, dlcThemePacks, contentPackManifest, coreThemeNames]);

  const counts = useMemo(
    () => ({
      all: themeRows.length,
      owned: themeRows.filter((t) => t.isOwned).length,
      free: themeRows.filter((t) => t.isFree).length,
      premium: themeRows.filter((t) => t.isDlc).length,
    }),
    [themeRows],
  );

  const filteredThemes = useMemo(() => {
    if (filter === 'owned') return themeRows.filter((t) => t.isOwned);
    if (filter === 'free') return themeRows.filter((t) => t.isFree);
    if (filter === 'premium') return themeRows.filter((t) => t.isDlc);
    return themeRows;
  }, [filter, themeRows]);

  const featuredPacks = useMemo(
    () =>
      dlcThemePacks.map((pack) => {
        const heroTheme = pack.themes?.[0] || pack.name;
        const isOwned = allDlcIncluded || unlocked.has(pack.id);
        return {
          id: pack.id,
          heroTheme,
          title: heroTheme,
          tagline: `${pack.name} · ${(pack.themes || []).length} themes in bundle`,
          art: getStoreThemeThumbSrc(heroTheme),
          isOwned,
          pack,
        };
      }),
    [dlcThemePacks, allDlcIncluded, unlocked],
  );

  const downloadStateForIds = (ids) => {
    if (!ids.length) return 'none';
    if (ids.every((id) => installed.has(id))) return 'installed';
    if (ids.some((id) => downloadByPackId[id]?.status === 'downloading')) return 'downloading';
    return 'available';
  };

  const onCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el || !featuredPacks.length) return;
    const card = el.querySelector('[data-featured-card]');
    const cardW = card?.offsetWidth || el.clientWidth * 0.88;
    const gap = 12;
    const idx = Math.round(el.scrollLeft / (cardW + gap));
    setFeatIndex(Math.max(0, Math.min(featuredPacks.length - 1, idx)));
  }, [featuredPacks.length]);

  return (
    <div data-testid="store-themes-panel">
      <p className="pof-desc mb-3 text-center text-xs text-white/70">
        Five core themes ship free. DLC bundles add three themed experiences each, or unlock
        everything with Host with the Most.
      </p>

      <div
        ref={carouselRef}
        className="mb-2 flex snap-x snap-mandatory gap-3 overflow-x-auto pof-scroll pb-1"
        data-testid="store-featured-carousel"
        onScroll={onCarouselScroll}
      >
        {featuredPacks.map((item) => (
          <article
            key={item.id}
            data-featured-card
            className="relative w-[88%] shrink-0 snap-center overflow-hidden rounded-2xl border-2 border-fuchsia-400/45 bg-black/40 shadow-[0_0_28px_rgba(232,121,249,0.2)]"
            data-testid={`store-featured-${item.id}`}
          >
            <StoreThemeImage src={item.art} className="h-44 w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
            <span
              className="pof-heading absolute left-3 top-3 flex items-center gap-1 rounded-full border border-yellow-300/50 bg-yellow-400/20 px-2 py-0.5 text-[0.6rem] text-yellow-100"
            >
              <Star className="h-3 w-3 fill-yellow-200 text-yellow-200" />
              Featured
            </span>
            {item.isOwned ? (
              <span
                className="pof-heading absolute right-3 top-3 flex items-center gap-1 rounded-full border border-emerald-300/50 bg-emerald-500/25 px-2 py-0.5 text-[0.6rem] text-emerald-50"
              >
                <Check className="h-3 w-3" />
                Owned
              </span>
            ) : null}
            <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
              <div className="pof-heading text-2xl text-fuchsia-100">{item.title}</div>
              <p className="pof-desc mt-0.5 text-[0.7rem] text-white/75">{item.tagline}</p>
              {!item.isOwned && !disableDlcDemo ? (
                <div className="mt-2">
                  <StoreActionChip
                    label={`Buy ${item.pack.priceLabel || '99p'}`}
                    variant="amber"
                    onClick={() => onUnlockThemePack(item.id)}
                  />
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div
        className="mb-4 flex justify-center gap-1.5"
        data-testid="store-featured-dots"
        aria-hidden
      >
        {featuredPacks.map((item, i) => (
          <span
            key={item.id}
            className={`h-1.5 rounded-full transition-all ${
              i === featIndex ? 'w-5 bg-fuchsia-300' : 'w-1.5 bg-white/30'
            }`}
          />
        ))}
      </div>

      <div
        className="mb-3 flex flex-wrap justify-center gap-2"
        data-testid="store-theme-filters"
      >
        {FILTERS.map((f) => {
          const active = filter === f.id;
          const count = counts[f.id];
          return (
            <button
              key={f.id}
              type="button"
              data-testid={`store-theme-filter-${f.id}`}
              className={`pof-heading rounded-full border px-3 py-1 text-[0.65rem] tracking-wide transition ${
                active
                  ? 'border-yellow-300/60 bg-yellow-300 text-zinc-950'
                  : 'border-white/20 bg-black/30 text-white/85'
              }`}
              onClick={() => {
                tapFx();
                setFilter(f.id);
              }}
            >
              {f.label} {count}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2" data-testid="store-theme-grid">
        {filteredThemes.map((theme) => {
          const contentIds = theme.pack
            ? contentPackIdsForDlcPack(theme.pack, contentPackManifest)
            : theme.contentPackId
              ? [theme.contentPackId]
              : [];
          const dlState = downloadStateForIds(contentIds);
          return (
            <div
              key={theme.name}
              className="overflow-hidden rounded-xl border border-white/15 bg-black/35"
              data-testid={`store-theme-card-${theme.name.replace(/\s+/g, '-')}`}
            >
              <StoreThemeImage
                src={theme.thumb}
                className="h-24 w-full object-cover"
                testId="store-theme-card-art"
              />
              <div className="p-2 text-left">
                <div className="pof-heading text-[0.72rem] leading-tight text-white">
                  {theme.name}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  {theme.isFree ? (
                    <DownloadBadge label="Free" tone="success" />
                  ) : theme.isOwned ? (
                    <DownloadBadge label="Owned" tone="success" />
                  ) : (
                    <DownloadBadge label={theme.pack?.priceLabel || 'Premium'} />
                  )}
                  {!theme.isOwned && theme.packId && !disableDlcDemo ? (
                    <StoreActionChip
                      label="Buy"
                      variant="amber"
                      onClick={() => onUnlockThemePack(theme.packId)}
                    />
                  ) : null}
                  {theme.isOwned && contentIds.length && dlState === 'available' ? (
                    <StoreActionChip
                      label="Download"
                      onClick={() => contentIds.forEach((id) => onDownloadContentPack(id))}
                    />
                  ) : null}
                  {theme.isOwned && contentIds.length && dlState === 'installed' ? (
                    <DownloadBadge label="Downloaded" tone="success" />
                  ) : null}
                  {theme.isOwned && contentIds.length && dlState === 'downloading' ? (
                    <DownloadBadge label="Downloading…" tone="action" />
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
