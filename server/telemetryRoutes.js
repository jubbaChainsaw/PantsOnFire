/**
 * Telemetry ingestion for client errors and analytics events.
 *
 * Payloads are validated, size-capped, rate-limited per IP, and written to
 * stdout as structured JSON lines (prefix `[telemetry]`). Any log platform
 * (Railway, Datadog, CloudWatch, grep) can filter and aggregate them.
 *
 * This is intentionally storage-free: it gives production visibility with
 * zero third-party accounts. Teams that adopt Sentry/PostHog later can keep
 * or drop these endpoints independently.
 */

const MAX_BODY_STRING = 2000;
const ERRORS_PER_MINUTE_PER_IP = 10;
const EVENTS_PER_MINUTE_PER_IP = 60;
const RATE_WINDOW_MS = 60_000;
const MAX_TRACKED_IPS = 10_000;

function createRateLimiter(maxPerWindow) {
  const hits = new Map();

  function isAllowed(key) {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now - entry.windowStart >= RATE_WINDOW_MS) {
      // Guard the map size against IP-rotation abuse.
      if (hits.size >= MAX_TRACKED_IPS) hits.clear();
      hits.set(key, { windowStart: now, count: 1 });
      return true;
    }
    if (entry.count >= maxPerWindow) return false;
    entry.count += 1;
    return true;
  }

  return { isAllowed };
}

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket?.remoteAddress || 'unknown';
}

function str(value) {
  return String(value ?? '').slice(0, MAX_BODY_STRING);
}

function sanitizeProps(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  let count = 0;
  for (const [key, value] of Object.entries(raw)) {
    if (count >= 20) break;
    const type = typeof value;
    if (type === 'string') out[str(key)] = str(value).slice(0, 200);
    else if (type === 'number' || type === 'boolean') out[str(key)] = value;
    count += 1;
  }
  return out;
}

export function mountTelemetryRoutes(app) {
  const errorLimiter = createRateLimiter(ERRORS_PER_MINUTE_PER_IP);
  const eventLimiter = createRateLimiter(EVENTS_PER_MINUTE_PER_IP);

  app.post('/api/telemetry/client-errors', (req, res) => {
    if (!errorLimiter.isAllowed(clientIp(req))) {
      res.status(429).json({ error: 'rate-limited' });
      return;
    }
    const body = req.body || {};
    // eslint-disable-next-line no-console
    console.log(
      '[telemetry] client-error',
      JSON.stringify({
        sessionId: str(body.sessionId),
        source: str(body.source),
        message: str(body.message),
        stack: str(body.stack),
        url: str(body.url),
        userAgent: str(body.userAgent),
        clientTimestamp: str(body.timestamp),
        receivedAt: new Date().toISOString(),
      }),
    );
    res.json({ ok: true });
  });

  app.post('/api/telemetry/events', (req, res) => {
    if (!eventLimiter.isAllowed(clientIp(req))) {
      res.status(429).json({ error: 'rate-limited' });
      return;
    }
    const body = req.body || {};
    const name = str(body.name).trim();
    if (!name) {
      res.status(400).json({ error: 'event-name-required' });
      return;
    }
    // eslint-disable-next-line no-console
    console.log(
      '[telemetry] event',
      JSON.stringify({
        sessionId: str(body.sessionId),
        name,
        props: sanitizeProps(body.props),
        clientTimestamp: str(body.timestamp),
        receivedAt: new Date().toISOString(),
      }),
    );
    res.json({ ok: true });
  });
}

export { createRateLimiter, sanitizeProps };
