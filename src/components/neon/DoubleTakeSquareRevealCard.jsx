import { motion } from 'framer-motion';
import { resolveBundledAssetSrc } from '../../lib/publicAssetUrl.js';
import {
  UI_CARD_DOUBLE_TAKE_BACK_SRC,
  UI_CARD_DOUBLE_TAKE_FRONT_SRC,
  UI_CARD_DOUBLE_TAKE_LIAR_FRONT_SRC,
} from '../../data/uiAssets.js';

/** Transparent window in 1024×1024 frame art (px). */
const PICTURE_WINDOW = {
  truth: { insetPercent: (100 * (1024 - 856)) / 2 / 1024, sizePercent: (100 * 856) / 1024 },
  liar: { insetPercent: (100 * (1024 - 788)) / 2 / 1024, sizePercent: (100 * 788) / 1024 },
};

/**
 * Square flip card for Double Take (pairs). Same max width as portrait prompt cards;
 * the card footprint is 1:1, not 2:3.
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
  const windowSpec = isLiar ? PICTURE_WINDOW.liar : PICTURE_WINDOW.truth;
  const windowStyle = {
    left: `${windowSpec.insetPercent}%`,
    top: `${windowSpec.insetPercent}%`,
    width: `${windowSpec.sizePercent}%`,
    height: `${windowSpec.sizePercent}%`,
  };

  return (
    <div
      className="relative mx-auto w-full max-w-[24.25rem] aspect-square overflow-visible sm:max-w-[26rem] [perspective:1200px]"
      data-testid="double-take-square-card"
      data-card-face={cardFace}
      data-is-liar={isLiar ? 'true' : 'false'}
    >
      <motion.div
        animate={{ rotateY: cardFace === 'front' ? 180 : 0 }}
        transition={{ duration: 0.75, ease: 'easeInOut' }}
        className="absolute inset-0 [transform-style:preserve-3d]"
      >
        <div className="absolute inset-0 [transform-style:preserve-3d]">
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
            {pictureSrc ? (
              <img
                src={pictureSrc}
                alt=""
                className="absolute z-0 object-cover object-center"
                style={windowStyle}
              />
            ) : (
              <div
                className="absolute z-0 flex items-center justify-center bg-black/40 text-sm text-white/70"
                style={windowStyle}
              >
                Loading picture…
              </div>
            )}
            {frameSrc ? (
              <img
                src={frameSrc}
                alt=""
                aria-hidden
                className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain object-center"
              />
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
