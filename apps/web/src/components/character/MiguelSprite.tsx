import { motion } from 'framer-motion';
import type { HairStyle, Accessory, Expression } from '@lifequest/shared';

interface Props {
  size?: number;
  bodyType?: 'male' | 'female';
  hairStyle?: HairStyle;
  hairColor?: string;
  skinColor?: string;
  shirtColor?: string;
  pantsColor?: string;
  accessory?: Accessory;
  expression?: Expression;
  animate?: 'idle' | 'celebrate' | 'hurt' | 'none';
}

export function MiguelSprite({
  size = 64,
  bodyType = 'male',
  hairStyle = 'short',
  hairColor = '#2c1810',
  skinColor = '#c68642',
  shirtColor = '#4d96ff',
  pantsColor = '#37474f',
  accessory = 'none',
  expression = 'normal',
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
        {/* Cabello - diferentes estilos */}
        {bodyType === 'female' ? (
          <>
            {/* Female hair styles */}
            {(hairStyle === 'long' || hairStyle === 'ondulado') && (
              <>
                <rect x="9" y="1" width="14" height="5" fill={hairColor} />
                <rect x="8" y="3" width="3" height="6" fill={hairColor} />
                <rect x="21" y="3" width="3" height="6" fill={hairColor} />
                <rect x="8" y="8" width="2" height="16" fill={hairColor} />
                <rect x="22" y="8" width="2" height="16" fill={hairColor} />
              </>
            )}
            {hairStyle === 'short' && (
              <>
                <rect x="10" y="2" width="12" height="5" fill={hairColor} />
                <rect x="8"  y="3" width="2"  height="4" fill={hairColor} />
                <rect x="22" y="3" width="2"  height="4" fill={hairColor} />
                <rect x="10" y="7" width="3" height="1" fill={hairColor} />
                <rect x="19" y="7" width="3" height="1" fill={hairColor} />
              </>
            )}
            {hairStyle === 'recogido' && (
              <>
                <rect x="11" y="1" width="10" height="4" fill={hairColor} />
                <rect x="9" y="3" width="14" height="3" fill={hairColor} />
                <rect x="13" y="6" width="6" height="2" fill={hairColor} />
                <circle cx="19" cy="4" r="2" fill={hairColor} />
              </>
            )}
            {hairStyle === 'trenzas' && (
              <>
                <rect x="10" y="1" width="12" height="4" fill={hairColor} />
                <rect x="8" y="4" width="3" height="10" fill={hairColor} />
                <rect x="22" y="4" width="3" height="10" fill={hairColor} />
                <rect x="9" y="14" width="2" height="3" fill={hairColor} />
                <rect x="21" y="14" width="2" height="3" fill={hairColor} />
              </>
            )}
            {hairStyle === 'afro' && (
              <>
                <rect x="5" y="1" width="22" height="7" fill={hairColor} />
                <rect x="4" y="4" width="24" height="12" fill={hairColor} />
                <circle cx="9" cy="3" r="3.5" fill={hairColor} />
                <circle cx="23" cy="3" r="3.5" fill={hairColor} />
              </>
            )}
          </>
        ) : (
          <>
            {/* Male hair styles */}
            {(hairStyle === 'short' || hairStyle === 'medium') && (
              <>
                <rect x="10" y="1" width="12" height="5" fill={hairColor} />
                <rect x="8"  y="2" width="2"  height="6" fill={hairColor} />
                <rect x="22" y="2" width="2"  height="6" fill={hairColor} />
                <rect x="10" y="6" width="3"  height="2" fill={hairColor} />
                <rect x="19" y="6" width="3"  height="2" fill={hairColor} />
              </>
            )}
            {hairStyle === 'shaved' && (
              <>
                <rect x="10" y="2" width="12" height="2" fill={hairColor} />
              </>
            )}
            {hairStyle === 'copete' && (
              <>
                <rect x="11" y="0" width="10" height="7" fill={hairColor} />
                <rect x="9"  y="3" width="14" height="3" fill={hairColor} />
                <rect x="10" y="6" width="3"  height="1" fill={hairColor} />
                <rect x="19" y="6" width="3"  height="1" fill={hairColor} />
              </>
            )}
            {hairStyle === 'long' && (
              <>
                <rect x="9" y="1" width="14" height="5" fill={hairColor} />
                <rect x="8" y="3" width="2" height="10" fill={hairColor} />
                <rect x="22" y="3" width="2" height="10" fill={hairColor} />
              </>
            )}
            {hairStyle === 'afro' && (
              <>
                <rect x="5" y="1" width="22" height="7" fill={hairColor} />
                <rect x="4" y="4" width="24" height="12" fill={hairColor} />
                <circle cx="9" cy="3" r="3.5" fill={hairColor} />
                <circle cx="23" cy="3" r="3.5" fill={hairColor} />
              </>
            )}
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
        {/* Expresión - Boca */}
        {expression === 'smile' && (
          <>
            <rect x="13" y="13" width="6" height="1" fill="#8b4513" />
            <rect x="13" y="14" width="2" height="1" fill="#c0392b" />
            <rect x="17" y="14" width="2" height="1" fill="#c0392b" />
          </>
        )}
        {expression === 'serious' && (
          <>
            <rect x="13" y="14" width="6" height="1" fill="#8b4513" />
          </>
        )}
        {expression === 'determined' && (
          <>
            <rect x="13" y="13" width="6" height="1" fill="#8b4513" />
            <rect x="14" y="14" width="4" height="1" fill="#ff0000" />
          </>
        )}
        {expression === 'normal' && (
          <>
            <rect x="13" y="13" width="6" height="1" fill="#8b4513" />
            <rect x="14" y="14" width="4" height="1" fill="#c0392b" />
          </>
        )}

        {/* Cuello */}
        <rect x="14" y="16" width="4" height="2" fill={skinColor} />

        {/* Cuerpo / camisa */}
        {bodyType === 'female' ? (
          <>
            {/* Bust/chest area - wider */}
            <rect x="9" y="18" width="14" height="3" fill={shirtColor} />
            {/* Waist - narrower for hourglass shape */}
            <rect x="10" y="21" width="12" height="2" fill={shirtColor} />
            {/* Lower torso - wider again */}
            <rect x="9" y="23" width="14" height="4" fill={shirtColor} />
            {/* Center seam/shadow */}
            <rect x="15" y="18" width="2" height="9" fill={`${shirtColor}88`} />
            {/* Shoulder/neck area */}
            <rect x="13" y="16" width="6" height="2" fill={skinColor} />
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

        {/* Accesorios */}
        {accessory === 'glasses' && (
          <>
            <circle cx="13" cy="9" r="2" fill="#1a1a1a" />
            <circle cx="19" cy="9" r="2" fill="#1a1a1a" />
            <rect x="12" y="8.5" width="2" height="1" fill="#4a90e2" />
            <rect x="18" y="8.5" width="2" height="1" fill="#4a90e2" />
            <rect x="15" y="8.5" width="2" height="1" fill="#333333" />
          </>
        )}
        {accessory === 'cap' && (
          <>
            <rect x="8" y="0" width="16" height="4" fill="#c8a000" />
            <rect x="9" y="1" width="14" height="2" fill="#d4a017" />
            <polygon points="8,4 7,6 10,6 22,6 25,6 24,4" fill="#c8a000" />
            <circle cx="16" cy="2" r="2" fill="#e6c200" />
          </>
        )}
        {accessory === 'headband' && (
          <>
            <rect x="6" y="4" width="20" height="3" fill="#ff1493" />
            <rect x="7" y="5" width="18" height="2" fill="#ff69b4" />
            <circle cx="9" cy="6" r="1" fill="#c0392b" />
            <circle cx="23" cy="6" r="1" fill="#c0392b" />
          </>
        )}
        {accessory === 'earrings' && (
          <>
            <circle cx="8" cy="10" r="1.5" fill="#ffd700" />
            <circle cx="24" cy="10" r="1.5" fill="#ffd700" />
            <rect x="7" y="11" width="2" height="2" fill="#ffed4e" />
            <rect x="23" y="11" width="2" height="2" fill="#ffed4e" />
          </>
        )}
        {accessory === 'scarf' && (
          <>
            <polygon points="12,16 14,18 18,18 20,16 19,18 18,20 14,20 13,18" fill="#e74c3c" />
            <polygon points="13,17 17,17 17,19 13,19" fill="#c0392b" />
          </>
        )}
      </svg>
    </motion.div>
  );
}
