import { motion } from 'framer-motion';

interface Props {
  size?: number;
  bodyType?: 'male' | 'female';
  hairColor?: string;
  skinColor?: string;
  shirtColor?: string;
  pantsColor?: string;
  animate?: 'idle' | 'celebrate' | 'hurt' | 'none';
}

export function MiguelSprite({
  size = 64,
  bodyType = 'male',
  hairColor = '#2c1810',
  skinColor = '#c68642',
  shirtColor = '#4d96ff',
  pantsColor = '#37474f',
  animate = 'idle',
}: Props) {
  const idleVariants = {
    animate: {
      scaleY: [1, 0.97, 1, 0.97, 1],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    },
  };

  const celebrateVariants = {
    animate: {
      y: [0, -8, 0, -4, 0],
      rotate: [0, -3, 3, -2, 0],
      transition: { duration: 0.6, repeat: 2, ease: 'easeOut' },
    },
  };

  const hurtVariants = {
    animate: {
      x: [-6, 6, -4, 4, 0],
      opacity: [1, 0.4, 1, 0.4, 1],
      transition: { duration: 0.5 },
    },
  };

  const variants = {
    idle: idleVariants,
    celebrate: celebrateVariants,
    hurt: hurtVariants,
    none: {},
  };

  return (
    <motion.div
      style={{ width: size, height: size * 1.25, imageRendering: 'pixelated' }}
      variants={variants[animate]}
      animate="animate"
      className="inline-block"
    >
      <svg
        width={size}
        height={size * 1.25}
        viewBox="0 0 32 40"
        xmlns="http://www.w3.org/2000/svg"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Cabello */}
        {bodyType === 'female' ? (
          <>
            <rect x="9" y="2" width="14" height="4" fill={hairColor} />
            <rect x="8" y="4" width="2" height="18" fill={hairColor} />
            <rect x="22" y="4" width="2" height="18" fill={hairColor} />
            <rect x="10" y="6" width="2" height="3" fill={hairColor} />
            <rect x="20" y="6" width="2" height="3" fill={hairColor} />
            <rect x="10" y="18" width="2" height="6" fill={hairColor} />
            <rect x="20" y="18" width="2" height="6" fill={hairColor} />
          </>
        ) : (
          <>
            <rect x="10" y="2" width="12" height="4" fill={hairColor} />
            <rect x="9"  y="3" width="1"  height="6" fill={hairColor} />
            <rect x="22" y="3" width="1"  height="6" fill={hairColor} />
            <rect x="10" y="6" width="2"  height="2" fill={hairColor} />
            <rect x="20" y="6" width="2"  height="2" fill={hairColor} />
          </>
        )}

        {/* Cara */}
        <rect x="10" y="6"  width="12" height="10" fill={skinColor} />
        {/* Ojos */}
        <rect x="12" y="9"  width="2" height="2" fill="#1a1033" />
        <rect x="18" y="9"  width="2" height="2" fill="#1a1033" />
        {/* Brillo en ojos */}
        <rect x="13" y="9"  width="1" height="1" fill="white" />
        <rect x="19" y="9"  width="1" height="1" fill="white" />
        {/* Boca */}
        <rect x="13" y="13" width="6" height="1" fill="#8b4513" />
        <rect x="14" y="14" width="4" height="1" fill="#c0392b" />

        {/* Cuello */}
        <rect x="14" y="16" width="4" height="2" fill={skinColor} />

        {/* Cuerpo / camisa */}
        {bodyType === 'female' ? (
          <>
            <rect x="10" y="18" width="12" height="4" fill={shirtColor} />
            <rect x="9" y="22" width="14" height="6" fill={shirtColor} />
            <rect x="11" y="28" width="10" height="2" fill={shirtColor} />
            <rect x="15" y="18" width="2" height="10" fill={`${shirtColor}88`} />
            <rect x="12" y="18" width="8" height="2" fill={skinColor} />
          </>
        ) : (
          <>
            <rect x="9"  y="18" width="14" height="10" fill={shirtColor} />
            <rect x="15" y="18" width="2"  height="10" fill={`${shirtColor}88`} />
            <rect x="12" y="18" width="8"  height="2"  fill={skinColor} />
          </>
        )}

        {/* Brazos */}
        <rect x="5"  y="18" width="4"  height="8"  fill={shirtColor} />
        <rect x="23" y="18" width="4"  height="8"  fill={shirtColor} />
        {/* Manos */}
        <rect x="5"  y="26" width="4"  height="3"  fill={skinColor} />
        <rect x="23" y="26" width="4"  height="3"  fill={skinColor} />

        {/* Cinturón */}
        <rect x="9"  y="28" width="14" height="2"  fill="#5d4037" />
        <rect x="14" y="28" width="4"  height="2"  fill="#ffd23f" />

        {/* Pantalón */}
        <rect x="9"  y="30" width="6"  height="8"  fill={pantsColor} />
        <rect x="17" y="30" width="6"  height="8"  fill={pantsColor} />
        {/* Separación piernas */}
        <rect x="15" y="30" width="2"  height="6"  fill="#1a1033" />

        {/* Zapatos */}
        <rect x="8"  y="37" width="7"  height="3"  fill="#212121" />
        <rect x="17" y="37" width="7"  height="3"  fill="#212121" />

        {/* Sombra bajo los pies */}
        <ellipse cx="16" cy="40" rx="8" ry="1" fill="rgba(0,0,0,0.3)" />
      </svg>
    </motion.div>
  );
}
