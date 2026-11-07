const HEX_SHA256 = /^[a-f0-9]{64}$/i;

/**
 * @typedef {object} ContentPackEntry
 * @property {string} id
 * @property {string} name
 * @property {'theme'|'picture'|'bundle'} kind
 * @property {string} [themeSlug]
 * @property {string} [entitlementPackId]
 * @property {'free'|'paid'} tier
 * @property {'public'|'protected'} [access]
 * @property {string} version
 * @property {number} sizeBytes
 * @property {string} sha256
 * @property {string} file
 */

/**
 * @param {unknown} raw
 * @returns {{ version: number, baseUrl: string, packs: ContentPackEntry[] }}
 */
export function parseContentPackManifest(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('manifest-not-object');
  }
  const version = Number(raw.version);
  if (!Number.isFinite(version) || version < 1) {
    throw new Error('manifest-invalid-version');
  }
  const baseUrl = String(raw.baseUrl || '').trim();
  if (!baseUrl) throw new Error('manifest-missing-baseUrl');
  const packsRaw = Array.isArray(raw.packs) ? raw.packs : [];
  const packs = packsRaw.map((entry, index) => parsePackEntry(entry, index));
  return { version, baseUrl: baseUrl.replace(/\/?$/, '/'), packs };
}

function parsePackEntry(entry, index) {
  if (!entry || typeof entry !== 'object') {
    throw new Error(`manifest-pack-${index}-not-object`);
  }
  const id = String(entry.id || '').trim();
  if (!id) throw new Error(`manifest-pack-${index}-missing-id`);
  const name = String(entry.name || id).trim();
  const kind = String(entry.kind || 'theme');
  const tier = entry.tier === 'paid' ? 'paid' : 'free';
  const access = entry.access === 'protected' ? 'protected' : 'public';
  const version = String(entry.version || '1.0.0');
  const sizeBytes = Number(entry.sizeBytes);
  if (!Number.isFinite(sizeBytes) || sizeBytes < 0) {
    throw new Error(`manifest-pack-${id}-invalid-size`);
  }
  const sha256 = String(entry.sha256 || '').trim().toLowerCase();
  const file = String(entry.file || '').trim();
  if (access === 'public') {
    if (!HEX_SHA256.test(sha256)) {
      throw new Error(`manifest-pack-${id}-invalid-sha256`);
    }
    if (!file) throw new Error(`manifest-pack-${id}-missing-file`);
  }
  return {
    id,
    name,
    kind,
    themeSlug: entry.themeSlug ? String(entry.themeSlug) : undefined,
    entitlementPackId: entry.entitlementPackId
      ? String(entry.entitlementPackId)
      : undefined,
    tier,
    access,
    version,
    sizeBytes,
    sha256: sha256 || '',
    file: file || undefined,
  };
}

/**
 * @param {ContentPackEntry[]} packs
 * @param {{ unlockedPackIds?: string[], includePaidPreview?: boolean }} options
 */
export function filterDownloadablePacks(packs, options = {}) {
  const unlocked = new Set(options.unlockedPackIds || []);
  return packs.filter((pack) => {
    if (pack.tier !== 'paid' && pack.access !== 'protected') return true;
    const entitlement = pack.entitlementPackId || pack.id.replace(/^dlc-/, '');
    return unlocked.has(entitlement);
  });
}

export function isProtectedContentPack(pack) {
  return pack?.access === 'protected' || pack?.tier === 'paid';
}

export function sumPackBytes(packs) {
  return packs.reduce((sum, pack) => sum + (pack.sizeBytes || 0), 0);
}

export function packDownloadUrl(manifest, pack) {
  if (isProtectedContentPack(pack) || !pack?.file) return '';
  const file = String(pack.file || '').replace(/^\//, '');
  return `${manifest.baseUrl}${file}`;
}

export function formatPackSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
