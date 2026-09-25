import { motion } from 'framer-motion';
import { E } from '@/components/ui/glyphs';

interface Props {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

function getFlameConfig(streak: number) {
  if (streak >= 30) return { emoji: '🔥', label: `${streak}d`, color: 'var(--accent-gold)', glow: 'var(--accent-gold)', scale: 1.4, particles: true };
  if (streak >= 7)  return { emoji: '🔥', label: `${streak}d`, color: 'color-mix(in oklab, var(--accent-gold) 85%, var(--text-primary))', glow: 'var(--accent-gold)', scale: 1.2, particles: false };
  if (streak >= 3)  return { emoji: '🔥', label: `${streak}d`, color: 'color-mix(in oklab, var(--accent-gold) 65%, var(--text-muted))', glow: 'transparent', scale: 1.0, particles: false };
  if (streak >= 1)  return { emoji: '🔥', label: `${streak}d`, color: 'color-mix(in oklab, var(--accent-gold) 45%, var(--text-muted))', glow: 'transparent', scale: 0.85, particles: false };
  return { emoji: '💨', label: '0d', color: 'var(--text-muted)', glow: 'transparent', scale: 0.7, particles: false };
}

export function StreakFlame({ streak, size = 'md' }: Props) {
  const cfg = getFlameConfig(streak);
  const baseSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-4xl' : 'text-2xl';
  const labelSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-xl' : 'text-base';

  return (
    <div className="flex flex-col items-center gap-0.5">
      <motion.div
        className={`relative ${baseSize}`}
        animate={{
          scale: [cfg.scale, cfg.scale * 1.1, cfg.scale],
          filter: streak > 0
            ? [`drop-shadow(0 0 4px ${cfg.glow})`, `drop-shadow(0 0 10px ${cfg.glow})`, `drop-shadow(0 0 4px ${cfg.glow})`]
            : [],
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <E e={cfg.emoji} />

        {/* Particles for 30+ day streaks */}
        {cfg.particles && [0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{ backgroundColor: cfg.color, top: '50%', left: '50%' }}
            animate={{
              x: [0, (i - 1) * 20],
              y: [0, -30 - i * 8],
              opacity: [1, 0],
              scale: [1, 0.3],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeOut',
            }}
          />
        ))}
      </motion.div>

      <span className={`font-vt ${labelSize}`} style={{ color: cfg.color }}>
        {cfg.label}
      </span>
    </div>
  );
}
