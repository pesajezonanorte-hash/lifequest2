import { useState } from 'react';
import { motion } from 'framer-motion';
import { MiguelSprite } from '../character/MiguelSprite';
import { PixelButton } from '../ui/PixelButton';
import { PixelPanel } from '../ui/PixelPanel';
import { ColorPicker } from './ColorPicker';
import type { AvatarConfig } from '@lifequest/shared';

const HAIR_COLORS = ['#2c1810', '#4a3728', '#8b4513', '#d4a017', '#c8a2c8', '#708090', '#1a1a1a', '#ff6b6b'];
const SKIN_COLORS = ['#fde8d0', '#f5c89f', '#c68642', '#a0522d', '#7b3f2c', '#4a2010'];
const SHIRT_COLORS = ['#4d96ff', '#ff6b9d', '#4ecdc4', '#6bcf7f', '#ffd23f', '#ff6347', '#9b59b6', '#2c3e50', '#e74c3c', '#1abc9c'];
const PANTS_COLORS = ['#37474f', '#1a237e', '#4e342e', '#1b5e20', '#880e4f', '#263238'];

interface Props {
  gender: 'male' | 'female';
  initialConfig: Partial<AvatarConfig>;
  onNext: (config: AvatarConfig) => void;
  onBack: () => void;
}

export function AvatarStep({ gender, initialConfig, onNext, onBack }: Props) {
  const [config, setConfig] = useState<AvatarConfig>({
    bodyType: initialConfig.bodyType ?? gender,
    hairColor: initialConfig.hairColor ?? '#2c1810',
    skinColor: initialConfig.skinColor ?? '#c68642',
    shirtColor: initialConfig.shirtColor ?? '#4d96ff',
    pants: initialConfig.pants ?? '#37474f',
    accessory: null,
    pet: null,
  });

  const update = (key: keyof AvatarConfig) => (value: string) => {
    setConfig((c) => ({ ...c, [key]: value }));
  };

  return (
    <motion.div
      className="flex flex-col gap-5"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
    >
      <div className="text-center">
        <h2 className="font-pixel text-accent-gold mb-1" style={{ fontSize: '11px' }}>
          PERSONALIZA TU AVATAR
        </h2>
        <p className="font-vt text-text-secondary text-xl">
          Elige los colores de tu héroe. Se actualiza en tiempo real.
        </p>
      </div>

      {/* Sprite grande */}
      <div className="flex justify-center">
        <motion.div
          key={JSON.stringify(config)}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          <MiguelSprite
            size={120}
            bodyType={config.bodyType}
            hairColor={config.hairColor}
            skinColor={config.skinColor}
            shirtColor={config.shirtColor}
            pantsColor={config.pants}
            animate="idle"
          />
        </motion.div>
      </div>

      <PixelPanel className="p-4 space-y-4">
        <ColorPicker label="COLOR DE CABELLO" value={config.hairColor} colors={HAIR_COLORS} onChange={update('hairColor')} />
        <ColorPicker label="TONO DE PIEL" value={config.skinColor} colors={SKIN_COLORS} onChange={update('skinColor')} />
        <ColorPicker label="COLOR DE CAMISA" value={config.shirtColor} colors={SHIRT_COLORS} onChange={update('shirtColor')} />
        <ColorPicker label="COLOR DE PANTALÓN" value={config.pants} colors={PANTS_COLORS} onChange={update('pants')} />
      </PixelPanel>

      <div className="flex gap-3">
        <PixelButton variant="ghost" onClick={onBack} className="flex-1">← ATRÁS</PixelButton>
        <PixelButton variant="primary" onClick={() => onNext(config)} className="flex-1">SIGUIENTE →</PixelButton>
      </div>
    </motion.div>
  );
}
