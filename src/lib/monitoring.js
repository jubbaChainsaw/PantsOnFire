/**
 * Client-side error monitoring and analytics.
 *
 * Two independent sinks, both optional and safe to leave unconfigured:
 *
 * 1. Sentry — full error tracking with stack traces and release tagging.
 *    Enabled only when VITE_SENTRY_DSN is set. The SDK is loaded via dynamic
 *    import so it costs nothing in the bundle when unused.
 *
 * 2. Server telemetry — lightweight fallback that POSTs errors and analytics
 *    events to the lobby server (`/api/telemetry/*`), where they are written
 *    as structured JSON logs. Works out of the box with no third-party
 *    account; disable with VITE_TELEMETRY_DISABLED="true".
 *
 * All reporting is fire-and-forget: monitoring must never break the game.
 */

import { getLobbyApiBase, getLobbyConfigError } from './lobbyApiEnv.js';

const MAX_ERRORS_PER_SESSION = 20;
const MAX_EVENTS_PER_SESSION = 200;
const MAX_STRING_LENGTH = 2000;

let initialized = false;
let sentryClient = null;
let errorsSent = 0;
let eventsSent = 0;
let sessionId = '';

function isTelemetryEnabled() {
  if (import.meta.env?.VITE_TELEMETRY_DISABLED === 'true') return false;
  // Without a lobby server to receive telemetry there is nowhere to send it.
  if (getLobbyConfigError()) return false;
  return true;
}

function truncate(value) {
  return String(value ?? '').slice(0, MAX_STRING_LENGTH);
}

function newSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function postTelemetry(path, payload) {
  if (!isTelemetryEnabled()) return;
  try {
    const body = JSON.stringify(payload);
    const url = `${getLobbyApiBase()}${path}`;
    // sendBeacon survives page unloads and never throws on network failure.
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
      return;
    }
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Never let telemetry break the app.
  }
}

/**
 * Report an error to all configured sinks.
 * @param {unknown} error
 * @param {{ source?: string, extra?: Record<string, unknown> }} [context]
 */
export function captureError(error, context = {}) {
  try {
    if (sentryClient) {
      sentryClient.captureException(error, { extra: context.extra });
    }
    if (errorsSent >= MAX_ERRORS_PER_SESSION) return;
    errorsSent += 1;
    postTelemetry('/telemetry/client-errors', {
      sessionId,
      source: truncate(context.source || 'manual'),
      message: truncate(error?.message || error),
      stack: truncate(error?.stack || ''),
      url: typeof window !== 'undefined' ? truncate(window.location?.href) : '',
      userAgent: typeof navigator !== 'undefined' ? truncate(navigator.userAgent) : '',
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Never let telemetry break the app.
  }
}

/**
 * Track a product analytics event, e.g. trackEvent('online_lobby_created').
 * Event names should be lowercase snake_case. Props must be JSON-serialisable
 * and must never contain personal data (names, emails, message text).
 * @param {string} name
 * @param {Record<string, string | number | boolean>} [props]
 */
export function trackEvent(name, props = {}) {
  try {
    if (eventsSent >= MAX_EVENTS_PER_SESSION) return;
    eventsSent += 1;
    postTelemetry('/telemetry/events', {
      sessionId,
      name: truncate(name),
      props,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Never let telemetry break the app.
  }
}

/**
 * Install global error handlers and (optionally) Sentry.
 * Call once from the app entry point, before rendering.
 */
export function initMonitoring() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  sessionId = newSessionId();

  window.addEventListener('error', (event) => {
    captureError(event.error || new Error(truncate(event.message)), { source: 'window.onerror' });
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason instanceof Error ? event.reason : new Error(truncate(event.reason));
    captureError(reason, { source: 'unhandledrejection' });
  });

  const dsn = String(import.meta.env?.VITE_SENTRY_DSN || '').trim();
  if (dsn) {
    import('@sentry/react')
      .then((Sentry) => {
        Sentry.init({
          dsn,
          environment: import.meta.env?.PROD ? 'production' : 'development',
          // Modest sampling defaults for a party game; tune via Sentry UI.
          tracesSampleRate: 0.1,
          replaysSessionSampleRate: 0,
          replaysOnErrorSampleRate: 0.1,
        });
        sentryClient = Sentry;
      })
      .catch(() => {
        // Sentry failing to load must never block the game.
      });
  }

  trackEvent('app_loaded', {
    prod: Boolean(import.meta.env?.PROD),
  });
}
