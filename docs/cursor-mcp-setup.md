# Cursor MCP setup (Pants on Fire)

This repo ships [Model Context Protocol](https://modelcontextprotocol.io) servers in [`.cursor/mcp.json`](../.cursor/mcp.json) so Cursor agents can use GitHub, browser automation, Supabase, and Railway without you pasting logs or clicking through dashboards for every task.

## One-time setup in Cursor

1. **Reload MCP** — Open the project in Cursor, then fully restart Cursor (or use **Settings → Tools & MCP** and refresh servers).
2. **Check status** — **Settings → Tools & MCP**. Each server should show a green connected state after auth (see below).
3. **Enable tools in chat** — In Agent/Composer, confirm the MCP tools you want are enabled for the session.

## Servers in this project

| Server | Purpose | What you must do |
|--------|---------|------------------|
| **github** | Issues, PRs, Actions, repo search | Set `GITHUB_PERSONAL_ACCESS_TOKEN` (see below) |
| **playwright** | Click through Vite UI, lobby flows, regressions | Run `npm run dev` (+ `npm run lobby:server` for online tests). First run may download browsers via `npx`. |
| **supabase** | Schema, SQL (read-only), docs | Sign in via browser OAuth when Cursor prompts (Supabase dashboard MCP tab also works) |
| **railway** | Lobby deploy logs, env, services | Sign in via browser OAuth at [railway.com/mcp](https://railway.com/mcp) when prompted |

## GitHub token

Create a [fine-grained](https://github.com/settings/personal-access-tokens/new) or classic PAT for the **PantsOnFire** repo with at least:

- Repository: Contents (read), Issues (read/write if you want me to triage), Pull requests (read/write)
- Actions: Read (for CI log inspection)
- Metadata: Read

Export it in your shell profile or Cursor environment (do **not** commit it):

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="github_pat_..."
```

Cursor resolves `${env:GITHUB_PERSONAL_ACCESS_TOKEN}` from [`.cursor/mcp.json`](../.cursor/mcp.json).

Alternative: paste the token in **Settings → Tools & MCP → github → Edit** if your client supports overriding headers there.

## Supabase (optional project lock)

Default config uses **read-only** tools and OAuth. To scope to one project, change the `supabase` URL in `.cursor/mcp.json`:

```text
https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF&read_only=true&features=database,docs,development
```

`YOUR_PROJECT_REF` is the subdomain in `https://YOUR_PROJECT_REF.supabase.co` (same as `VITE_SUPABASE_URL`).

For headless/CI-style auth instead of OAuth, use a [Supabase access token](https://supabase.com/dashboard/account/tokens) and add:

```json
"headers": {
  "Authorization": "Bearer ${env:SUPABASE_ACCESS_TOKEN}"
}
```

## Playwright

- Config: [`.cursor/playwright-mcp.json`](../.cursor/playwright-mcp.json) — allows `http://localhost:*` for Vite (`5173`) and the lobby proxy.
- Typical test flow: `npm run lobby:server` in one terminal, `npm run dev` in another, then ask the agent to open `http://localhost:5173`.
- Traces/screenshots can be saved under `.cursor/playwright-output/` (gitignored).

## Railway

Uses the hosted server at `https://mcp.railway.com` (OAuth). No API key in the repo. Useful for debugging production lobby (`docs/railway-deploy.md`).

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| GitHub tools missing / 401 | Set or refresh `GITHUB_PERSONAL_ACCESS_TOKEN`; restart Cursor |
| Playwright won’t start | Run `npx -y @playwright/mcp@latest --help` once; ensure Node 18+ |
| Supabase stuck disconnected | Complete OAuth in browser; check org access to the project |
| Railway stuck disconnected | Approve at [railway.com/mcp](https://railway.com/mcp); confirm account owns the lobby service |
| MCP JSON changes ignored | Restart Cursor after editing `.cursor/mcp.json` |

## Security

- Never commit PATs or Supabase service role keys into `.cursor/mcp.json`.
- Supabase MCP is configured **read-only** by default; remove `read_only=true` only if you explicitly want write/migration tools.
- Playwright can drive any allowed origin; keep `allowedOrigins` tight if you add staging URLs.
