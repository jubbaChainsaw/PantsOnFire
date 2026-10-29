/**
 * Data-driven achievements — extend this list to add modes, packs, or backs.
 * Progress uses profile.stats + derived counts from profileModel helpers.
 */
export const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'fresh-pants',
    name: 'Fresh Pants',
    description: 'Finish your first full game. The lies were free samples.',
    metric: 'gamesPlayed',
    target: 1,
    reward: { type: 'defaultBack', slug: 'flaming-pants' },
  },
  {
    id: 'welcome-host',
    name: 'Mic, Mat, Mayhem',
    description: 'Host your first game. Someone had to enable chaos.',
    metric: 'gamesHosted',
    target: 1,
    reward: null,
  },
  {
    id: 'first-verdict',
    name: 'Gut Feeling',
    description: 'Vote correctly once. Statistically, you might be a wizard.',
    metric: 'votesCorrect',
    target: 1,
    reward: null,
  },
  {
    id: 'trust-me-innocent',
    name: "Trust Me, I'm Innocent",
    description: 'Get accused while innocent 10 times. You look guilty and we respect the commitment.',
    metric: 'timesAccusedInnocent',
    target: 10,
    reward: { type: 'defaultBack', slug: 'lie-detector' },
  },
  {
    id: 'smooth-operator',
    name: 'Smooth Operator',
    description: 'Survive as the liar 10 times without getting caught.',
    metric: 'timesLiarNotCaught',
    target: 10,
    reward: { type: 'defaultBack', slug: 'spy-dossier' },
  },
  {
    id: 'human-lie-detector',
    name: 'Human Lie Detector',
    description: 'Vote correctly 25 times. Polygraphs hate this one trick.',
    metric: 'votesCorrect',
    target: 25,
    reward: { type: 'defaultBack', slug: 'neon-casino' },
  },
  {
    id: 'host-with-the-most',
    name: 'Host With The Most',
    description: 'Host 10 full games. Your living room is basically a franchise.',
    metric: 'gamesHosted',
    target: 10,
    reward: { type: 'defaultBack', slug: 'gold-trophy' },
  },
  {
    id: 'ten-deep',
    name: 'Ten Game Deep',
    description: 'Complete 10 full games. You are now furniture at game night.',
    metric: 'gamesPlayed',
    target: 10,
    reward: { type: 'defaultBack', slug: 'retro-arcade' },
  },
  {
    id: 'theme-tourist',
    name: 'Theme Tourist',
    description: 'Play 5 different themes. Collect vibes like stamps.',
    metric: 'uniqueThemesPlayed',
    target: 5,
    reward: { type: 'defaultBack', slug: 'comic-boom' },
  },
  {
    id: 'round-hopper',
    name: 'Round Hopper',
    description: 'Play 5 different round types. Variety is the spice of deception.',
    metric: 'uniqueRoundTypesPlayed',
    target: 5,
    reward: { type: 'defaultBack', slug: 'disco-glitter' },
  },
  {
    id: 'caught-red-handed',
    name: 'Caught Red-Handed',
    description: 'Get caught as the liar 5 times. At least you showed up.',
    metric: 'timesLiarCaught',
    target: 5,
    reward: { type: 'defaultBack', slug: 'crime-scene' },
  },
  {
    id: 'verdict-machine',
    name: 'Verdict Machine',
    description: 'Vote correctly 50 times. Jury duty wishes it had your attendance.',
    metric: 'votesCorrect',
    target: 50,
    reward: { type: 'defaultBack', slug: 'glitch-hacker' },
  },
  {
    id: 'saddle-up-sheriff',
    name: 'Saddle Up, Sheriff',
    description: 'Complete 10 games to unlock the Cowboys theme (free path for Wanted: Better Alibis).',
    metric: 'gamesPlayed',
    target: 10,
    reward: { type: 'themeName', themeName: 'Cowboys' },
  },
  {
    id: 'made-man',
    name: 'Made Man',
    description: 'Survive as liar 10 times to unlock Gangsters (free path for Wanted: Better Alibis).',
    metric: 'timesLiarNotCaught',
    target: 10,
    reward: { type: 'themeName', themeName: 'Gangsters' },
  },
  {
    id: 'title-belt',
    name: 'Title Belt Energy',
    description: 'Host 10 games to unlock Wrestlers (free path for Wanted: Better Alibis).',
    metric: 'gamesHosted',
    target: 10,
    reward: { type: 'themeName', themeName: 'Wrestlers' },
  },
];

export const ACHIEVEMENT_PACK_FREE_PATH = {
  packId: 'wanted-better-alibis',
  packName: 'Wanted: Better Alibis',
  reason:
    'Three loud, character-driven themes (Cowboys, Gangsters, Wrestlers) that fit distinct achievement paths (play, liar, host) without overlapping core free themes.',
};

export function getAchievementById(id) {
  return ACHIEVEMENT_DEFINITIONS.find((entry) => entry.id === id) || null;
}
