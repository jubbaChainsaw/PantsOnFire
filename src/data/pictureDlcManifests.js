import { PICTURE_DLC_MANIFESTS } from './generatedPictureDlcManifests';
export { PICTURE_DLC_MANIFESTS };

function toMediaSrc(basePath, mediaFile) {
  if (!basePath || !mediaFile) return null;
  return `${basePath.replace(/\/+$/, '')}/${String(mediaFile).replace(/^\/+/, '')}`;
}

export function buildPictureRoundsFromManifest(manifest) {
  if (!manifest || !Array.isArray(manifest.entries)) return [];
  return manifest.entries.map((entry, index) => ({
    hint: entry.hint || `Picture Prompt • ${entry.groupName || manifest.label} ${index + 1}`,
    main: entry.main,
    imposter: entry.imposter,
    picturePackId: manifest.id,
    previewLabel: entry.previewLabel || `Graphic pack clue from ${manifest.label}.`,
    mainImageSrc: toMediaSrc(manifest.basePath, entry.mainMediaFile),
    imposterImageSrc: toMediaSrc(manifest.basePath, entry.imposterMediaFile),
    ...(entry.adultOnly ? { adultOnly: true } : {}),
  }));
}

export function buildAllPictureDlcRounds() {
  return PICTURE_DLC_MANIFESTS
    .filter((manifest) => validatePictureDlcManifest(manifest))
    .flatMap((manifest) => buildPictureRoundsFromManifest(manifest));
}

export function validatePictureDlcManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') return false;
  if (!manifest.id || !manifest.category || !manifest.basePath || !manifest.label) return false;
  if (manifest.category !== 'picture') return false;
  if (!Array.isArray(manifest.entries) || manifest.entries.length === 0) return false;
  return manifest.entries.every((entry) => (
    entry &&
    typeof entry === 'object' &&
    entry.entryId &&
    entry.main &&
    entry.imposter &&
    entry.mainMediaFile &&
    entry.imposterMediaFile
  ));
}
