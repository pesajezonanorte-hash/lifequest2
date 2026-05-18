import { motion } from 'framer-motion';
import { MiguelSprite } from '../character/MiguelSprite';
import { PixelButton } from '../ui/PixelButton';
import { getWelcomeLabel, getHeroLabelCapitalized } from '../../utils/gender';

interface Props {
  gender: 'male' | 'female';
  onNext: () => void;
}

const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 1,
  delay: Math.random() * 3,
}));

export function WelcomeStep({ gender, onNext }: Props) {
  return (
    <div className="relative min-h-screen bg-bg-deep flex flex-col items-center justify-center overflow-hidden px-4">
      {/* Estrellas */}
      {STARS.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: s.delay }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm w-full">
        {/* Título */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1
            className="font-pixel text-accent-gold leading-relaxed"
            style={{ fontSize: '14px', textShadow: '3px 3px 0 #0d0620' }}
          >
            {getWelcomeLabel(gender).toUpperCase()},
            <br />
            <span className="text-white">{getHeroLabelCapitalized(gender).toUpperCase()}</span>
          </h1>
        </motion.div>

        {/* Sprite apareciendo desde abajo */}
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
        >
          <MiguelSprite size={100} animate="idle" />
        </motion.div>

        {/* Burbuja de diálogo */}
        <motion.div
          className="relative bg-bg-panel border-4 border-accent-gold shadow-pixel-gold p-4 w-full"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: 'spring' }}
        >
          <span className="absolute -top-3 left-6 bg-accent-gold text-border-pixel font-pixel px-2 py-0.5" style={{ fontSize: '7px' }}>
            SABIO DEL CASTILLO
          </span>
          <p className="font-vt text-text-primary text-lg leading-relaxed">
            ¡Hola! Soy el Sabio del Castillo. 🧙<br />
            Tu vida es una aventura. Hora de empezarla.<br />
            Cuéntame sobre ti antes de comenzar...
          </p>
        </motion.div>

        {/* Subtítulo */}
        <motion.p
          className="font-vt text-text-secondary text-center text-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          El destino del reino depende de ti, {getHeroLabelCapitalized(gender).toLowerCase()}.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <PixelButton variant="primary" onClick={onNext} className="text-sm px-8 py-3">
            ¡COMENZAR! →
          </PixelButton>
        </motion.div>
      </div>
    </div>
  );
}
