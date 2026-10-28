import React, { useCallback, useMemo, useState } from 'react';
import {
  ArrowLeft,
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
import { NEON_ASSETS, neonThemeVars } from '../../data/uiNeonAssets.js';
import { readStoreSectionPrefs, writeStoreSectionPrefs } from '../../lib/storeSectionPrefs.js';
import { requestNativeEntitlementsRefresh } from '../../billing/nativePurchasesBridge.js';
import { tapFx } from '../../lib/pofFx.js';
import NeonStoreThemesPanel from './NeonStoreThemesPanel.jsx';
import WebPlayerNotice from './WebPlayerNotice.jsx';

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
  onWebUpgrade,
  webShopMode = false,
  storeNotice,
  setStoreNotice,
}) {
  const targetRank = TIER_RANK[tier.tierId] ?? 0;
  const isCurrent = accountSession && currentRank === targetRank;
  const owned = currentRank >= targetRank;
  const isFibber = tier.tierId === TIER_FIBBER;
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
              if (webShopMode && onWebUpgrade) {
                void Promise.resolve(onWebUpgrade(tier.tierId)).then((msg) => {
                  if (msg) setStoreNotice(msg);
                });
                return;
              }
              const msg = onUpgrade(tier.tierId);
              setStoreNotice(msg || '');
            }}
          >
            {owned ? 'Owned' : webShopMode ? 'Buy' : 'Upgrade'}
          </button>
        ) : null}
      </div>
    </div>
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
  webShopMode = false,
  onWebPurchaseTier = async () => '',
  onWebPurchaseAddon = async () => '',
  onWebPurchaseDlc = async () => {},
}) {
  const [sections, setSections] = useState(() => readStoreSectionPrefs());
  const [storeNotice, setStoreNotice] = useState(null);
  const [redeemCodeInput, setRedeemCodeInput] = useState('');
  const [redeemFeedback, setRedeemFeedback] = useState(null);

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
    const unlockedSet = new Set(unlockedThemePackIds || []);
    const ownedDlc = allDlcIncluded
      ? dlcThemePacks.length
      : dlcThemePacks.filter((p) => unlockedSet.has(p.id)).length;
    return `${ownedDlc}/${dlcThemePacks.length} DLC packs · Core themes included`;
  }, [allDlcIncluded, dlcThemePacks, unlockedThemePackIds]);

  const addonSummary = useMemo(() => {
    if (hasTwistAddon || allDlcIncluded) return 'Twist the Truth unlocked';
    return 'Twist the Truth · 99p';
  }, [hasTwistAddon, allDlcIncluded]);

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
        <header className="flex items-center gap-2" data-testid="store-header">
          <button
            type="button"
            className="pof-btn pof-btn-steel pof-btn-sm pof-focus flex h-10 w-10 items-center justify-center p-0"
            aria-label="Back"
            data-testid="store-back"
            onClick={() => {
              tapFx();
              onBack?.();
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 text-center">
            <div className="pof-heading text-3xl text-yellow-200">Shop</div>
          </div>
          <span
            className="pof-heading flex max-w-[7.5rem] items-center gap-1 rounded-full border border-amber-300/45 bg-amber-400/15 px-2.5 py-1 text-[0.62rem] text-amber-100"
            data-testid="store-tier-chip"
            title="Your access tier"
          >
            <Crown className="h-3.5 w-3.5 shrink-0 text-amber-200" />
            <span className="truncate">{currentTierName}</span>
          </span>
        </header>

        {webShopMode ? (
          <WebPlayerNotice variant="shop" className="mt-3" dataTestId="web-player-notice-shop" />
        ) : null}

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
                {accountSession.authProvider === 'pof' || accountSession.authProvider === 'supabase'
                  ? ' · Purchases sync across web and mobile.'
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
                  onWebUpgrade={onWebPurchaseTier}
                  webShopMode={webShopMode}
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
            <NeonStoreThemesPanel
              coreThemeNames={coreThemeNames}
              dlcThemePacks={dlcThemePacks}
              unlockedThemePackIds={unlockedThemePackIds}
              allDlcIncluded={allDlcIncluded}
              disableDlcDemo={disableDlcDemo && !webShopMode}
              webShopMode={webShopMode}
              onWebPurchaseDlc={onWebPurchaseDlc}
              contentPackManifest={contentPackManifest}
              installedContentPackIds={installedContentPackIds}
              onDownloadContentPack={onDownloadContentPack}
              onUnlockThemePack={onUnlockThemePack}
              downloadByPackId={downloadByPackId}
            />

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
                    if (webShopMode) {
                      void Promise.resolve(onWebPurchaseAddon()).then((msg) => {
                        if (msg) setStoreNotice(msg);
                      });
                      return;
                    }
                    setStoreNotice(onSimulateTwistAddon() || '');
                  }}
                >
                  {hasTwistAddon || allDlcIncluded ? 'Included' : webShopMode ? 'Buy' : 'Unlock'}
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
