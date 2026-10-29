const TIER_FIBBER = 'fibber';

export function entitlementsIndicatePaidPurchase(row) {
  if (!row || typeof row !== 'object') return false;
  const tierId = String(row.tierId || TIER_FIBBER).trim() || TIER_FIBBER;
  if (tierId !== TIER_FIBBER) return true;
  if (row.addonTwistTruth) return true;
  if (Array.isArray(row.unlockedThemePackIds) && row.unlockedThemePackIds.length > 0) {
    return true;
  }
  return false;
}

export function isFirstPaidEntitlementTransition(prevRow, nextRow) {
  return (
    !entitlementsIndicatePaidPurchase(prevRow) &&
    entitlementsIndicatePaidPurchase(nextRow)
  );
}
