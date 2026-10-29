/**
 * SECRET referral-unlock theme. Not purchasable and must not be listed in the
 * store or theme picker until unlocked. Before unlock, show only a mystery
 * "secret deck" placeholder (see mysteryIcon) telling players to get friends to join.
 */
export const FEVER_DREAM_2_THEME_PACK = {
  id: 'fever-dream-2',
  name: 'Fever Dream Vol. 2',
  releaseChannel: 'secret',
  unlockType: 'referral',
  referralsRequired: 3,
  secret: true,
  hidden: true,
  locked: true,
  purchasable: false,
  pricePence: null,
  priceLabel: null,
  description: 'Snail senators, teapot aristocrats and a brain in a jar. The dream got weirder.',
  mysteryName: 'Secret Theme ???',
  mysteryDescription:
    'Get 3 friends to sign up through your link and make their first paid upgrade to unlock a secret theme.',
  mysteryIcon: '/assets/themes/fever-dream-2/icons/mystery.svg',
  themes: ['Fever Dream Vol. 2'],
};
