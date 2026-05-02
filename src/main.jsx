import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

const rootElement = document.getElementById('root');

function renderBootstrapError(error) {
  const message = String(error?.message || error || 'Unknown startup error');
  const stack = String(error?.stack || '');
  if (!rootElement) return;
  rootElement.innerHTML = `
    <div style="min-height:100vh;background:#0b1233;color:#f8fafc;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
      <div style="max-width:760px;width:100%;border:1px solid rgba(255,255,255,0.18);background:rgba(0,0,0,0.35);border-radius:18px;padding:20px;text-align:left;">
        <h1 style="margin:0 0 10px 0;font-size:22px;">App failed to start</h1>
        <p style="margin:0 0 12px 0;opacity:0.9;">A runtime error occurred while loading the game UI.</p>
        <pre style="white-space:pre-wrap;word-break:break-word;background:rgba(2,6,23,0.85);padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);font-size:12px;line-height:1.4;">${message}${stack ? `\n\n${stack}` : ''}</pre>
        <button onclick="location.reload()" style="margin-top:12px;border:1px solid rgba(255,255,255,0.3);background:#facc15;color:#111827;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;">Reload</button>
      </div>
    </div>
  `;
}

async function bootstrap() {
  try {
    const { default: App } = await import('./App.jsx');
    if (!rootElement) throw new Error('Root element #root not found');
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('[bootstrap] Failed to load app', error);
    renderBootstrapError(error);
  }
}

bootstrap();
