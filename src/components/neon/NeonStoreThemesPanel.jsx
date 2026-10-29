import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Star, Check } from 'lucide-react';
import { getStoreThemeThumbSrc } from '../../data/themeAssets.js';
import { getThemeOptions, THEME_DLC_PACK_BY_THEME } from '../../data/themeCatalog.js';
import {
  REFERRAL_SECRET_THEME_UNLOCKS,
  referralSecretThemeUnlocked,
} from '../../data/referralSecretThemes.js';
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
  achievementUnlockedThemeNames = [],
  allDlcIncluded = false,
  disableDlcDemo = false,
  contentPackManifest = null,
  installedContentPackIds = [],
  onDownloadContentPack = () => {},
  onUnlockThemePack = () => {},
  onWebPurchaseDlc = async () => {},
  webShopMode = false,
  dlcPackPriceLabel = '£2.99',
  downloadByPackId = {},
}) {
  const unlocked = useMemo(() => new Set(unlockedThemePackIds || []), [unlockedThemePackIds]);
  const installed = useMemo(() => new Set(installedContentPackIds || []), [installedContentPackIds]);
  const [filter, setFilter] = useState('all');
  const [featIndex, setFeatIndex] = useState(0);
  const carouselRef = useRef(null);

  const themeRows = useMemo(() => {
    const profileStub = { achievementUnlockedThemeNames };
    const options = getThemeOptions([...unlocked], achievementUnlockedThemeNames);
    const rows = options.map((opt) => {
      const packId = opt.packId || THEME_DLC_PACK_BY_THEME[opt.name] || null;
      const pack = packId ? dlcThemePacks.find((p) => p.id === packId) : null;
      const isFree = !opt.isDlc;
      const isOwned = isFree || allDlcIncluded || opt.isUnlocked;
      return {
        name: opt.name,
        isFree,
        isOwned,
        isDlc: opt.isDlc,
        isMystery: false,
        packId,
        pack,
        thumb: getStoreThemeThumbSrc(opt.name),
        contentPackId: coreThemeContentPackId(opt.name, contentPackManifest),
      };
    });
    for (const entry of REFERRAL_SECRET_THEME_UNLOCKS) {
      if (referralSecretThemeUnlocked(profileStub, entry.themeName)) continue;
      rows.push({
        name: entry.pack.mysteryName,
        isFree: false,
        isOwned: false,
        isDlc: true,
        isMystery: true,
        packId: entry.pack.id,
        pack: entry.pack,
        thumb: entry.pack.mysteryIcon,
        contentPackId: null,
        mysteryHint: entry.pack.mysteryDescription,
      });
    }
    return rows;
  }, [
    unlocked,
    allDlcIncluded,
    dlcThemePacks,
    contentPackManifest,
    achievementUnlockedThemeNames,
  ]);

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
                    label={`Buy ${webShopMode ? dlcPackPriceLabel : item.pack.priceLabel || dlcPackPriceLabel}`}
                    variant="amber"
                    onClick={() => {
                      if (webShopMode) void onWebPurchaseDlc(item.id);
                      else onUnlockThemePack(item.id);
                    }}
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
          const contentIds = theme.isMystery
            ? []
            : theme.pack
              ? contentPackIdsForDlcPack(theme.pack, contentPackManifest)
              : theme.contentPackId
                ? [theme.contentPackId]
                : [];
          const dlState = downloadStateForIds(contentIds);
          const testIdSlug = theme.isMystery
            ? `mystery-${theme.packId}`
            : theme.name.replace(/\s+/g, '-');
          return (
            <div
              key={theme.isMystery ? theme.packId : theme.name}
              className="overflow-hidden rounded-xl border border-white/15 bg-black/35"
              data-testid={`store-theme-card-${testIdSlug}`}
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
                {theme.isMystery ? (
                  <p className="mt-1 text-[0.58rem] leading-snug text-violet-100/80">
                    {theme.mysteryHint}
                  </p>
                ) : null}
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  {theme.isMystery ? (
                    <DownloadBadge label="Invite unlock" tone="action" />
                  ) : theme.isFree ? (
                    <DownloadBadge label="Free" tone="success" />
                  ) : theme.isOwned ? (
                    <DownloadBadge label="Owned" tone="success" />
                  ) : (
                    <DownloadBadge label={theme.pack?.priceLabel || 'Premium'} />
                  )}
                  {!theme.isOwned && theme.packId && !disableDlcDemo && !theme.isMystery ? (
                    <StoreActionChip
                      label="Buy"
                      variant="amber"
                      onClick={() => {
                        if (webShopMode) void onWebPurchaseDlc(theme.packId);
                        else onUnlockThemePack(theme.packId);
                      }}
                    />
                  ) : null}
                  {webShopMode && theme.isOwned && theme.isDlc ? (
                    <DownloadBadge label="Use in app" tone="success" />
                  ) : null}
                  {!webShopMode && theme.isOwned && contentIds.length && dlState === 'available' ? (
                    <StoreActionChip
                      label="Download"
                      onClick={() => contentIds.forEach((id) => onDownloadContentPack(id))}
                    />
                  ) : null}
                  {!webShopMode && theme.isOwned && contentIds.length && dlState === 'installed' ? (
                    <DownloadBadge label="Downloaded" tone="success" />
                  ) : null}
                  {!webShopMode && theme.isOwned && contentIds.length && dlState === 'downloading' ? (
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
