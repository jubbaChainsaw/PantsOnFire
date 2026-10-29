/** In-memory ring buffer of recent console errors for bug reports. */
const MAX_ENTRIES = 40;

const entries = [];

function pushEntry(level, message, detail = '') {
  entries.push({
    at: new Date().toISOString(),
    level,
    message: String(message || '').slice(0, 2000),
    detail: String(detail || '').slice(0, 4000),
  });
  while (entries.length > MAX_ENTRIES) entries.shift();
}

let installed = false;

export function installDiagnosticsLogCapture() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const prevError = console.error;
  const prevWarn = console.warn;
  console.error = (...args) => {
    pushEntry('error', args.map(String).join(' '), '');
    prevError(...args);
  };
  console.warn = (...args) => {
    pushEntry('warn', args.map(String).join(' '), '');
    prevWarn(...args);
  };
  window.addEventListener('error', (event) => {
    pushEntry('error', event.message || 'window.error', event.error?.stack || '');
  });
  window.addEventListener('unhandledrejection', (event) => {
    pushEntry(
      'error',
      'unhandledrejection',
      event.reason?.stack || String(event.reason || ''),
    );
  });
}

export function getDiagnosticsLogSnapshot() {
  return entries.map((e) => ({ ...e }));
}

export function clearDiagnosticsLog() {
  entries.length = 0;
}
