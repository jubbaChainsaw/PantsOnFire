/**
 * Server-side rule: only native app shells may create or run hosted lobbies.
 * Browser clients on www may join only.
 *
 * Strength today: HMAC install token minted only when the request presents
 * X-PoF-Client-Surface: native-shell and is not a production-web Origin.
 * Tokens can be replayed by anyone who obtains one; the secret is not in the
 * public web bundle. Recommend Play Integrity (Android) + App Attest (iOS)
 * before minting tokens in production.
 */

import { verifyAppInstallToken } from './appInstallToken.js';

export const CLIENT_SURFACE_HEADER = 'x-pof-client-surface';
export const APP_INSTALL_TOKEN_HEADER = 'x-pof-app-install-token';
export const APP_PLATFORM_HEADER = 'x-pof-app-platform';
export const SHELL_VERSION_HEADER = 'x-pof-shell-version';
export const NATIVE_SHELL_SURFACE = 'native-shell';

const PRODUCTION_WEB_HOSTS = new Set(['pantsonfire.app', 'www.pantsonfire.app']);

export function isHostingEnforcementEnabled() {
  const raw = String(process.env.POF_ENFORCE_APP_HOSTING ?? '1').trim().toLowerCase();
  return raw !== '0' && raw !== 'false' && raw !== 'off';
}

function hostnameFromUrl(raw) {
  try {
    const url = new URL(String(raw || '').trim());
    return String(url.hostname || '').toLowerCase();
  } catch {
    return '';
  }
}

export function requestOriginHost(req) {
  const originHost = hostnameFromUrl(req.headers.origin);
  if (originHost) return originHost;
  return hostnameFromUrl(req.headers.referer);
}

export function isProductionWebOrigin(req) {
  return PRODUCTION_WEB_HOSTS.has(requestOriginHost(req));
}

export function isLocalDevOrigin(req) {
  const host = requestOriginHost(req);
  if (!host) return false;
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost');
}

export function readClientSurface(req) {
  return String(req.headers[CLIENT_SURFACE_HEADER] || '').trim().toLowerCase();
}

export function verifyHostingCredentials(req) {
  if (!isHostingEnforcementEnabled()) {
    return { ok: true, reason: 'enforcement-disabled' };
  }

  const allowLocal =
    String(process.env.POF_ALLOW_LOCAL_WEB_HOST ?? '1').trim().toLowerCase() !== '0';
  if (allowLocal && isLocalDevOrigin(req)) {
    return { ok: true, reason: 'local-dev-origin' };
  }

  const e2eBypass = String(process.env.POF_E2E_HOST_BYPASS || '').trim();
  if (e2eBypass && String(req.headers['x-pof-e2e-host-bypass'] || '') === e2eBypass) {
    return { ok: true, reason: 'e2e-bypass' };
  }

  const surface = readClientSurface(req);
  const token = String(req.headers[APP_INSTALL_TOKEN_HEADER] || '').trim();

  if (surface === NATIVE_SHELL_SURFACE && token) {
    const verified = verifyAppInstallToken(token);
    if (!verified.error) {
      return { ok: true, reason: 'app-install-token', ...verified };
    }
    return { ok: false, error: 'invalid-app-install-token', detail: verified.error };
  }

  if (isProductionWebOrigin(req)) {
    return { ok: false, error: 'hosting-web-only' };
  }

  if (surface === 'web') {
    return { ok: false, error: 'hosting-web-only' };
  }

  return { ok: false, error: 'app-hosting-required' };
}

/** @returns {boolean} true when the request may proceed */
export function assertMayHostLobby(req, res) {
  const check = verifyHostingCredentials(req);
  if (check.ok) return true;
  res.status(403).json({ error: check.error || 'hosting-forbidden' });
  return false;
}

/** Mint endpoint: block browser origins on production web. */
export function assertMayMintAppInstallToken(req, res) {
  if (isProductionWebOrigin(req)) {
    res.status(403).json({ error: 'install-token-web-forbidden' });
    return false;
  }
  if (readClientSurface(req) !== NATIVE_SHELL_SURFACE) {
    res.status(403).json({ error: 'native-shell-required' });
    return false;
  }
  return true;
}
