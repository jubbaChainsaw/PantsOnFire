import dlcPersonaRoster from './dlcPersonaRoster.json' with { type: 'json' };

function buildPools() {
  /** @type {Record<string, Array<{ id: string, name: string, bio: string, imageSrc: string }>>} */
  const pools = {};
  for (const [themeName, rows] of Object.entries(dlcPersonaRoster)) {
    pools[themeName] = (rows || []).map(({ id, name, bio, imageSrc }) => ({
      id,
      name,
      bio,
      imageSrc,
    }));
  }
  return pools;
}

/** Curated DLC persona pools (replaces procedural generation for these themes). */
export const DLC_CURATED_THEME_PERSONA_POOLS = buildPools();
