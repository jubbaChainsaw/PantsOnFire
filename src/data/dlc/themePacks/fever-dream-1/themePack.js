/**
 * SECRET referral-unlock theme. Not purchasable and must not be listed in the
 * store or theme picker until unlocked. Before unlock, show only a mystery
 * "secret deck" placeholder (see mysteryIcon) telling players to get friends to join.
 */
export const FEVER_DREAM_1_THEME_PACK = {
  id: 'fever-dream-1',
  name: 'Fever Dream Vol. 1',
  releaseChannel: 'secret',
  unlockType: 'referral',
  referralsRequired: 1,
  secret: true,
  hidden: true,
  locked: true,
  purchasable: false,
  pricePence: null,
  priceLabel: null,
  description: 'Lying robot butlers, crabs in suits and a mushroom bishop. Nobody knows who dreamt them up.',
  mysteryName: 'Secret Theme ???',
  mysteryDescription: 'Get 1 friend to join through your link to unlock a secret theme and card deck.',
  mysteryIcon: '/assets/themes/fever-dream-1/icons/mystery.svg',
  themes: ['Fever Dream Vol. 1'],
};
