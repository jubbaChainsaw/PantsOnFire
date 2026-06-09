import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

const rootElement = document.getElementById('root');

function createErrorScreen({ title, subtitle, message, stack }) {
  const applyStyle = (el, styles) => Object.assign(el.style, styles);

  const outer = document.createElement('div');
  applyStyle(outer, {
    minHeight: '100vh',
    background: '#0b1233',
    color: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
  });

  const card = document.createElement('div');
  applyStyle(card, {
    maxWidth: '760px',
    width: '100%',
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(0,0,0,0.35)',
    borderRadius: '18px',
    padding: '20px',
    textAlign: 'left',
  });

  const heading = document.createElement('h1');
  applyStyle(heading, { margin: '0 0 10px 0', fontSize: '22px' });
  heading.textContent = title;

  const desc = document.createElement('p');
  applyStyle(desc, { margin: '0 0 12px 0', opacity: '0.9' });
  desc.textContent = subtitle;

  const pre = document.createElement('pre');
  applyStyle(pre, {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    background: 'rgba(2,6,23,0.85)',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    fontSize: '12px',
    lineHeight: '1.4',
  });
  pre.textContent = stack ? `${message}\n\n${stack}` : message;

  const btn = document.createElement('button');
  applyStyle(btn, {
    marginTop: '12px',
    border: '1px solid rgba(255,255,255,0.3)',
    background: '#facc15',
    color: '#111827',
    borderRadius: '10px',
    padding: '10px 14px',
    fontWeight: '700',
    cursor: 'pointer',
  });
  btn.textContent = 'Reload';
  btn.addEventListener('click', () => window.location.reload());

  card.appendChild(heading);
  card.appendChild(desc);
  card.appendChild(pre);
  card.appendChild(btn);
  outer.appendChild(card);
  return outer;
}

function renderBootstrapError(error) {
  const message = String(error?.message || error || 'Unknown startup error');
  const stack = String(error?.stack || '');
  if (!rootElement) return;
  while (rootElement.firstChild) rootElement.removeChild(rootElement.firstChild);
  rootElement.appendChild(
    createErrorScreen({
      title: 'App failed to start',
      subtitle: 'A runtime error occurred while loading the game UI.',
      message,
      stack,
    }),
  );
}

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.error('[RootErrorBoundary] Render crash', error);
  }

  render() {
    if (this.state.error) {
      const error = this.state.error;
      const message = String(error?.message || error || 'Unknown render error');
      const stack = String(error?.stack || '');
      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#0b1233',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: 760,
              width: '100%',
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(0,0,0,0.35)',
              borderRadius: 18,
              padding: 20,
              textAlign: 'left',
            }}
          >
            <h1 style={{ margin: '0 0 10px 0', fontSize: 22 }}>UI render failed</h1>
            <p style={{ margin: '0 0 12px 0', opacity: 0.9 }}>
              A runtime error occurred while rendering the app.
            </p>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                background: 'rgba(2,6,23,0.85)',
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: 12,
                lineHeight: 1.4,
              }}
            >
              {message}
              {stack ? `\n\n${stack}` : ''}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 12,
                border: '1px solid rgba(255,255,255,0.3)',
                background: '#facc15',
                color: '#111827',
                borderRadius: 10,
                padding: '10px 14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

async function bootstrap() {
  try {
    const { AuthProvider } = await import('./auth/AuthProvider.jsx');
    const { default: App } = await import('./App.jsx');
    if (!rootElement) throw new Error('Root element #root not found');
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <RootErrorBoundary>
          <AuthProvider>
            <App />
          </AuthProvider>
        </RootErrorBoundary>
      </React.StrictMode>,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[bootstrap] Failed to load app', error);
    renderBootstrapError(error);
  }
}

bootstrap();
