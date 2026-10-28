import { getLobbyApiBase } from '../lib/lobbyApiEnv.js';

/**
 * @param {'tier'|'addon'|'dlc'} kind
 * @param {string} productId tierId, addon id, or dlc pack id
 * @param {string} accessToken Supabase JWT
 */
export async function startWebStripeCheckout(kind, productId, accessToken) {
  const res = await fetch(`${getLobbyApiBase()}/billing/stripe/checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
    body: JSON.stringify({ kind, productId }),
  });
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  if (!res.ok) {
    const code = payload?.error || `checkout-http-${res.status}`;
    throw new Error(code);
  }
  const url = String(payload?.url || '').trim();
  if (!url) throw new Error('checkout-url-missing');
  window.location.assign(url);
}

export function webCheckoutSku(kind, productId) {
  return `${kind}:${productId}`;
}
