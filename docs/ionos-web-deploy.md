# Deploy www.pantsonfire.app to IONOS (SFTP)

## Hosting

| Item | Detail |
|------|--------|
| **Domain** | `www.pantsonfire.app` / `pantsonfire.app` |
| **Provider** | IONOS (Martin) |
| **App** | Same React + Vite client as the game (`npm run build` → `dist/`) |
| **Lobby API** | `https://api.pantsonfire.app` (Railway; CORS allows pantsonfire web origins) |
| **CI** | `.github/workflows/deploy-ionos-web.yml` |

The workflow builds the **web** bundle (not `build:mobile`), sets `VITE_WEB_JOIN_ONLY=true` and `VITE_LOBBY_SERVER_URL=https://api.pantsonfire.app`, then uploads `dist/` via SFTP.

`public/.htaccess` is copied into `dist/` for Apache SPA routing on IONOS.

## Triggers

- **Push to `main`** — deploys automatically after merge (once secrets are set).
- **`workflow_dispatch`** — manual run from GitHub → Actions → *Deploy web to IONOS (SFTP)*.

## GitHub Actions secrets

Configure under **Settings → Secrets and variables → Actions** (repository secrets).

### IONOS SFTP (required for upload)

| Secret | Required | Notes |
|--------|----------|--------|
| `IONOS_SFTP_HOST` | Yes | SFTP hostname from IONOS |
| `IONOS_SFTP_USER` | Yes | SFTP username |
| `IONOS_SFTP_REMOTE_DIR` | Yes | Web root on server, e.g. `/` or `/htdocs/` (trailing slash recommended) |
| `IONOS_SFTP_PASSWORD` | One of password **or** key | SFTP password |
| `IONOS_SFTP_KEY` | One of password **or** key | Private key (PEM), for key-based auth |
| `IONOS_SFTP_PORT` | No | Defaults to **22** if unset |

Build already sets `VITE_WEB_JOIN_ONLY=true` and `VITE_LOBBY_SERVER_URL=https://api.pantsonfire.app`. **No Supabase secrets** are required on IONOS.

**Accounts, entitlements, and Stripe (web shop)** run on the **lobby server** at `https://api.pantsonfire.app` (Railway) — see `docs/WEB_ENTITLEMENTS.md` and `docs/POF_CLOUD_AUTH.md`.

These are baked in at **build time** (not runtime on IONOS).

## First-time checklist (Martin)

1. Add all secrets above in GitHub.
2. Confirm IONOS web space uses **Apache** with `mod_rewrite` (for `.htaccess`).
3. Merge the workflow PR to `main` **or** run **workflow_dispatch** once secrets exist.
4. Open `https://www.pantsonfire.app` and verify join flow + shop (no production code change until you choose to merge/run).

## Local smoke build (join-only web)

```bash
VITE_LOBBY_SERVER_URL=https://api.pantsonfire.app VITE_WEB_JOIN_ONLY=true npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```
