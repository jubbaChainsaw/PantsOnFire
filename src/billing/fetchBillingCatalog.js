import { getLobbyApiBase } from '../lib/lobbyApiEnv.js';

/** @typedef {{ tiers: Record<string,string>, addonTwistTruth: string, dlcPack: string }} BillingCatalog */

/**
 * @returns {Promise<BillingCatalog | null>}
 */
export async function fetchBillingCatalog() {
  try {
    const res = await fetch(`${getLobbyApiBase()}/billing/catalog`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
