import { useState } from 'react';
import { SiteLegalLinks } from './SiteLegalLinks.jsx';

export function DeleteAccountSettingsPanel({
  cloudSignedIn = false,
  onDeleteAccount,
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!cloudSignedIn) {
    return (
      <div className="rounded-[1.75rem] border border-white/10 bg-black/30 p-5">
        <div className="font-black text-lg text-white/90">Account &amp; privacy</div>
        <p className="mt-2 text-sm text-white/70">
          Sign in with a cloud account to delete synced profile data from Settings, or use the web
          form below.
        </p>
        <SiteLegalLinks className="mt-4" />
      </div>
    );
  }

  async function submitDelete(event) {
    event.preventDefault();
    setError('');
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      setError('Type DELETE to confirm.');
      return;
    }
    setBusy(true);
    try {
      await onDeleteAccount?.({ password });
      setDone(true);
    } catch (err) {
      setError(String(err?.message || err || 'Could not delete account.'));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-[1.75rem] border border-emerald-400/30 bg-emerald-500/10 p-5 text-sm text-emerald-100">
        Your account was deleted and you have been signed out.
      </div>
    );
  }

  return (
    <div className="rounded-[1.75rem] border border-rose-400/25 bg-rose-500/10 p-5">
      <div className="font-black text-lg text-rose-100">Delete account</div>
      <p className="mt-2 text-sm text-white/75">
        Permanently removes your cloud account, profile stats, and entitlements on our servers.
        Google Play / Stripe purchase records stay with those stores as required by law.
      </p>
      <SiteLegalLinks className="mt-3" />
      {!open ? (
        <button
          type="button"
          className="mt-4 w-full rounded-2xl border border-rose-300/40 bg-rose-500/20 px-4 py-3 text-sm font-bold text-rose-50"
          onClick={() => setOpen(true)}
          data-testid="settings-delete-account-open"
        >
          Delete my account…
        </button>
      ) : (
        <form className="mt-4 space-y-3" onSubmit={submitDelete}>
          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-rose-200/80">
              Password (PoF accounts)
            </label>
            <input
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-rose-200/80">
              Type DELETE to confirm
            </label>
            <input
              type="text"
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>
          {error && (
            <div className="rounded-xl border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm text-red-100">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-xl border border-white/15 px-3 py-2 text-sm text-white/80"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-xl border border-rose-200/40 bg-rose-600/30 px-3 py-2 text-sm font-bold text-rose-50 disabled:opacity-60"
              data-testid="settings-delete-account-confirm"
            >
              {busy ? 'Deleting…' : 'Delete forever'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
