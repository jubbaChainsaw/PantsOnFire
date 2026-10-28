import { getLobbyApiBase } from '../lib/lobbyApiEnv.js';

const SIMULATE_CLIENT =
  String(import.meta.env?.VITE_BILLING_SIMULATE ?? '').trim().toLowerCase() === 'true' ||
  String(import.meta.env?.VITE_BILLING_SIMULATE ?? '').trim() === '1';

export function isWebBillingSimulateEnabled() {
  return SIMULATE_CLIENT;
}

export async function simulateWebPurchase(kind, productId, userId) {
  const res = await fetch(`${getLobbyApiBase()}/billing/simulate-purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ kind, productId, userId }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || `simulate-http-${res.status}`);
  }
  return payload?.entitlements || null;
}
