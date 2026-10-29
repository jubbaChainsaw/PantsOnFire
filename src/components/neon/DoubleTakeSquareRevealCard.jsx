import { motion } from 'framer-motion';
import { resolveBundledAssetSrc } from '../../lib/publicAssetUrl.js';
import {
  UI_CARD_DOUBLE_TAKE_BACK_SRC,
  UI_CARD_DOUBLE_TAKE_FRONT_SRC,
  UI_CARD_DOUBLE_TAKE_LIAR_FRONT_SRC,
} from '../../data/uiAssets.js';

/**
 * Square flip card for Double Take (pairs). Outer box matches portrait prompt cards (2:3);
 * the square art is centered at full width inside that footprint.
 */
export default function DoubleTakeSquareRevealCard({
  cardFace = 'back',
  mediaSrc = '',
  isLiar = false,
  isCountingDown = false,
  countdownValue = null,
}) {
  const backSrc = resolveBundledAssetSrc(UI_CARD_DOUBLE_TAKE_BACK_SRC);
  const frameSrc = resolveBundledAssetSrc(
    isLiar ? UI_CARD_DOUBLE_TAKE_LIAR_FRONT_SRC : UI_CARD_DOUBLE_TAKE_FRONT_SRC,
  );
  const pictureSrc = resolveBundledAssetSrc(mediaSrc);

  return (
    <div
      className="relative w-full aspect-[2/3] overflow-visible [perspective:1200px]"
      data-testid="double-take-square-card"
    >
      <motion.div
        animate={{ rotateY: cardFace === 'front' ? 180 : 0 }}
        transition={{ duration: 0.75, ease: 'easeInOut' }}
        className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d]"
      >
        <div className="relative aspect-square w-full max-h-full [transform-style:preserve-3d]">
          <div className="absolute inset-0 [backface-visibility:hidden]">
            {backSrc ? (
              <img
                src={backSrc}
                alt=""
                className="h-full w-full object-contain object-center drop-shadow-[0_16px_34px_rgba(0,0,0,0.55)]"
              />
            ) : null}
            {isCountingDown &&
              typeof countdownValue === 'number' &&
              countdownValue > 0 && (
                <div className="absolute inset-0 z-20 grid place-items-center">
                  <div className="text-8xl font-black text-yellow-300 [text-shadow:0_4px_18px_rgba(0,0,0,0.95)]">
                    {countdownValue}
                  </div>
                </div>
              )}
          </div>

          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            {frameSrc ? (
              <img
                src={frameSrc}
                alt=""
                aria-hidden
                className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain object-center"
              />
            ) : null}
            {pictureSrc ? (
              <img
                src={pictureSrc}
                alt="Your picture clue"
                className="absolute left-[9%] top-[9%] z-0 h-[82%] w-[82%] object-cover object-center"
              />
            ) : (
              <div className="absolute left-[9%] top-[9%] z-0 flex h-[82%] w-[82%] items-center justify-center rounded-lg bg-black/40 text-sm text-white/70">
                Loading picture…
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
