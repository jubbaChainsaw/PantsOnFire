import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { resolveAuthUserFromBearer } from './resolveAuthUser.js';
import {
  ALL_CONTENT_PACKS,
  CONTENT_PACK_ACCESS,
  getContentPackById,
  PUBLIC_CORE_PACKS,
  resolveContentPackFilePath,
} from './contentPackCatalog.js';
import { userMayDownloadContentPack } from './contentPackEntitlements.js';
import {
  buildSignedPackDownloadPath,
  createSignedPackDownloadToken,
  verifySignedPackDownloadToken,
} from './packDownloadSigning.js';
import { getShellConfig } from './shellConfig.js';

function packsRootDir() {
  return (
    String(process.env.CONTENT_PACKS_ROOT || '').trim() ||
    path.resolve(process.cwd(), 'dist/content-packs')
  );
}

function publicCdnBaseUrl() {
  return (
    String(process.env.CONTENT_PACK_PUBLIC_BASE_URL || '').trim() ||
    'https://www.pantsonfire.app/content-packs/public/'
  ).replace(/\/?$/, '/');
}

function apiPublicOrigin(req) {
  const fromEnv = String(process.env.POF_PUBLIC_API_ORIGIN || '').trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host') || '';
  if (!host) return '';
  return `${proto}://${host}`;
}

function loadPackMeta(pack) {
  const metaPath = path.join(
    packsRootDir(),
    pack.access === CONTENT_PACK_ACCESS.PUBLIC ? 'public' : 'protected',
    `${pack.id}-meta.json`,
  );
  if (!existsSync(metaPath)) return null;
  try {
    return JSON.parse(readFileSync(metaPath, 'utf8'));
  } catch {
    return null;
  }
}

export function mountContentPackRoutes(
  app,
  { entitlementStore, profileStore, referralStore } = {},
) {
  app.get('/api/shell-config', (_req, res) => {
    res.set('Cache-Control', 'public, max-age=60');
    res.json(getShellConfig());
  });

  /** Public catalog: free packs only (safe for CDN + join-only web). */
  app.get('/api/content-packs/manifest', (_req, res) => {
    const packs = PUBLIC_CORE_PACKS.map((pack) => {
      const meta = loadPackMeta(pack);
      return {
        id: pack.id,
        name: pack.name,
        kind: 'theme',
        themeSlug: pack.themeSlug,
        tier: 'free',
        access: CONTENT_PACK_ACCESS.PUBLIC,
        version: meta?.version || '1.0.0',
        sizeBytes: meta?.sizeBytes || 0,
        sha256: meta?.sha256 || '',
        file: meta?.file || pack.zipFile,
      };
    });
    res.json({
      version: 1,
      baseUrl: publicCdnBaseUrl(),
      packs,
    });
  });

  /** Protected pack metadata without download URLs (native app UI). */
  app.get('/api/content-packs/protected', (_req, res) => {
    res.json({
      packs: ALL_CONTENT_PACKS.filter((p) => p.access === CONTENT_PACK_ACCESS.PROTECTED).map(
        (pack) => ({
          id: pack.id,
          name: pack.name,
          entitlementPackId: pack.entitlementPackId,
          tier: 'paid',
          access: CONTENT_PACK_ACCESS.PROTECTED,
          unlockSource: pack.unlockSource,
        }),
      ),
    });
  });

  app.get('/api/me/packs/:packId/download', async (req, res) => {
    const resolved = await resolveAuthUserFromBearer(req);
    if (resolved.error) {
      const status =
        resolved.error === 'missing-token'
          ? 401
          : resolved.error === 'server-auth-not-configured'
            ? 503
            : 401;
      res.status(status).json({ error: resolved.error });
      return;
    }

    const packId = String(req.params.packId || '').trim();
    const allowed = await userMayDownloadContentPack(packId, resolved.userId, {
      entitlementStore,
      profileStore,
      referralStore,
    });
    if (!allowed.ok) {
      const status = allowed.error === 'pack-not-found' ? 404 : 403;
      res.status(status).json({ error: allowed.error || 'forbidden' });
      return;
    }

    const pack = allowed.pack;
    const meta = loadPackMeta(pack);

    if (pack.access === CONTENT_PACK_ACCESS.PUBLIC) {
      const file = meta?.file || pack.zipFile;
      res.json({
        mode: 'public',
        url: `${publicCdnBaseUrl()}${file.replace(/^\//, '')}`,
        expiresAt: null,
        sizeBytes: meta?.sizeBytes || 0,
        sha256: meta?.sha256 || '',
        version: meta?.version || '1.0.0',
      });
      return;
    }

    const signed = createSignedPackDownloadToken({
      userId: resolved.userId,
      packId: pack.id,
    });
    if (signed.error) {
      res.status(503).json({ error: signed.error });
      return;
    }

    const downloadUrl = buildSignedPackDownloadPath(signed.token, {
      apiPublicOrigin: apiPublicOrigin(req),
    });

    res.json({
      mode: 'signed',
      url: downloadUrl,
      expiresAt: signed.expiresAt,
      sizeBytes: meta?.sizeBytes || 0,
      sha256: meta?.sha256 || '',
      version: meta?.version || '1.0.0',
    });
  });

  app.get('/api/content-packs/signed-download', async (req, res) => {
    const token = String(req.query.token || '').trim();
    const verified = verifySignedPackDownloadToken(token);
    if (verified.error) {
      res.status(403).json({ error: verified.error });
      return;
    }

    const allowed = await userMayDownloadContentPack(verified.packId, verified.userId, {
      entitlementStore,
      profileStore,
      referralStore,
    });
    if (!allowed.ok) {
      res.status(403).json({ error: allowed.error || 'forbidden' });
      return;
    }

    const pack = getContentPackById(verified.packId);
    const filePath = resolveContentPackFilePath(pack, packsRootDir());
    if (!filePath || !existsSync(filePath)) {
      res.status(404).json({ error: 'pack-file-missing' });
      return;
    }

    const stat = statSync(filePath);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Length', String(stat.size));
    res.setHeader('Cache-Control', 'private, no-store');
    createReadStream(filePath).pipe(res);
  });
}
