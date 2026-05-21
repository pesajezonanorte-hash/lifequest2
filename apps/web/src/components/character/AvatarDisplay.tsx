import { motion } from 'framer-motion';
import { MiguelSprite } from './MiguelSprite';
import type { AvatarConfig } from '@lifequest/shared';

const AURA_STYLES: Record<string, { gradient: string; shadow: string }> = {
  aura_fire:    { gradient: 'radial-gradient(ellipse at center, #ff6b0044 0%, #ff000022 60%, transparent 100%)', shadow: '0 0 20px 6px #ff6b0066' },
  aura_ice:     { gradient: 'radial-gradient(ellipse at center, #7dd3fc44 0%, #38bdf822 60%, transparent 100%)', shadow: '0 0 20px 6px #7dd3fc66' },
  aura_gold:    { gradient: 'radial-gradient(ellipse at center, #ffd23f44 0%, #f59e0b22 60%, transparent 100%)', shadow: '0 0 20px 6px #ffd23f88' },
  aura_storm:   { gradient: 'radial-gradient(ellipse at center, #a78bfa44 0%, #7c3aed22 60%, transparent 100%)', shadow: '0 0 20px 6px #a78bfa66' },
  aura_rainbow: { gradient: 'conic-gradient(from 0deg, #ff000022, #ff7f0022, #ffff0022, #00ff0022, #0000ff22, #8b00ff22, #ff000022)', shadow: '0 0 20px 6px rgba(255,200,50,0.4)' },
};

interface Props {
  avatarConfig?: unknown;
  equippedAura?: string | null;
  equippedFrame?: string | null;
  size?: number;
  animate?: 'idle' | 'celebrate' | 'hurt' | 'none';
  mood?: number;
  className?: string;
}

export function AvatarDisplay({
  avatarConfig,
  equippedAura,
  equippedFrame,
  size = 48,
  animate = 'idle',
  mood,
  className = '',
}: Props) {
  const cfg = (avatarConfig ?? {}) as Partial<AvatarConfig & Record<string, unknown>>;
  const aura = equippedAura && AURA_STYLES[equippedAura] ? AURA_STYLES[equippedAura] : null;

  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}>
      {aura && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: aura.gradient, boxShadow: aura.shadow }}
          animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.08, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <div
        style={
          equippedFrame
            ? { border: '2px solid var(--accent-gold, #d4a017)', boxShadow: '0 0 8px #d4a01744', borderRadius: '50%', overflow: 'hidden' }
            : undefined
        }
      >
        <MiguelSprite
          size={size}
          bodyType={cfg.bodyType}
          hairStyle={cfg.hairStyle}
          hairColor={cfg.hairColor}
          skinColor={cfg.skinColor}
          shirtColor={cfg.shirtColor}
          pantsColor={cfg.pants}
          accessory={cfg.accessory}
          expression={cfg.expression}
          animate={animate}
          mood={mood}
        />
      </div>
    </div>
  );
}
