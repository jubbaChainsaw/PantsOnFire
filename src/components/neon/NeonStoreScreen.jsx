import React, { useCallback, useMemo, useState } from 'react';
import {
  ChevronDown,
  Crown,
  KeyRound,
  Palette,
  RefreshCw,
  Sparkles,
  UserCircle2,
} from 'lucide-react';
import {
  ADDON_TWIST_TRUTH,
  REVENUE_CAT_ENTITLEMENTS,
  SUBSCRIPTION_TIERS,
  TIER_FIBBER,
  TIER_HOST_MOST,
  TIER_RANK,
} from '../../account/tierModel.js';
import { CORE_THEME_NAMES, DLC_THEME_PACKS } from '../../data/themeCatalog.js';
import { getThemeAssets } from '../../data/themeAssets.js';
import { NEON_ASSETS, neonThemeVars } from '../../data/uiNeonAssets.js';
import { resolveBundledAssetSrc } from '../../lib/publicAssetUrl.js';
import { readStoreSectionPrefs, writeStoreSectionPrefs } from '../../lib/storeSectionPrefs.js';
import {
  contentPackIdsForDlcPack,
  coreThemeContentPackId,
} from '../../lib/contentPacks/storeThemeDownloads.js';
import { requestNativeEntitlementsRefresh } from '../../billing/nativePurchasesBridge.js';
import { tapFx } from '../../lib/pofFx.js';

function StoreSection({
  id,
  title,
  icon: Icon,
  summary,
  expanded,
  onToggle,
  children,
  defaultOpen = false,
  accent = 'cyan',
}) {
  const border =
    accent === 'fuchsia'
      ? 'border-fuchsia-400/35 shadow-[0_0_24px_rgba(232,121,249,0.15)]'
      : accent === 'amber'
        ? 'border-amber-300/35 shadow-[0_0_24px_rgba(251,191,36,0.12)]'
        : 'border-cyan-400/35 shadow-[0_0_24px_rgba(34,211,238,0.15)]';
  return (
    <section
      className={`overflow-hidden rounded-[1.75rem] border bg-black/45 backdrop-blur-md ${border}`}
      data-testid={`store-section-${id}`}
      data-expanded={expanded ? 'true' : 'false'}
    >
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-4 text-left"
        onClick={() => {
          tapFx();
          onToggle();
        }}
        aria-expanded={expanded}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5">
          <Icon className="h-5 w-5 text-cyan-200" />
        </span>
        <span className="min-w-0 flex-1">
          <div className="pof-heading text-lg text-yellow-200">{title}</div>
          {!expanded && (
            <div className="pof-desc mt-0.5 truncate text-xs text-white/65">{summary}</div>
          )}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-white/70 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      {expanded ? <div className="border-t border-white/10 px-4 pb-4 pt-2">{children}</div> : null}
    </section>
  );
}

function TierCard({
  tier,
  currentRank,
  accountSession,
  onUpgrade,
  storeNotice,
  setStoreNotice,
}) {
  const targetRank = TIER_RANK[tier.tierId] ?? 0;
  const isCurrent = accountSession && currentRank === targetRank;
  const owned = currentRank >= targetRank;
  const isFibber = tier.tierId === TIER_FIBBER;
  const rcId = REVENUE_CAT_ENTITLEMENTS[tier.tierId];

  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        isCurrent
          ? 'border-yellow-300/60 bg-yellow-400/10 ring-2 ring-yellow-300/40'
          : 'border-white/10 bg-white/5'
      }`}
      data-testid={`store-tier-${tier.tierId}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="text-left">
          <div className="pof-heading text-xl text-white">
            {tier.name}
            {isCurrent ? (
              <span className="ml-2 text-xs font-normal tracking-widest text-yellow-200">
                CURRENT
              </span>
            ) : null}
          </div>
          <div className="pof-desc mt-1 text-lg font-semibold text-yellow-300">{tier.priceLabel}</div>
          <ul className="pof-desc mt-2 list-disc space-y-1 pl-5 text-xs text-white/75">
            {tier.bullets.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {tier.upgradeHint ? (
            <p className="pof-desc mt-2 text-[0.7rem] text-cyan-100/80">{tier.upgradeHint}</p>
          ) : null}
        </div>
        {!isFibber ? (
          <button
            type="button"
            className="pof-btn pof-btn-fire pof-btn-sm pof-focus shrink-0 px-5 disabled:opacity-50"
            disabled={owned || !accountSession}
            onClick={() => {
              tapFx();
              const msg = onUpgrade(tier.tierId);
              setStoreNotice(msg || '');
            }}
          >
            {owned ? 'Owned' : 'Upgrade'}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function DownloadBadge({ label, tone = 'neutral' }) {
  const cls =
    tone === 'success'
      ? 'border-emerald-300/40 bg-emerald-500/20 text-emerald-100'
      : tone === 'action'
        ? 'border-cyan-300/40 bg-cyan-500/15 text-cyan-50'
        : 'border-white/15 bg-white/10 text-white/80';
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  );
}

export default function NeonStoreScreen({
  onBack,
  onOpenAccount,
  dlcThemePacks = DLC_THEME_PACKS,
  coreThemeNames = CORE_THEME_NAMES,
  unlockedThemePackIds = [],
  accountSession = null,
  allDlcIncluded = false,
  hasTwistAddon = false,
  disableDlcDemo = false,
  onSimulateTierPurchase = () => {},
  onSimulateTwistAddon = () => {},
  onUnlockThemePack = () => {},
  onRedeemThemeCode = () => ({ status: 'invalid-code' }),
  contentPackManifest = null,
  installedContentPackIds = [],
  onDownloadContentPack = () => {},
  downloadByPackId = {},
}) {
  const [sections, setSections] = useState(() => readStoreSectionPrefs());
  const [storeNotice, setStoreNotice] = useState(null);
  const [redeemCodeInput, setRedeemCodeInput] = useState('');
  const [redeemFeedback, setRedeemFeedback] = useState(null);

  const unlocked = useMemo(() => new Set(unlockedThemePackIds || []), [unlockedThemePackIds]);
  const installed = useMemo(() => new Set(installedContentPackIds || []), [installedContentPackIds]);
  const currentTierRank = accountSession ? TIER_RANK[accountSession.tierId] ?? 0 : 0;
  const currentTierName =
    SUBSCRIPTION_TIERS.find((t) => TIER_RANK[t.tierId] === currentTierRank)?.name || 'Fibber';

  const toggleSection = useCallback((key) => {
    setSections((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      writeStoreSectionPrefs(next);
      return next;
    });
  }, []);

  const themesSummary = useMemo(() => {
    const ownedDlc = allDlcIncluded
      ? dlcThemePacks.length
      : dlcThemePacks.filter((p) => unlocked.has(p.id)).length;
    return `${ownedDlc}/${dlcThemePacks.length} DLC packs · Core themes included`;
  }, [allDlcIncluded, dlcThemePacks, unlocked]);

  const addonSummary = useMemo(() => {
    if (hasTwistAddon || allDlcIncluded) return 'Twist the Truth unlocked';
    return 'Twist the Truth · 99p';
  }, [hasTwistAddon, allDlcIncluded]);

  const packArt = (pack) => {
    const firstTheme = pack?.themes?.[0];
    if (!firstTheme) return '';
    const assets = getThemeAssets(firstTheme);
    return resolveBundledAssetSrc(
      assets?.uiBanner || assets?.personaHostIdle || '',
    );
  };

  const downloadStateForIds = (ids) => {
    if (!ids.length) return 'none';
    if (ids.every((id) => installed.has(id))) return 'installed';
    if (ids.some((id) => downloadByPackId[id]?.status === 'downloading')) return 'downloading';
    return 'available';
  };

  const handleRedeemSubmit = (event) => {
    event.preventDefault();
    const redemption = onRedeemThemeCode(redeemCodeInput);
    if (!redemption || redemption.status === 'invalid-code') {
      setRedeemFeedback({
        tone: 'error',
        message: 'Invalid code. Double-check the code and try again.',
      });
      return;
    }
    if (redemption.status === 'already-unlocked') {
      setRedeemFeedback({
        tone: 'neutral',
        message: 'Code accepted, but those DLC packs are already unlocked on this device.',
      });
      setRedeemCodeInput('');
      return;
    }
    if (redemption.status === 'unlocked') {
      setRedeemFeedback({ tone: 'success', message: 'Code redeemed! New DLC unlocked.' });
      setRedeemCodeInput('');
      return;
    }
    setRedeemFeedback({
      tone: 'error',
      message: 'Could not redeem this code right now. Please try again.',
    });
  };

  return (
    <div
      className="pof-root relative min-h-screen w-full overflow-x-hidden bg-[#05010f] text-white"
      style={neonThemeVars()}
      data-testid="neon-store-screen"
    >
      <div
        className="pof-wall absolute inset-0 opacity-90"
        style={{ backgroundImage: `url(${NEON_ASSETS.wallGame})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/70" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[28rem] flex-col px-3 pb-8 pt-3">
        <header className="flex items-center gap-3">
          <button type="button" className="pof-btn pof-btn-steel pof-btn-sm pof-focus px-4" onClick={onBack}>
            Back
          </button>
          <div className="flex-1 text-center">
            <div className="pof-heading text-2xl text-yellow-200">Shop</div>
            <p className="pof-desc text-xs text-white/70">Unlock access, themes, and extras</p>
          </div>
          <img src={NEON_ASSETS.icons.shop} alt="" className="h-10 w-10 opacity-90" />
        </header>

        {storeNotice ? (
          <div
            className={`mt-3 rounded-2xl border px-3 py-2 text-sm ${
              String(storeNotice).startsWith('Successfully')
                ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-50'
                : 'border-red-300/40 bg-red-500/15 text-red-100'
            }`}
          >
            {storeNotice}
          </div>
        ) : null}

        <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto pof-scroll">
          <StoreSection
            id="access"
            title="Access"
            icon={Crown}
            summary={`Current: ${currentTierName}`}
            expanded={sections.access}
            onToggle={() => toggleSection('access')}
            accent="amber"
          >
            {accountSession ? (
              <p className="pof-desc mb-3 text-xs text-white/70">
                Signed in as <span className="text-cyan-100">{accountSession.displayName}</span>
                {accountSession.authProvider === 'supabase'
                  ? ' · Purchases sync via App Store / Play (RevenueCat).'
                  : ' · Demo checkout on this device.'}
              </p>
            ) : (
              <p className="pof-desc mb-3 text-xs text-amber-100/90">
                Sign in to purchase or restore subscriptions on this device.
              </p>
            )}
            <div className="space-y-3">
              {SUBSCRIPTION_TIERS.map((tier) => (
                <TierCard
                  key={tier.tierId}
                  tier={tier}
                  currentRank={currentTierRank}
                  accountSession={accountSession}
                  onUpgrade={onSimulateTierPurchase}
                  setStoreNotice={setStoreNotice}
                />
              ))}
            </div>
          </StoreSection>

          <StoreSection
            id="themes"
            title="Themes"
            icon={Palette}
            summary={themesSummary}
            expanded={sections.themes}
            onToggle={() => toggleSection('themes')}
            accent="fuchsia"
          >
            <p className="pof-desc mb-3 text-xs text-white/70">
              Five core themes ship free. DLC bundles add three themed experiences each (99p) or
              unlock everything with Host with the Most.
            </p>
            <div className="mb-4">
              <div className="pof-heading mb-2 text-sm text-cyan-100">Core themes</div>
              <div className="flex flex-wrap gap-2">
                {coreThemeNames.map((name) => {
                  const art = resolveBundledAssetSrc(getThemeAssets(name)?.uiBanner || '');
                  const packId = coreThemeContentPackId(name, contentPackManifest);
                  const dlState = packId ? downloadStateForIds([packId]) : 'none';
                  return (
                    <div
                      key={name}
                      className="relative w-[calc(50%-0.25rem)] overflow-hidden rounded-xl border border-white/15 bg-black/30"
                      data-testid={`store-core-theme-${name.replace(/\s+/g, '-')}`}
                    >
                      {art ? (
                        <img src={art} alt="" className="h-16 w-full object-cover opacity-90" />
                      ) : (
                        <div className="h-16 bg-white/5" />
                      )}
                      <div className="p-2">
                        <div className="pof-heading text-xs text-white">{name}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <DownloadBadge label="Included" tone="success" />
                          {packId && dlState === 'installed' ? (
                            <DownloadBadge label="Downloaded" tone="success" />
                          ) : null}
                          {packId && dlState === 'available' ? (
                            <button
                              type="button"
                              className="text-[0.65rem] font-bold uppercase text-cyan-200 underline"
                              onClick={() => onDownloadContentPack(packId)}
                            >
                              Download
                            </button>
                          ) : null}
                          {packId && dlState === 'downloading' ? (
                            <DownloadBadge label="Downloading…" tone="action" />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pof-heading mb-2 text-sm text-fuchsia-100">DLC theme packs</div>
            <div className="grid grid-cols-2 gap-2">
              {dlcThemePacks.map((pack) => {
                const isUnlocked = allDlcIncluded || unlocked.has(pack.id);
                const art = packArt(pack);
                const contentIds = contentPackIdsForDlcPack(pack, contentPackManifest);
                const dlState = downloadStateForIds(contentIds);
                return (
                  <div
                    key={pack.id}
                    className="overflow-hidden rounded-xl border border-white/15 bg-black/35"
                    data-testid={`store-dlc-pack-${pack.id}`}
                  >
                    {art ? (
                      <img
                        src={art}
                        alt=""
                        className="h-20 w-full object-cover"
                        data-testid="store-dlc-pack-art"
                      />
                    ) : (
                      <div className="h-20 bg-white/5" />
                    )}
                    <div className="p-2 text-left">
                      <div className="pof-heading text-[0.7rem] leading-tight text-white">
                        {pack.name}
                      </div>
                      <p className="pof-desc mt-1 line-clamp-2 text-[0.65rem] text-white/60">
                        {(pack.themes || []).join(' · ')}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        {isUnlocked ? (
                          <DownloadBadge label="Owned" tone="success" />
                        ) : (
                          <DownloadBadge label={pack.priceLabel || '99p'} />
                        )}
                        {!isUnlocked && !disableDlcDemo ? (
                          <button
                            type="button"
                            className="text-[0.65rem] font-bold uppercase text-yellow-200 underline"
                            onClick={() => onUnlockThemePack(pack.id)}
                          >
                            Buy
                          </button>
                        ) : null}
                        {isUnlocked && contentIds.length && dlState === 'installed' ? (
                          <DownloadBadge label="Downloaded" tone="success" />
                        ) : null}
                        {isUnlocked && contentIds.length && dlState === 'available' ? (
                          <button
                            type="button"
                            className="text-[0.65rem] font-bold uppercase text-cyan-200 underline"
                            onClick={() => contentIds.forEach((id) => onDownloadContentPack(id))}
                          >
                            Download
                          </button>
                        ) : null}
                        {isUnlocked && contentIds.length && dlState === 'downloading' ? (
                          <DownloadBadge label="Downloading…" tone="action" />
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-3">
              <div className="flex items-center gap-2 text-cyan-100">
                <KeyRound className="h-4 w-4" />
                <div className="pof-heading text-sm">Redeem code</div>
              </div>
              <form className="mt-2 flex flex-col gap-2" onSubmit={handleRedeemSubmit}>
                <input
                  value={redeemCodeInput}
                  onChange={(e) => setRedeemCodeInput(e.target.value)}
                  placeholder="e.g. HISTORY-99"
                  className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
                />
                <button type="submit" className="pof-btn pof-btn-blue pof-btn-sm pof-focus">
                  Redeem
                </button>
              </form>
              {redeemFeedback ? (
                <p className="pof-desc mt-2 text-xs text-white/80">{redeemFeedback.message}</p>
              ) : null}
            </div>
          </StoreSection>

          <StoreSection
            id="addons"
            title="Add-ons"
            icon={Sparkles}
            summary={addonSummary}
            expanded={sections.addons}
            onToggle={() => toggleSection('addons')}
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
              <div className="pof-heading text-lg text-fuchsia-100">{ADDON_TWIST_TRUTH.name}</div>
              <p className="pof-desc mt-2 text-sm text-white/75">{ADDON_TWIST_TRUTH.description}</p>
              <p className="pof-desc mt-2 font-mono text-[0.65rem] text-white/45">
                Store ID: {REVENUE_CAT_ENTITLEMENTS.twistTruth}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="pof-desc text-lg font-semibold text-yellow-300">
                  {ADDON_TWIST_TRUTH.priceLabel}
                </span>
                <button
                  type="button"
                  className="pof-btn pof-btn-fire pof-btn-sm pof-focus disabled:opacity-50"
                  disabled={
                    !accountSession ||
                    allDlcIncluded ||
                    hasTwistAddon ||
                    currentTierRank >= TIER_RANK[TIER_HOST_MOST]
                  }
                  onClick={() => {
                    tapFx();
                    setStoreNotice(onSimulateTwistAddon() || '');
                  }}
                >
                  {hasTwistAddon || allDlcIncluded ? 'Included' : 'Unlock'}
                </button>
              </div>
            </div>
          </StoreSection>

          <div
            className="mt-2 space-y-2 rounded-[1.5rem] border border-white/10 bg-black/40 p-4"
            data-testid="store-account-footer"
          >
            <button
              type="button"
              className="pof-btn pof-btn-steel pof-focus flex w-full items-center justify-center gap-2"
              onClick={() => {
                tapFx();
                requestNativeEntitlementsRefresh();
                setStoreNotice('Restore requested — syncing with the App Store / Play Store…');
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Restore purchases
            </button>
            <button
              type="button"
              className="pof-btn pof-btn-blue pof-focus flex w-full items-center justify-center gap-2"
              onClick={() => {
                tapFx();
                onOpenAccount?.();
              }}
            >
              <UserCircle2 className="h-4 w-4" />
              Account & sign-in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
