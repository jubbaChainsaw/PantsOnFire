import { getDiagnosticsLogSnapshot } from './diagnosticsLog.js';

const QUEUE_KEY = 'pof-bug-report-queue-v1';

/** One-way fingerprint for lobby codes (not reversible). */
export function anonymizeLobbyId(raw = '') {
  const value = String(raw || '').trim().toUpperCase();
  if (!value) return '';
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `lobby_${(hash >>> 0).toString(36)}`;
}

function readQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-20)));
  } catch {
    /* ignore quota */
  }
}

export function getBugReportApiBase() {
  const fromEnv = String(import.meta.env.VITE_BUG_REPORT_API_URL || '').trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

export function buildBugReportPayload({
  description,
  screenshotDataUrl = '',
  context = {},
  diagnostics = {},
}) {
  return {
    description: String(description || '').trim(),
    screenshotDataUrl: screenshotDataUrl || null,
    context,
    diagnostics: {
      ...diagnostics,
      recentLogs: getDiagnosticsLogSnapshot(),
    },
    submittedAt: new Date().toISOString(),
  };
}

export async function submitBugReport(payload) {
  const base = getBugReportApiBase();
  const url = `${base}/api/bug-reports`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Bug report failed (${res.status})`);
  }
  return res.json().catch(() => ({ ok: true }));
}

export async function flushBugReportQueue() {
  const queue = readQueue();
  if (!queue.length) return { flushed: 0 };
  const remaining = [];
  let flushed = 0;
  for (const item of queue) {
    try {
      await submitBugReport(item);
      flushed += 1;
    } catch {
      remaining.push(item);
    }
  }
  writeQueue(remaining);
  return { flushed, pending: remaining.length };
}

export async function submitBugReportWithQueue(payload) {
  try {
    const result = await submitBugReport(payload);
    void flushBugReportQueue();
    return { ok: true, queued: false, result };
  } catch (err) {
    const queue = readQueue();
    queue.push(payload);
    writeQueue(queue);
    return { ok: false, queued: true, error: String(err?.message || err) };
  }
}
