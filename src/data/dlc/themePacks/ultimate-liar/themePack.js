/**
 * Secret referral-conversion theme. Unlocked when an invitee makes their first
 * paid purchase. Not sold in the store; personas and full art ship later.
 */
export const ULTIMATE_LIAR_THEME_PACK = {
  id: 'ultimate-liar',
  name: 'Ultimate Liar',
  releaseChannel: 'secret',
  unlockType: 'referral-paid-conversion',
  secret: true,
  hidden: true,
  locked: true,
  purchasable: false,
  pricePence: null,
  priceLabel: null,
  description: 'The final boss of fibbing. Content arriving soon.',
  mysteryName: 'Ultimate Liar ???',
  mysteryDescription:
    'Invite a friend who upgrades. When they make their first paid purchase, you unlock this secret theme.',
  mysteryIcon: '/assets/themes/ultimate-liar/icons/mystery-lock.svg',
  themes: ['Ultimate Liar'],
};

export const ULTIMATE_LIAR_THEME_NAME = 'Ultimate Liar';
